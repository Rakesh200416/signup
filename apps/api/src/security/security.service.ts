import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toDataURL } from "qrcode";
import * as speakeasy from "speakeasy";
import { hash, verify as argonVerify } from "argon2";

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  private buildBackupCodes() {
    return Array.from({ length: 8 }, () =>
      Math.random().toString(36).slice(2, 10).toUpperCase(),
    );
  }

  async initializeTwoFactor(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
      name: `LMS SuperAdmin (${email})`,
      length: 20,
    });

    const otpauthUrl = secret.otpauth_url as string;
    const qrCodeDataUrl = await toDataURL(otpauthUrl);
    const backupCodes = this.buildBackupCodes();
    const hashedBackupCodes = await Promise.all(backupCodes.map((code) => hash(code)));

    await this.prisma.security.upsert({
      where: { userId },
      update: {
        totpSecret: secret.base32,
        backupCodes: hashedBackupCodes,
      },
      create: {
        userId,
        securityQuestions: [],
        totpSecret: secret.base32,
        backupCodes: hashedBackupCodes,
      },
    });

    return { otpauthUrl, qrCodeDataUrl, backupCodes };
  }

  async verifyTotp(secret: string | undefined, code?: string) {
    if (!secret || !code) {
      return false;
    }
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: code,
      window: 1,
    });
  }

  async verifyBackupCode(userId: string, backupCode: string) {
    const security = await this.prisma.security.findUnique({ where: { userId } });
    if (!security) {
      return false;
    }

    const codes = security.backupCodes as string[];
    for (const hashedCode of codes) {
      if (await argonVerify(hashedCode, backupCode)) {
        const nextCodes = codes.filter((codeHash) => codeHash !== hashedCode);
        await this.prisma.security.update({
          where: { userId },
          data: { backupCodes: nextCodes },
        });
        return true;
      }
    }
    return false;
  }

  async verifySecurityQuestions(
    userId: string,
    submittedAnswers: { question: string; answer: string }[],
  ) {
    const security = await this.prisma.security.findUnique({ where: { userId } });
    if (!security) {
      return false;
    }

    const questions = security.securityQuestions as Array<{ question: string; answerHash: string }>;
    let matches = 0;
    const normalized = submittedAnswers.map((answer) => ({
      question: answer.question.trim().toLowerCase(),
      answer: answer.answer.trim(),
    }));

    for (const stored of questions) {
      const normalizedStored = stored.question.trim().toLowerCase();
      const match = normalized.find((entry) => entry.question === normalizedStored);
      if (match && (await argonVerify(stored.answerHash, match.answer))) {
        matches += 1;
      }
    }

    return matches >= 2;
  }
}
