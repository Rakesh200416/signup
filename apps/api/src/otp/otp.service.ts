import { Injectable, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomInt } from "crypto";

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  private generateNumericCode() {
    return randomInt(100000, 999999).toString();
  }

  generateOtpCode() {
    return this.generateNumericCode();
  }

  async createOtpForUser(userId: string) {
    const code = this.generateNumericCode();
    const expiry = new Date(Date.now() + 1000 * 60 * 10);

    return this.prisma.verification.upsert({
      where: { userId },
      update: {
        emailOTP: code,
        phoneOTP: code,
        otpExpiry: expiry,
        failedAttempts: 0,
        lockedUntil: null,
      },
      create: {
        userId,
        emailOTP: code,
        phoneOTP: code,
        otpExpiry: expiry,
      },
    });
  }

  async validateOtp(userId: string, code: string) {
    const verification = await this.prisma.verification.findUnique({ where: { userId } });
    if (!verification) {
      throw new BadRequestException("OTP record not found.");
    }

    if (verification.lockedUntil && verification.lockedUntil > new Date()) {
      throw new ForbiddenException("OTP flow locked due to repeated failures.");
    }

    if (verification.otpExpiry < new Date()) {
      throw new BadRequestException("OTP expired. Request a new verification code.");
    }

    if (verification.emailOTP !== code && verification.phoneOTP !== code) {
      await this.incrementFailedAttempt(userId);
      throw new BadRequestException("OTP did not match.");
    }

    await this.prisma.verification.update({
      where: { userId },
      data: { failedAttempts: 0, lockedUntil: null },
    });

    return true;
  }

  async incrementFailedAttempt(userId: string) {
    const verification = await this.prisma.verification.findUnique({ where: { userId } });
    if (!verification) {
      return;
    }

    const attempts = verification.failedAttempts + 1;
    const data: any = { failedAttempts: attempts };
    if (attempts >= 5) {
      data.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    await this.prisma.verification.update({ where: { userId }, data });
  }
}
