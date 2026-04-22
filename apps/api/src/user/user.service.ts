import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: "insensitive",
        },
      },
      include: {
        profile: true,
        security: true,
        verification: true,
      },
    });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        security: true,
        verification: true,
      },
    });
  }

  findByPhone(phone: string) {
    // Normalize: extract last 10 digits to handle +91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
    const digits = phone.replace(/[^\d]/g, '');
    const last10 = digits.slice(-10);
    if (!last10 || last10.length < 7) return Promise.resolve(null);
    return this.prisma.user.findFirst({
      where: {
        profile: {
          phonePrimary: { endsWith: last10 },
        },
      },
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
    username?: string;
    password: string;
    profile: {
      govtIdType: string;
      govtIdUrl?: string | null;
      phonePrimary: string;
      phoneSecondary?: string;
      backupEmail?: string;
      secondaryApproverName?: string;
      secondaryApproverEmail?: string;
      secondaryApproverPhone?: string;
      googleId?: string | null;
      ipWhitelist?: string[];
    };
    securityQuestions: Array<{ question: string; answerHash: string }>;
    backupCodes: string[];
  }) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        username: data.username ?? null,
        password: data.password,
        role: "SUPER_ADMIN",
        isVerified: false,
        isApproved: true,
        profile: {
          create: {
            govtIdType: data.profile.govtIdType,
            govtIdUrl: data.profile.govtIdUrl ?? null,
            phonePrimary: data.profile.phonePrimary,
            phoneSecondary: data.profile.phoneSecondary ?? null,
            backupEmail: data.profile.backupEmail ?? null,
            secondaryApproverName: data.profile.secondaryApproverName ?? null,
            secondaryApproverEmail: data.profile.secondaryApproverEmail ?? null,
            secondaryApproverPhone: data.profile.secondaryApproverPhone ?? null,
            googleId: data.profile.googleId ?? null,
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
            emailOTP: null,
            phoneOTP: null,
            otpExpiry: null,
            failedAttempts: 0,
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

  async createPlatformAdmin(data: {
    name: string;
    email: string;
    password: string;
    profile: {
      govtIdType: string;
      govtIdUrl?: string | null;
      profilePhotoUrl?: string | null;
      phonePrimary: string;
      phoneSecondary?: string;
      backupEmail?: string;
      secondaryApproverName?: string;
      secondaryApproverEmail?: string;
      secondaryApproverPhone?: string;
      googleId?: string | null;
      ipWhitelist?: string[];
    };
    securityQuestions: Array<{ question: string; answerHash: string }>;
    backupCodes: string[];
  }) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "PLATFORM_ADMIN",
        isVerified: false,
        isApproved: true,
        profile: {
          create: {
            govtIdType: data.profile.govtIdType,
            govtIdUrl: data.profile.govtIdUrl ?? null,
            profilePhotoUrl: data.profile.profilePhotoUrl ?? null,
            phonePrimary: data.profile.phonePrimary,
            phoneSecondary: data.profile.phoneSecondary ?? null,
            backupEmail: data.profile.backupEmail ?? null,
            secondaryApproverName: data.profile.secondaryApproverName ?? null,
            secondaryApproverEmail: data.profile.secondaryApproverEmail ?? null,
            secondaryApproverPhone: data.profile.secondaryApproverPhone ?? null,
            googleId: data.profile.googleId ?? null,
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
            emailOTP: null,
            phoneOTP: null,
            otpExpiry: null,
            failedAttempts: 0,
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

  async createInstitutionAdmin(data: {
    name: string;
    email: string;
    password: string;
    profile: {
      phonePrimary: string;
      backupEmail?: string;
      googleId?: string | null;
      ipWhitelist?: string[];
    };
  }) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "INSTITUTION_ADMIN",
        isVerified: false,
        isApproved: true,
        profile: {
          create: {
            govtIdType: "INSTITUTION_ADMIN",
            govtIdUrl: null,
            profilePhotoUrl: null,
            phonePrimary: data.profile.phonePrimary,
            phoneSecondary: null,
            backupEmail: data.profile.backupEmail ?? null,
            googleId: data.profile.googleId ?? null,
            ipWhitelist: data.profile.ipWhitelist ?? [],
          },
        },
        security: {
          create: {
            securityQuestions: [],
            totpSecret: null,
            backupCodes: [],
          },
        },
        verification: {
          create: {
            emailOTP: null,
            phoneOTP: null,
            otpExpiry: null,
            failedAttempts: 0,
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

  async createLearner(data: {
    name: string;
    email: string;
    password: string;
  }) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "STUDENT",
        isVerified: false,
        isApproved: true,
        profile: {
          create: {
            govtIdType: "LEARNER",
            govtIdUrl: null,
            profilePhotoUrl: null,
            phonePrimary: "",
            phoneSecondary: null,
            backupEmail: null,
            googleId: null,
            ipWhitelist: [],
          },
        },
        security: {
          create: {
            securityQuestions: [],
            totpSecret: null,
            backupCodes: [],
          },
        },
        verification: {
          create: {
            emailOTP: null,
            phoneOTP: null,
            otpExpiry: null,
            failedAttempts: 0,
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

  async createCoordinator(data: {
    name: string;
    email: string;
    password: string;
    profile: {
      phonePrimary: string;
      googleId?: string | null;
      ipWhitelist?: string[];
    };
  }) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "INSTITUTION_COORDINATOR",
        isVerified: false,
        isApproved: true,
        profile: {
          create: {
            govtIdType: "INSTITUTION_COORDINATOR",
            govtIdUrl: null,
            profilePhotoUrl: null,
            phonePrimary: data.profile.phonePrimary,
            phoneSecondary: null,
            backupEmail: null,
            googleId: data.profile.googleId ?? null,
            ipWhitelist: [],
          },
        },
        security: {
          create: {
            securityQuestions: [],
            totpSecret: null,
            backupCodes: [],
          },
        },
        verification: {
          create: {
            emailOTP: null,
            phoneOTP: null,
            otpExpiry: null,
            failedAttempts: 0,
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

  async createFaculty(data: {
    name: string;
    email: string;
    password: string;
    profile: {
      googleId?: string | null;
      ipWhitelist?: string[];
    };
  }) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "FACULTY",
        isVerified: false,
        isApproved: true,
        profile: {
          create: {
            govtIdType: "FACULTY",
            govtIdUrl: null,
            profilePhotoUrl: null,
            phonePrimary: "",
            phoneSecondary: null,
            backupEmail: null,
            googleId: data.profile.googleId ?? null,
            ipWhitelist: data.profile.ipWhitelist ?? [],
          },
        },
        security: {
          create: {
            securityQuestions: [],
            totpSecret: null,
            backupCodes: [],
          },
        },
        verification: {
          create: {
            emailOTP: null,
            phoneOTP: null,
            otpExpiry: null,
            failedAttempts: 0,
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
