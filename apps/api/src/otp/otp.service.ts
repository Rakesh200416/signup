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

  async createOtpForUser(
    userId: string,
    method: OtpDeliveryMethod,
    destination: string,
    expiresInMinutes = 10,
    maxRequests = 5,
    trackPrimaryCounter = true,
  ) {
    const verification = await this.prisma.verification.upsert({
      where: { userId },
      create: {
        userId,
        emailOTP: null,
        phoneOTP: null,
        otpExpiry: null,
        failedAttempts: 0,
        otpRequestCount: 0,
        otpRequestBlockedUntil: null,
      },
      update: {},
    });

    const now = new Date();
    const blockWindowMs = 5 * 60 * 60 * 1000;
    const windowStart = new Date(now.getTime() - blockWindowMs);

    const recentCount = await this.prisma.otpCode.count({
      where: {
        userId,
        method,
        destination,
        createdAt: { gte: windowStart },
      },
    });

    if (recentCount >= maxRequests) {
      throw new ForbiddenException(`OTP generation is temporarily limited for this contact. You can request again after 5 hours.`);
    }

    const nextRequestCount = recentCount + 1;
    const limitReached = nextRequestCount >= maxRequests;

    if (trackPrimaryCounter) {
      await this.prisma.verification.update({
        where: { userId },
        data: {
          otpRequestCount: (verification.otpRequestCount ?? 0) + 1,
          ...(limitReached ? { otpRequestBlockedUntil: new Date(Date.now() + blockWindowMs) } : {}),
        },
      });
    }

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

    return { code, expiresAt, limitReached };
  }

  async validateOtp(userId: string, code: string, consume = true) {
    console.log(`Validating OTP for user ${userId}, code: ${code}, env: ${process.env.NODE_ENV}`);
    
    // In development, accept test OTP
    if (process.env.NODE_ENV !== "production" && code?.trim() === "123456") {
      console.log("Accepting test OTP");
      if (consume) {
        await this.prisma.verification.upsert({
          where: { userId },
          update: { failedAttempts: 0 },
          create: {
            userId,
            emailOTP: null,
            phoneOTP: null,
            otpExpiry: null,
            failedAttempts: 0,
            otpRequestCount: 0,
            otpRequestBlockedUntil: null,
          },
        });
      }
      return true;
    }

    const verification = await this.prisma.verification.findUnique({ where: { userId } });
    const normalizedCode = code?.trim();
    if (!verification) {
      throw new BadRequestException("OTP record not found.");
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

    const resetData: any = {
      failedAttempts: 0,
      lockedUntil: null,
      otpRequestCount: 0,
      otpRequestBlockedUntil: null,
    };

    if (consume) {
      await this.prisma.$transaction([
        this.prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { isConsumed: true },
        }),
        this.prisma.verification.update({
          where: { userId },
          data: resetData,
        }),
      ]);
    } else {
      await this.prisma.verification.update({
        where: { userId },
        data: resetData,
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

    await this.prisma.verification.update({ where: { userId }, data });
  }
}
