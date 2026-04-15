import { Injectable, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomInt } from "crypto";
import { hash, verify as argonVerify, argon2id } from "argon2";
import { OtpDeliveryMethod } from "@prisma/client";

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  private generateNumericCode() {
    return randomInt(100000, 999999).toString().padStart(6, "0");
  }

  private async hashCode(code: string) {
    return hash(code, { type: argon2id });
  }

  async createOtpForUser(userId: string, method: OtpDeliveryMethod, destination: string, expiresInMinutes = 10) {
    const code = this.generateNumericCode();
    const codeHash = await this.hashCode(code);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.prisma.otpCode.create({
      data: {
        userId,
        method,
        destination,
        codeHash,
        expiresAt,
      },
    });

    await this.prisma.verification.upsert({
      where: { userId },
      create: {
        userId,
        emailOTP: null,
        phoneOTP: null,
        otpExpiry: null,
        failedAttempts: 0,
      },
      update: {
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    return { code, expiresAt };
  }

  async validateOtp(userId: string, code: string, consume = true) {
    const verification = await this.prisma.verification.findUnique({ where: { userId } });
    const normalizedCode = code?.trim();
    if (!verification) {
      throw new BadRequestException("OTP record not found.");
    }

    if (verification.lockedUntil && verification.lockedUntil > new Date()) {
      throw new ForbiddenException("OTP flow locked due to repeated failures.");
    }

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        isConsumed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new BadRequestException("OTP expired or invalid. Request a new verification code.");
    }

    if (!normalizedCode || !(await argonVerify(otpRecord.codeHash, normalizedCode))) {
      await this.incrementFailedAttempt(userId);
      throw new BadRequestException("OTP did not match.");
    }

    if (consume) {
      await this.prisma.$transaction([
        this.prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { isConsumed: true },
        }),
        this.prisma.verification.update({
          where: { userId },
          data: { failedAttempts: 0, lockedUntil: null },
        }),
      ]);
    } else {
      await this.prisma.verification.update({
        where: { userId },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }

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
