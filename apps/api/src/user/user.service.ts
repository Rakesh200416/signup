import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        security: true,
        verification: true,
      },
    });
  }

  async createSuperAdmin(data: {
    name: string;
    email: string;
    password: string;
    profile: {
      govtIdType: string;
      govtIdUrl: string;
      phonePrimary: string;
      phoneSecondary?: string;
      backupEmail?: string;
      ipWhitelist?: string[];
    };
    securityQuestions: Array<{ question: string; answerHash: string }>;
    backupCodes: string[];
    otpCode: string;
  }) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "SUPER_ADMIN",
        isVerified: false,
        isApproved: false,
        profile: {
          create: {
            govtIdType: data.profile.govtIdType,
            govtIdUrl: data.profile.govtIdUrl,
            phonePrimary: data.profile.phonePrimary,
            phoneSecondary: data.profile.phoneSecondary ?? null,
            backupEmail: data.profile.backupEmail ?? null,
            ipWhitelist: data.profile.ipWhitelist ?? [],
          },
        },
        security: {
          create: {
            securityQuestions: data.securityQuestions as any,
            totpSecret: null,
            backupCodes: data.backupCodes,
          },
        },
        verification: {
          create: {
            emailOTP: data.otpCode,
            phoneOTP: data.otpCode,
            otpExpiry: new Date(Date.now() + 1000 * 60 * 10),
          },
        },
      },
      include: {
        profile: true,
        security: true,
        verification: true,
      },
    });
  }
}
