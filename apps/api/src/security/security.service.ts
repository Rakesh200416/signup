import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toDataURL } from "qrcode";
import * as speakeasy from "speakeasy";
import { hash, verify as argonVerify } from "argon2";

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  private async safeVerifyHash(hashValue: string, raw: string): Promise<boolean> {
    try {
      return await argonVerify(hashValue, raw);
    } catch {
      return false;
    }
  }

  private buildBackupCodes() {
    return Array.from({ length: 8 }, () =>
      Math.random().toString(36).slice(2, 10).toUpperCase(),
    );
  }

  /** Generates a TOTP secret + QR code without writing to the DB (pre-signup use). */
  async generateTotpSecret(email: string): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> {
    const secret = speakeasy.generateSecret({
      name: `LMS SuperAdmin (${email})`,
      length: 20,
    });
    const otpauthUrl = secret.otpauth_url as string;
    const qrCodeDataUrl = await toDataURL(otpauthUrl);
    return { secret: secret.base32, otpauthUrl, qrCodeDataUrl };
  }

  async generateTotpQrFromSecret(
    email: string,
    secret: string,
  ): Promise<{ otpauthUrl: string; qrCodeDataUrl: string }> {
    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: `LMS SuperAdmin (${email})`,
      issuer: "LMS SuperAdmin",
      encoding: "base32",
    });
    const qrCodeDataUrl = await toDataURL(otpauthUrl);
    return { otpauthUrl, qrCodeDataUrl };
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

    const normalizedCode = code.replace(/\s+/g, "").trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      return false;
    }

    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: normalizedCode,
      // Allow a small amount of device clock drift in either direction.
      window: 2,
    });
  }

  async verifyBackupCode(userId: string, backupCode: string, consume = true) {
    const security = await this.prisma.security.findUnique({ where: { userId } });
    if (!security) {
      return false;
    }

    const normalizedCode = backupCode.trim().toUpperCase();
    if (!normalizedCode) {
      return false;
    }

    const codes = security.backupCodes as string[];
    for (const hashedCode of codes) {
      if (await this.safeVerifyHash(hashedCode, normalizedCode)) {
        if (consume) {
          const nextCodes = codes.filter((codeHash) => codeHash !== hashedCode);
          await this.prisma.security.update({
            where: { userId },
            data: { backupCodes: nextCodes },
          });
        }
        return true;
      }
    }
    return false;
  }

  async verifyRecoveryCode(userId: string, recoveryCode: string, consume = true) {
    const normalizedCode = recoveryCode.trim().toUpperCase();
    if (!normalizedCode) {
      return false;
    }

    const existingCodes = await this.prisma.recoveryCode.findMany({
      where: { userId, isUsed: false },
    });
    for (const record of existingCodes) {
      if (await this.safeVerifyHash(record.codeHash, normalizedCode)) {
        if (consume) {
          await this.prisma.recoveryCode.update({
            where: { id: record.id },
            data: { isUsed: true },
          });
        }
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
      if (match && (await this.safeVerifyHash(stored.answerHash, match.answer))) {
        matches += 1;
      }
    }

    return matches >= 2;
  }

  async verifySecurityAnswers(userId: string, answers: string[]) {
    const security = await this.prisma.security.findUnique({ where: { userId } });
    if (!security) {
      return false;
    }

    const questions = security.securityQuestions as Array<{ question: string; answerHash: string }>;
    let matches = 0;

    for (const answer of answers) {
      const normalizedAnswer = answer.trim();
      if (!normalizedAnswer) {
        continue;
      }

      for (const stored of questions) {
        if (await this.safeVerifyHash(stored.answerHash, normalizedAnswer)) {
          matches += 1;
          break;
        }
      }

      if (matches >= 2) {
        return true;
      }
    }

    return matches >= 2;
  }
}
