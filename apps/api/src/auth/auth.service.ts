import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OtpDeliveryMethod } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UserService } from "../user/user.service";
import { OtpService } from "../otp/otp.service";
import { SecurityService } from "../security/security.service";
import { EmailService } from "../email/email.service";
import { SmsService } from "../sms/sms.service";
import { StorageService } from "../storage/storage.service";
import { SignupDto } from "./dto/signup.dto";
import { FacultySignupDto } from "./dto/faculty-signup.dto";
import { InstitutionAdminSignupDto } from "./dto/institution-admin-signup.dto";
import { SendOtpDto } from "./dto/send-otp.dto";
import { LoginDto } from "./dto/login.dto";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Setup2FADto } from "./dto/setup-2fa.dto";
import { RecoverDto } from "./dto/recover.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { LearnerSignupDto } from "./dto/learner-signup.dto";
import { hash, verify, argon2id } from "argon2";
import { randomUUID } from "crypto";
import { sign } from "jsonwebtoken";
import { jwtConstants } from "./auth.constants";
import * as speakeasy from "speakeasy";
import { toDataURL } from "qrcode";

@Injectable()
export class AuthService {
  /** In-memory store for pre-signup OTP codes (no user account needed). */
  private readonly signupOtpCache = new Map<string, { codeHash: string; expiresAt: Date }>();

  /** In-memory store for pre-signup TOTP secrets (user doesn't exist yet). */
  private readonly preSignupTotpCache = new Map<
    string,
    { secret: string; expiresAt: Date; verified: boolean }
  >();

  /** Short-lived cache for sign-in TOTP verifications completed just before final login. */
  private readonly recentSigninTotpCache = new Map<string, { expiresAt: Date }>();

  /** Short-lived tokens that prove a successful sign-in TOTP verification. */
  private readonly signinTotpTokenCache = new Map<string, { email: string; expiresAt: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly securityService: SecurityService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  private normalizeEmailKey(email: string) {
    return email.trim().toLowerCase();
  }

  private hasRecentSigninTotpVerification(email: string) {
    const normalizedEmail = this.normalizeEmailKey(email);
    const record = this.recentSigninTotpCache.get(normalizedEmail);
    if (!record) {
      return false;
    }

    if (record.expiresAt <= new Date()) {
      this.recentSigninTotpCache.delete(normalizedEmail);
      return false;
    }

    return true;
  }

  private markRecentSigninTotpVerification(email: string) {
    this.recentSigninTotpCache.set(this.normalizeEmailKey(email), {
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });
  }

  private consumeRecentSigninTotpVerification(email: string) {
    this.recentSigninTotpCache.delete(this.normalizeEmailKey(email));
  }

  private issueSigninTotpToken(email: string) {
    const token = randomUUID();
    this.signinTotpTokenCache.set(token, {
      email: this.normalizeEmailKey(email),
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });
    return token;
  }

  private hasValidSigninTotpToken(email: string, token?: string) {
    if (!token) {
      return false;
    }

    const record = this.signinTotpTokenCache.get(token);
    if (!record) {
      return false;
    }

    if (record.expiresAt <= new Date()) {
      this.signinTotpTokenCache.delete(token);
      return false;
    }

    if (record.email !== this.normalizeEmailKey(email)) {
      return false;
    }

    return true;
  }

  private consumeSigninTotpToken(token?: string) {
    if (token) {
      this.signinTotpTokenCache.delete(token);
    }
  }

  private async generateAuthTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const secret = this.configService.get<string>("JWT_ACCESS_SECRET", this.configService.get<string>("JWT_SECRET", "super-admin-secret"));
    const accessToken = sign(payload, secret, {
      expiresIn: jwtConstants.accessTokenTTL as any,
    });
    const refreshToken = randomUUID();
    const refreshTokenHash = await hash(refreshToken, { type: argon2id });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, expiresAt };
  }

  private async hashValue(value: string) {
    return hash(value, { type: argon2id });
  }

  private normalizeGovtIdType(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  }

  private async hashSecurityAnswers(securityQuestions: { question: string; answer: string }[]) {
    return Promise.all(
      securityQuestions.map(async (entry) => ({
        question: entry.question,
        answerHash: await this.hashValue(entry.answer),
      })),
    );
  }

  private generateBackupCodes() {
    return Array.from({ length: 10 }, () => randomUUID().slice(0, 8).toUpperCase());
  }

  private generateAlphaNumericCode(length = 12) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  private generateRecoveryCode(length = 25) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  private async recordLoginAttempt(userId: string | null, email: string, success: boolean, reason: string, ip: string, userAgent: string) {
    await this.prisma.loginAttempt.create({
      data: {
        userId,
        email,
        success,
        failureReason: success ? null : reason,
        ip,
        userAgent,
      },
    });
  }

  private async generateMagicLink(userId: string, purpose: "signin" | "recovery") {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.magicLink.create({
      data: {
        userId,
        token,
        purpose: purpose === "recovery" ? "RECOVERY" : "SIGNIN",
        expiresAt,
      },
    });
    return token;
  }

  async signup(signupDto: SignupDto) {
    const existing = await this.userService.findByEmail(signupDto.contact.officialEmail);
    if (existing) {
      throw new ConflictException("A user with this official email already exists.");
    }

    if (!signupDto.identity.govtIdNumber?.trim()) {
      throw new BadRequestException("Government ID number is required.");
    }

    const passwordHash = await this.hashValue(signupDto.security.password);
    const securityQuestions = await this.hashSecurityAnswers(signupDto.security.securityQuestions);
    const typedContact = signupDto.contact as SignupDto["contact"] & {
      alternateEmail?: string;
      alternatePhone?: string;
    };
    const typedAdvanced = signupDto.advanced as SignupDto["advanced"] & {
      backupCodes?: string[];
      securityCodes?: string[];
    };
    const approver = (signupDto as SignupDto & {
      approver?: { name?: string; email?: string; phone?: string };
    }).approver;

    const backupEmail = typedContact.personalEmail ?? typedContact.alternateEmail ?? undefined;
    const secondaryPhone = typedContact.secondaryPhone ?? typedContact.alternatePhone ?? undefined;

    const providedSecurityCodes = (typedAdvanced.securityCodes ?? [])
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);
    const rawSecurityCodes = providedSecurityCodes.length > 0 ? providedSecurityCodes : this.generateBackupCodes();
    const backupCodes = await Promise.all(rawSecurityCodes.map((code) => this.hashValue(code)));

    const recoverySeed =
      typedAdvanced.recoveryCode?.trim() ||
      (typedAdvanced.backupCodes && typedAdvanced.backupCodes.length > 0
        ? typedAdvanced.backupCodes[0].trim()
        : "");
    const normalizedOfficialEmail = this.normalizeEmailKey(signupDto.contact.officialEmail);
    const cachedTotp = this.preSignupTotpCache.get(normalizedOfficialEmail);

    const user = await this.userService.createSuperAdmin({
      name: signupDto.identity.fullName,
      email: signupDto.contact.officialEmail,
      username: signupDto.advanced.userId ?? undefined,
      password: passwordHash,
      profile: {
        govtIdType: signupDto.identity.govtIdType,
        govtIdUrl: signupDto.identity.govtIdUrl ?? null,
        phonePrimary: signupDto.contact.primaryPhone,
        phoneSecondary: secondaryPhone,
        backupEmail,
        secondaryApproverName: approver?.name?.trim() || undefined,
        secondaryApproverEmail: approver?.email?.trim() || undefined,
        secondaryApproverPhone: approver?.phone?.trim() || undefined,
        googleId: signupDto.advanced.googleId ?? null,
        ipWhitelist: signupDto.advanced.ipWhitelist ?? [],
      },
      securityQuestions,
      backupCodes,
    });

    if (
      signupDto.advanced.totpEnabled &&
      cachedTotp?.verified &&
      cachedTotp.expiresAt > new Date()
    ) {
      await this.prisma.security.upsert({
        where: { userId: user.id },
        update: { totpSecret: cachedTotp.secret },
        create: {
          userId: user.id,
          securityQuestions,
          backupCodes,
          totpSecret: cachedTotp.secret,
        },
      });
      this.preSignupTotpCache.delete(normalizedOfficialEmail);
    }

    await this.prisma.govtIdStorage.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        type: this.normalizeGovtIdType(signupDto.identity.govtIdType),
        fileUrl: signupDto.identity.govtIdUrl ?? "",
        fingerprint: await this.hashValue(signupDto.identity.govtIdNumber.trim()),
        verified: false,
      },
      update: {
        type: this.normalizeGovtIdType(signupDto.identity.govtIdType),
        fingerprint: await this.hashValue(signupDto.identity.govtIdNumber.trim()),
      },
    });

    if (recoverySeed) {
      await this.prisma.recoveryCode.create({
        data: {
          userId: user.id,
          codeHash: await this.hashValue(recoverySeed),
        },
      });
    }
    const { code: otpCode } = await this.otpService.createOtpForUser(user.id, OtpDeliveryMethod.EMAIL, user.email);

    let emailDeliverySuccess = true;
    let emailDeliveryError: string | null = null;
    try {
      await this.emailService.sendOtpEmail(user.email, otpCode, "Signup");
    } catch (error: any) {
      emailDeliverySuccess = false;
      emailDeliveryError = error?.message ?? "Unknown email delivery error";
      console.error("Signup OTP email delivery failed:", error);
    }

    let smsDeliverySuccess = true;
    let smsDeliveryError: string | null = null;
    if (user.profile?.phonePrimary) {
      try {
        await this.smsService.sendOtp(user.profile.phonePrimary, otpCode);
      } catch (error: any) {
        smsDeliverySuccess = false;
        smsDeliveryError = error?.message ?? "Unknown SMS delivery error";
        console.error("Signup OTP SMS delivery failed:", error);
      }
    }

    return {
      message: emailDeliverySuccess
        ? "Super admin account created. Verify email OTP and phone OTP to complete setup."
        : "Super admin account created, but email delivery failed. Request a new OTP or verify email configuration.",
      userId: user.id,
      status: "PENDING_VERIFICATION",
      emailDelivery: {
        success: emailDeliverySuccess,
        error: emailDeliveryError,
      },
      smsDelivery: user.profile?.phonePrimary
        ? {
            success: smsDeliverySuccess,
            error: smsDeliveryError,
          }
        : null,
    };
  }

  async invitePlatformAdmin(signupDto: SignupDto) {
    const existing = await this.userService.findByEmail(signupDto.contact.officialEmail);
    if (existing) {
      throw new ConflictException("A user with this official email already exists.");
    }

    const passwordHash = await this.hashValue(signupDto.security.password);
    const securityQuestions = await this.hashSecurityAnswers(signupDto.security.securityQuestions);
    const typedContact = signupDto.contact as SignupDto["contact"] & {
      alternateEmail?: string;
      alternatePhone?: string;
    };
    const typedAdvanced = signupDto.advanced as SignupDto["advanced"] & {
      backupCodes?: string[];
      securityCodes?: string[];
    };
    const approver = (signupDto as SignupDto & {
      approver?: { name?: string; email?: string; phone?: string };
    }).approver;

    const backupEmail = typedContact.personalEmail ?? typedContact.alternateEmail ?? undefined;
    const secondaryPhone = typedContact.secondaryPhone ?? typedContact.alternatePhone ?? undefined;
    const providedSecurityCodes = (typedAdvanced.securityCodes ?? [])
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);
    const rawSecurityCodes = providedSecurityCodes.length > 0 ? providedSecurityCodes : this.generateBackupCodes();
    const backupCodes = await Promise.all(rawSecurityCodes.map((code) => this.hashValue(code)));

    const recoverySeed =
      typedAdvanced.recoveryCode?.trim() ||
      (typedAdvanced.backupCodes && typedAdvanced.backupCodes.length > 0
        ? typedAdvanced.backupCodes[0].trim()
        : "");

    const user = await this.userService.createPlatformAdmin({
      name: signupDto.identity.fullName,
      email: signupDto.contact.officialEmail,
      password: passwordHash,
      profile: {
        govtIdType: signupDto.identity.govtIdType,
        govtIdUrl: signupDto.identity.govtIdUrl ?? null,
        profilePhotoUrl: signupDto.identity.profilePhotoUrl ?? null,
        phonePrimary: signupDto.contact.primaryPhone,
        phoneSecondary: secondaryPhone,
        backupEmail,
        secondaryApproverName: approver?.name?.trim() || undefined,
        secondaryApproverEmail: approver?.email?.trim() || undefined,
        secondaryApproverPhone: approver?.phone?.trim() || undefined,
        googleId: signupDto.advanced.googleId ?? null,
        ipWhitelist: signupDto.advanced.ipWhitelist ?? [],
      },
      securityQuestions,
      backupCodes,
    });

    if (signupDto.identity.govtIdNumber?.trim()) {
      await this.prisma.govtIdStorage.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          type: this.normalizeGovtIdType(signupDto.identity.govtIdType),
          fileUrl: signupDto.identity.govtIdUrl ?? "",
          fingerprint: await this.hashValue(signupDto.identity.govtIdNumber.trim()),
          verified: false,
        },
        update: {
          type: this.normalizeGovtIdType(signupDto.identity.govtIdType),
          fingerprint: await this.hashValue(signupDto.identity.govtIdNumber.trim()),
        },
      });
    }

    if (recoverySeed) {
      await this.prisma.recoveryCode.create({
        data: {
          userId: user.id,
          codeHash: await this.hashValue(recoverySeed),
        },
      });
    }

    const magicEmail = signupDto.advanced.magicLinkEmail ?? signupDto.contact.officialEmail;
    const magicToken = await this.generateMagicLink(user.id, "signin");
    const url = `${this.configService.get<string>("FRONTEND_URL", "http://localhost:3000")}/platform-admin/magic-link?token=${magicToken}`;
    await this.emailService.sendMagicLink(magicEmail, url);

    return {
      message: "Platform admin invite sent successfully.",
      email: magicEmail,
      magicLink: url,
      createdUserId: user.id,
    };
  }

  async signupInstitutionAdmin(signupDto: InstitutionAdminSignupDto) {
    const existing = await this.userService.findByEmail(signupDto.officialEmail);
    if (existing) {
      throw new ConflictException("A user with this official email already exists.");
    }

    const passwordHash = await this.hashValue(signupDto.password);
    const user = await this.userService.createInstitutionAdmin({
      name: `${signupDto.firstName} ${signupDto.lastName}`,
      email: signupDto.officialEmail,
      password: passwordHash,
      profile: {
        phonePrimary: signupDto.officialPhone,
        googleId: signupDto.googleId ?? null,
        ipWhitelist: [],
      },
    });

    const { code: otpCode } = await this.otpService.createOtpForUser(user.id, OtpDeliveryMethod.EMAIL, user.email);
    await this.emailService.sendOtpEmail(user.email, otpCode, "Signup");

    return {
      message: "Institution admin account created. Verify the email OTP to complete setup.",
      userId: user.id,
      status: "PENDING_VERIFICATION",
    };
  }

  async signupCoordinator(signupDto: InstitutionAdminSignupDto) {
    const existing = await this.userService.findByEmail(signupDto.officialEmail);
    if (existing) {
      throw new ConflictException("A user with this official email already exists.");
    }

    const passwordHash = await this.hashValue(signupDto.password);
    const user = await this.userService.createCoordinator({
      name: `${signupDto.firstName} ${signupDto.lastName}`,
      email: signupDto.officialEmail,
      password: passwordHash,
      profile: {
        phonePrimary: signupDto.officialPhone,
        googleId: signupDto.googleId ?? null,
        ipWhitelist: [],
      },
    });

    const { code: otpCode } = await this.otpService.createOtpForUser(user.id, OtpDeliveryMethod.EMAIL, user.email);
    await this.emailService.sendOtpEmail(user.email, otpCode, "Signup");

    return {
      message: "Coordinator account created. Verify the email OTP to complete setup.",
      userId: user.id,
      status: "PENDING_VERIFICATION",
    };
  }

  async signupFaculty(signupDto: FacultySignupDto) {
    const existing = await this.userService.findByEmail(signupDto.email);
    if (existing) {
      throw new ConflictException("A user with this email already exists.");
    }

    const passwordHash = await this.hashValue(signupDto.password);

    const user = await this.userService.createFaculty({
      name: signupDto.name,
      email: signupDto.email,
      password: passwordHash,
      profile: {
        googleId: signupDto.googleId ?? null,
        ipWhitelist: [],
      },
    });

    const { code: otpCode } = await this.otpService.createOtpForUser(user.id, OtpDeliveryMethod.EMAIL, user.email);

    let emailDeliverySuccess = true;
    let emailDeliveryError: string | null = null;
    try {
      await this.emailService.sendOtpEmail(user.email, otpCode, "Signup");
    } catch (error: any) {
      emailDeliverySuccess = false;
      emailDeliveryError = error.message;
    }

    return {
      message: "Faculty account created successfully. Please verify your email.",
      userId: user.id,
      emailDeliverySuccess,
      emailDeliveryError,
    };
  }

  async signupLearner(signupDto: LearnerSignupDto) {
    console.error(`[409 DEBUG] Learner signup attempt for email: ${signupDto.email}`);
    const existing = await this.userService.findByEmail(signupDto.email);
    if (existing) {
      console.error(`[409 DEBUG] Duplicate email found: ${signupDto.email}`);
      throw new ConflictException("An account with this email already exists.");
    }

    const passwordHash = await this.hashValue(signupDto.password);

    const user = await this.userService.createLearner({
      name: signupDto.name,
      email: signupDto.email,
      password: passwordHash,
    });

    const { code: otpCode } = await this.otpService.createOtpForUser(user.id, OtpDeliveryMethod.EMAIL, user.email);

    let emailDeliverySuccess = true;
    let emailDeliveryError: string | null = null;
    try {
      await this.emailService.sendOtpEmail(user.email, otpCode, "Signup");
    } catch (error: any) {
      emailDeliverySuccess = false;
      emailDeliveryError = error?.message ?? "Unknown email delivery error";
    }

    return {
      message: "Learner account created successfully. Please verify your email.",
      userId: user.id,
      emailDeliverySuccess,
      emailDeliveryError,
    };
  }

  /** Send a real OTP email/SMS to an address that does not yet have an account. */
  async sendSignupOtp(channel: "email" | "phone", target: string) {
    const { randomInt } = await import("crypto");
    const code = randomInt(100000, 999999).toString().padStart(6, "0");
    const codeHash = await hash(code, { type: argon2id });
    const key = `${channel}:${target.trim().toLowerCase()}`;
    const isDev = this.configService.get<string>("NODE_ENV") !== "production";
    this.signupOtpCache.set(key, { codeHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });

    let deliveryFailedInDev = false;
    let deliveryErrorMessage: string | null = null;

    if (channel === "email") {
      try {
        await this.emailService.sendOtpEmail(target.trim(), code, "Signup");
        console.log(`[signup-otp] Email OTP sent to ${target}`);
      } catch (err: any) {
        console.error(`[signup-otp] SendGrid error:`, err?.message || err);
        if (!isDev) {
          throw new InternalServerErrorException(err?.message || "Failed to send OTP email.");
        }
        deliveryFailedInDev = true;
        deliveryErrorMessage = err?.message || "Failed to send OTP email.";
      }
    } else {
      try {
        await this.smsService.sendOtp(target.trim(), code);
        console.log(`[signup-otp] SMS OTP sent to ${target}`);
      } catch (err: any) {
        console.error(`[signup-otp] SMS error:`, err?.message || err);
        if (!isDev) {
          throw new InternalServerErrorException(err?.message || "Failed to send OTP SMS.");
        }
        deliveryFailedInDev = true;
        deliveryErrorMessage = err?.message || "Failed to send OTP SMS.";
      }
    }

    const message = deliveryFailedInDev
      ? `OTP generated but ${channel} delivery failed in dev mode.`
      : `OTP sent to ${channel}.`;

    return {
      message,
      ...(deliveryFailedInDev && { deliveryError: deliveryErrorMessage }),
      ...(isDev && { devOtp: code }),
    };
  }

  /** Verify a pre-signup OTP code. */
  async verifySignupOtp(channel: "email" | "phone", target: string, code: string) {
    const key = `${channel}:${target.trim().toLowerCase()}`;
    const record = this.signupOtpCache.get(key);
    if (!record) throw new BadRequestException("OTP not found or already used.");
    if (record.expiresAt < new Date()) {
      this.signupOtpCache.delete(key);
      throw new BadRequestException("OTP has expired.");
    }
    const valid = await verify(record.codeHash, code.trim());
    if (!valid) throw new BadRequestException("Invalid OTP code.");
    this.signupOtpCache.delete(key);
    return { verified: true };
  }

  async sendOtp(sendOtpDto: SendOtpDto) {
    const purpose = sendOtpDto.purpose === "recovery" ? "recovery" : "signin";
    const channel = sendOtpDto.channel === "mobile" ? "phone" : sendOtpDto.channel;

    if (channel === "phone") {
      const user = await this.userService.findByPhone(sendOtpDto.target);
      if (!user) {
        throw new UnauthorizedException("Account not found.");
      }
      if (!user.profile?.phonePrimary) {
        throw new BadRequestException("Phone number is not configured for this account.");
      }
      return this.sendOtpToUser(user, OtpDeliveryMethod.PHONE, user.profile.phonePrimary, purpose);
    }

    return this.requestOtp({
      email: sendOtpDto.target,
      method: channel,
      purpose,
    });
  }

  private async sendOtpToUser(user: any, method: OtpDeliveryMethod, destination: string, purpose: string) {
    const { code: otpCode, limitReached } = await this.otpService.createOtpForUser(user.id, method, destination);

    if (method === OtpDeliveryMethod.EMAIL && otpCode) {
      await this.emailService.sendOtpEmail(user.email, otpCode, purpose === "recovery" ? "Recovery" : "Sign-in");
    }

    if (method === OtpDeliveryMethod.PHONE && otpCode) {
      await this.smsService.sendOtp(destination, otpCode);
    }

    if (limitReached) {
      return {
        message: "OTP generation has reached its limit for the next 5 hours. Use fallback authentication methods instead.",
        deliveryMethod: method === OtpDeliveryMethod.PHONE ? "phone" : "email",
        limitReached: true,
      };
    }

    return {
      message: `OTP sent to ${method === OtpDeliveryMethod.PHONE ? "phone" : "email"}.`,
      deliveryMethod: method === OtpDeliveryMethod.PHONE ? "phone" : "email",
    };
  }

  async validateMagicLink(token: string) {
    const magicLink = await this.prisma.magicLink.findUnique({ where: { token } });
    if (!magicLink || magicLink.used || magicLink.expiresAt < new Date() || magicLink.purpose !== "SIGNIN") {
      throw new UnauthorizedException("Magic link invalid or expired.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: magicLink.userId } });
    if (!user) {
      throw new UnauthorizedException("Magic link is invalid.");
    }

    await this.prisma.magicLink.update({ where: { id: magicLink.id }, data: { used: true } });

    return { email: user.email, expiresAt: magicLink.expiresAt };
  }

  async login(loginDto: LoginDto, ip: string) {
    // Resolve user by identifier (email / username / phone)
    let user: Awaited<ReturnType<typeof this.userService.findByEmail>> | null = null;
    const raw = loginDto.identifier?.trim();

    if (raw) {
      const looksLikePhone = /^[0-9+()\- ]{6,}$/.test(raw);
      const looksLikeEmail = raw.includes("@");
      if (looksLikeEmail) {
        user = await this.userService.findByEmail(raw);
      } else if (looksLikePhone) {
        user = await this.userService.findByPhone(raw);
      } else {
        user = (await this.userService.findByUsername(raw)) as Awaited<ReturnType<typeof this.userService.findByEmail>>;
      }
    } else if (loginDto.email) {
      user = await this.userService.findByEmail(loginDto.email);
    } else if (loginDto.phone) {
      user = await this.userService.findByPhone(loginDto.phone);
    }

    const userAgent = this.configService.get<string>("USER_AGENT", "unknown");
    const loginId = raw ?? loginDto.email ?? loginDto.phone ?? "unknown";
    const isProduction = process.env.NODE_ENV === "production";

    if (!user) {
      await this.recordLoginAttempt(null, loginId, false, "User not found", ip, userAgent);
      throw new UnauthorizedException("Invalid credentials.");
    }

    // In production, require captcha and terms. In development, make them optional.
    if (isProduction && (!loginDto.acceptTerms || !loginDto.captchaToken || loginDto.captchaToken === "test-token")) {
      console.error(`[401 DEBUG] Login rejected - production mode, invalid captcha: "${loginDto.captchaToken}", terms: ${loginDto.acceptTerms}, ip: ${ip}`);
      await this.recordLoginAttempt(user.id, user.email, false, "Missing terms or captcha", ip, userAgent);
      throw new BadRequestException("Captcha and terms acceptance are required.");
    }

    if (!user.verification) {
      await this.recordLoginAttempt(user.id, user.email, false, "Verification missing", ip, userAgent);
      throw new UnauthorizedException("Verification record not found.");
    }

    const isVerificationLocked = user.verification.lockedUntil && user.verification.lockedUntil > new Date();
    const hasTotpCredential = !!loginDto.totpCode;
    const hasAdditionalFallbackCredential =
      !!loginDto.securityAnswers?.length ||
      !!loginDto.googleId ||
      !!loginDto.backupCode ||
      !!loginDto.recoveryCode;

    if (isVerificationLocked && !hasTotpCredential && !hasAdditionalFallbackCredential) {
      await this.recordLoginAttempt(user.id, user.email, false, "Account locked", ip, userAgent);
      throw new ForbiddenException("Account locked due to repeated failed authentication attempts.");
    }

    const isPasswordValid = await verify(user.password, loginDto.password);
    if (!isPasswordValid) {
      await this.otpService.incrementFailedAttempt(user.id);
      await this.recordLoginAttempt(user.id, user.email, false, "Invalid password", ip, userAgent);
      throw new UnauthorizedException("Invalid credentials.");
    }

    const totpEnabled = !!user.security?.totpSecret;
    const hasRecentTotpVerification = this.hasRecentSigninTotpVerification(user.email);
    const hasSigninTotpToken = this.hasValidSigninTotpToken(user.email, loginDto.signinTotpToken);
    const requiresMfa =
      totpEnabled &&
      !hasRecentTotpVerification &&
      !hasSigninTotpToken &&
      !loginDto.otpCode &&
      !hasTotpCredential &&
      !hasAdditionalFallbackCredential;

    if (requiresMfa) {
      await this.recordLoginAttempt(user.id, user.email, false, "MFA required", ip, userAgent);
      return { requiresMfa: true, message: "Multi-factor authentication is required." };
    }

    let authVerified = false;
    let otpValidated = false;

    if (loginDto.otpCode) {
      try {
        otpValidated = await this.otpService.validateOtp(user.id, loginDto.otpCode);
      } catch (error) {
        otpValidated = false;
      }
    }

    if (otpValidated) {
      authVerified = true;
    }

    if (!authVerified && hasRecentTotpVerification) {
      authVerified = true;
      this.consumeRecentSigninTotpVerification(user.email);
    }

    if (!authVerified && hasSigninTotpToken) {
      authVerified = true;
      this.consumeSigninTotpToken(loginDto.signinTotpToken);
    }

    if (!authVerified && hasTotpCredential && user.security?.totpSecret) {
      const totpValid = await this.securityService.verifyTotp(user.security.totpSecret, loginDto.totpCode);
      if (totpValid) {
        authVerified = true;
      }
    }

    let recoveryCodeWasUsed = false;

    if (!authVerified && hasAdditionalFallbackCredential) {
      let fallbackUsed = false;

      if (loginDto.backupCode && user.security) {
        const backupValid = await this.securityService.verifyBackupCode(user.id, loginDto.backupCode);
        if (backupValid) {
          fallbackUsed = true;
        }
      }

      if (!fallbackUsed && loginDto.recoveryCode) {
        const recoveryValid = await this.securityService.verifyRecoveryCode(user.id, loginDto.recoveryCode);
        if (recoveryValid) {
          fallbackUsed = true;
          recoveryCodeWasUsed = true;
        }
      }

      if (!fallbackUsed && loginDto.securityAnswers?.length && user.security) {
        const securityValid = await this.securityService.verifySecurityAnswers(user.id, loginDto.securityAnswers);
        if (securityValid) {
          fallbackUsed = true;
        }
      }

      if (!fallbackUsed && loginDto.googleId && user.profile?.googleId) {
        if (loginDto.googleId.trim() === user.profile.googleId.trim()) {
          fallbackUsed = true;
        }
      }

      if (fallbackUsed) {
        authVerified = true;
      }
    }

    if (!authVerified && !loginDto.otpCode && !hasTotpCredential && !hasAdditionalFallbackCredential && user.isVerified) {
      authVerified = true;
    }

    if (!authVerified) {
      await this.recordLoginAttempt(user.id, user.email, false, "Invalid verification", ip, userAgent);

      const invalidMessage =
        loginDto.totpCode
          ? "Invalid Google Authenticator code."
          : loginDto.backupCode
          ? "Invalid backup code."
          : loginDto.recoveryCode
          ? "Invalid recovery code."
          : loginDto.securityAnswers?.length
          ? "Invalid security answers."
          : loginDto.googleId
          ? "Invalid Google Authenticator code."
          : "Invalid OTP code.";

      throw new UnauthorizedException(invalidMessage);
    }

    if (loginDto.validateOnly) {
      return { message: "Verification successful." };
    }

    if (user.profile?.ipWhitelist && Array.isArray(user.profile.ipWhitelist) && user.profile.ipWhitelist.length > 0) {
      const normalizedIp = ip.toString();
      if (!user.profile.ipWhitelist.includes(normalizedIp)) {
        await this.recordLoginAttempt(user.id, user.email, false, "IP not whitelisted", ip, userAgent);
        throw new ForbiddenException("Login from this IP address is not allowed.");
      }
    }

    let rotatedRecoveryCode: string | undefined;
    if (recoveryCodeWasUsed) {
      rotatedRecoveryCode = this.generateRecoveryCode(25);
      await this.prisma.recoveryCode.create({
        data: {
          userId: user.id,
          codeHash: await this.hashValue(rotatedRecoveryCode),
        },
      });
    }

    const tokens = await this.generateAuthTokens(user.id, user.email, user.role);
    await this.recordLoginAttempt(user.id, user.email, true, "Authenticated", ip, userAgent);

    return {
      message: "Authenticated successfully.",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      ...(rotatedRecoveryCode ? { rotatedRecoveryCode } : {}),
    };
  }

  async validatePassword(identifier: string, password: string) {
    const user = await this.resolveUserByIdentifier(identifier);
    if (!user) {
      return { valid: false };
    }
    const isValid = await verify(user.password, password);
    if (!isValid) {
      return { valid: false };
    }
    // Return masked contact info so the frontend can show OTP delivery options
    return {
      valid: true,
      maskedEmail: this.maskEmail(user.email),
      maskedAltEmail: user.profile?.backupEmail
        ? this.maskEmail(user.profile.backupEmail)
        : user.email
        ? this.maskEmail(user.email)
        : null,
      maskedPhone: user.profile?.phonePrimary ? this.maskPhone(user.profile.phonePrimary) : null,
      maskedAltPhone: user.profile?.phoneSecondary
        ? this.maskPhone(user.profile.phoneSecondary)
        : user.profile?.phonePrimary
        ? this.maskPhone(user.profile.phonePrimary)
        : null,
      govtIdType: user.profile?.govtIdType ?? null,
      resolvedEmail: user.email,
    };
  }

  async requestApproval(identifier: string) {
    const user = await this.resolveUserByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedException("Account not found.");
    }
    // Generate a one-time 12-char alphanumeric approval code for the approver.
    const approvalCode = this.generateAlphaNumericCode(12);
    const codeHash = await this.hashValue(approvalCode);
    // Store it as a recovery code (reuse existing flow)
    await this.prisma.recoveryCode.create({
      data: { userId: user.id, codeHash },
    });
    // Try to send to the configured secondary approver email first.
    const profile = (user.profile ?? {}) as {
      secondaryApproverEmail?: string | null;
      secondaryApproverName?: string | null;
      secondaryApproverPhone?: string | null;
      backupEmail?: string | null;
    };
    const approverEmail = profile.secondaryApproverEmail ?? profile.backupEmail ?? user.email;
    const approverName = profile.secondaryApproverName ?? "Secondary approver";
    const approverPhone = profile.secondaryApproverPhone ?? null;
    const isDev = this.configService.get<string>("NODE_ENV") !== "production";
    try {
      await this.emailService.sendOtpEmail(
        approverEmail,
        approvalCode,
        `Approval Request: ${user.name} needs account recovery access (${approverName})`,
      );
    } catch {
      // swallow delivery error in dev; surface in prod
      if (!isDev) throw new InternalServerErrorException("Failed to send approval email.");
    }
    return {
      message: "Approval request sent.",
      sentTo: this.maskEmail(approverEmail),
      approverName,
      approverEmail: this.maskEmail(approverEmail),
      approverPhone: approverPhone ? this.maskPhone(approverPhone) : null,
      ...(isDev && { devCode: approvalCode, devOtp: approvalCode }),
    };
  }

  private async resolveUserByIdentifier(raw: string) {
    if (!raw?.trim()) return null;
    const trimmed = raw.trim();
    const looksLikeEmail = trimmed.includes("@");
    const looksLikePhone = /^[0-9+()+\- ]{6,}$/.test(trimmed);
    if (looksLikeEmail) return this.userService.findByEmail(trimmed);
    if (looksLikePhone) return this.userService.findByPhone(trimmed);
    return (await this.userService.findByUsername(trimmed)) as Awaited<ReturnType<typeof this.userService.findByEmail>>;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!domain) return "***@***";
    const shown = local.slice(0, Math.min(3, local.length));
    const masked = "*".repeat(Math.max(3, local.length - 3));
    return `${shown}${masked}@${domain}`;
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/[^0-9+]/g, "");
    if (digits.length <= 5) return "**********";
    const prefix = digits.slice(0, Math.min(5, digits.length - 2));
    const suffix = digits.slice(-2);
    const stars = "*".repeat(Math.max(4, digits.length - prefix.length - 2));
    return `${prefix}${stars}${suffix}`;
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const raw = requestOtpDto.identifier ?? requestOtpDto.email ?? "";
    const user = await this.resolveUserByIdentifier(raw);
    const isDev = this.configService.get<string>("NODE_ENV") !== "production";
    const channel = requestOtpDto.channel ?? "primary";
    const isAlternate = channel === "alternate";

    if (!user) {
      throw new UnauthorizedException("Account not found.");
    }

    if (!user.profile?.backupEmail && !user.profile?.phonePrimary && !user.email) {
      throw new BadRequestException("No email or phone number available for OTP delivery.");
    }

    if (requestOtpDto.method === "magicLink") {
      const magicToken = await this.generateMagicLink(user.id, requestOtpDto.purpose ?? "signin");
      const url = `${this.configService.get<string>("FRONTEND_URL", "http://localhost:3000")}/platform-admin/magic-link?token=${magicToken}`;
      await this.emailService.sendMagicLink(user.email, url);
      return {
        message: "Magic sign-in link sent to your official email.",
        deliveryMethod: "magicLink",
      };
    }

    const method = requestOtpDto.method === "phone" ? OtpDeliveryMethod.PHONE : OtpDeliveryMethod.EMAIL;
    const destination =
      requestOtpDto.method === "phone"
        ? isAlternate
          ? user.profile?.phoneSecondary ?? user.profile?.phonePrimary
          : user.profile?.phonePrimary
        : isAlternate
        ? user.profile?.backupEmail ?? user.email
        : user.email;

    if (!destination) {
      throw new BadRequestException(
        isAlternate
          ? "Requested alternate OTP delivery method is not available for this account."
          : "Requested OTP delivery method is not available for this account.",
      );
    }

    const maxRequests = isAlternate ? 3 : 5;
    const otpDestinationKey = `${channel}:${destination}`;
    const { code: otpCode, limitReached } = await this.otpService.createOtpForUser(
      user.id,
      method,
      otpDestinationKey,
      10,
      maxRequests,
      !isAlternate,
    );

    if (requestOtpDto.method === "email" && otpCode) {
      await this.emailService.sendOtpEmail(destination, otpCode, requestOtpDto.purpose === "recovery" ? "Recovery" : "Sign-in");
    }

    if (requestOtpDto.method === "phone" && otpCode) {
      if (!destination) {
        throw new BadRequestException("Phone number is not configured for this account.");
      }
      await this.smsService.sendOtp(destination, otpCode);
    }

    if (limitReached) {
      return {
        message: `OTP generation has reached its limit (${maxRequests}) for the next 5 hours on this contact. Use the next authentication method instead.`,
        deliveryMethod: requestOtpDto.method,
        channel,
        limitReached: true,
      };
    }

    return {
      message: `OTP sent to ${requestOtpDto.method}.`,
      deliveryMethod: requestOtpDto.method,
      channel,
      ...(isDev && otpCode ? { devOtp: otpCode } : {}),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const code = verifyOtpDto.otpCode ?? verifyOtpDto.otp;
    if (!code) {
      throw new BadRequestException("OTP code is required.");
    }

    const user = verifyOtpDto.email
      ? await this.userService.findByEmail(verifyOtpDto.email)
      : verifyOtpDto.channel && verifyOtpDto.target
      ? await this.userService.findByPhone(verifyOtpDto.target)
      : null;

    if (!user) {
      throw new UnauthorizedException("No matching account found.");
    }

    const verified = await this.otpService.validateOtp(user.id, code, false);
    if (!verified) {
      throw new UnauthorizedException("OTP validation failed.");
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    return { message: "OTP verified. Proceed to login." };
  }

  async setupTwoFactor(setupDto: Setup2FADto) {
    const normalizedEmail = this.normalizeEmailKey(setupDto.email);
    const normalizedTotpCode = setupDto.totpCode?.replace(/\s+/g, "").trim();
    const user = await this.userService.findByEmail(normalizedEmail);

    // ── Pre-signup flow: user doesn't exist yet ──────────────────────────────
    if (!user) {
      if (normalizedTotpCode) {
        // Verify TOTP against cached secret
        const cached = this.preSignupTotpCache.get(normalizedEmail);
        if (!cached || cached.expiresAt < new Date()) {
          this.preSignupTotpCache.delete(normalizedEmail);
          throw new BadRequestException("Session expired. Please generate a new QR code.");
        }
        const valid = await this.securityService.verifyTotp(cached.secret, normalizedTotpCode);
        if (!valid) {
          throw new BadRequestException("Invalid authenticator code.");
        }
        this.preSignupTotpCache.set(normalizedEmail, {
          secret: cached.secret,
          verified: true,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });
        return { verified: true, message: "Authenticator code verified." };
      }

      // Generate TOTP secret without writing to DB (delegate to SecurityService which has working speakeasy import)
      const { secret, otpauthUrl, qrCodeDataUrl } = await this.securityService.generateTotpSecret(normalizedEmail);

      // Cache for 10 minutes
      this.preSignupTotpCache.set(normalizedEmail, {
        secret: secret,
        verified: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      return { otpauthUrl, qrCodeDataUrl };
    }

    // ── Post-signup flow: user exists ────────────────────────────────────────
    if (normalizedTotpCode) {
      if (!setupDto.password) {
        throw new BadRequestException("Password is required to verify Google Authenticator during sign in.");
      }

      const isPasswordValid = await verify(user.password, setupDto.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException("Invalid credentials.");
      }

      const security = await this.prisma.security.findUnique({ where: { userId: user.id } });
      if (!security?.totpSecret || !(await this.securityService.verifyTotp(security.totpSecret, normalizedTotpCode))) {
        throw new BadRequestException("Invalid authenticator code.");
      }

      this.markRecentSigninTotpVerification(user.email);
      const signinTotpToken = this.issueSigninTotpToken(user.email);

      return {
        verified: true,
        message: "Two-factor authentication has been enabled.",
        signinTotpToken,
      };
    }

    if (!setupDto.password) {
      const security = await this.prisma.security.findUnique({ where: { userId: user.id } });
      if (security?.totpSecret) {
        return this.securityService.generateTotpQrFromSecret(user.email, security.totpSecret);
      }
      return this.securityService.initializeTwoFactor(user.id, user.email);
    }

    const isPasswordValid = await verify(user.password, setupDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const security = await this.prisma.security.findUnique({ where: { userId: user.id } });
    if (security?.totpSecret) {
      return this.securityService.generateTotpQrFromSecret(user.email, security.totpSecret);
    }

    return this.securityService.initializeTwoFactor(user.id, user.email);
  }

  async refreshToken(refreshDto: RefreshTokenDto) {
    const user = await this.userService.findByEmail(refreshDto.email);
    if (!user) {
      throw new UnauthorizedException("Unable to refresh token.");
    }

    const refreshRecord = await this.prisma.refreshToken.findFirst({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!refreshRecord) {
      throw new UnauthorizedException("Refresh token invalid or expired.");
    }

    if (!(await verify(refreshRecord.token, refreshDto.refreshToken))) {
      throw new UnauthorizedException("Refresh token invalid.");
    }

    const tokens = await this.generateAuthTokens(user.id, user.email, user.role);
    return { message: "Token refreshed.", accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: tokens.expiresAt };
  }

  async uploadGovtId(
    email: string,
    govtIdType: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
    govtIdNumber?: string,
  ) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Unable to upload ID.");
    }

    const fileUrl = await this.storageService.uploadGovtId(filename, buffer, contentType);
    const normalizedType = this.normalizeGovtIdType(govtIdType);
    const fingerprint = govtIdNumber?.trim() ? await this.hashValue(govtIdNumber.trim()) : null;
    await this.prisma.govtIdStorage.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        type: normalizedType,
        fileUrl,
        fingerprint,
        verified: false,
      },
      update: {
        fileUrl,
        type: normalizedType,
        verified: false,
        ...(fingerprint ? { fingerprint } : {}),
      },
    });

    return { message: "Government ID uploaded securely.", fileUrl };
  }

  async uploadProfilePhoto(email: string, buffer: Buffer, filename: string, contentType: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Unable to upload profile photo.");
    }

    const fileUrl = await this.storageService.uploadProfilePhoto(filename, buffer, contentType);
    await this.prisma.superAdminProfile.updateMany({
      where: { userId: user.id },
      data: { profilePhotoUrl: fileUrl },
    });

    return { message: "Profile photo uploaded securely.", fileUrl };
  }

  async recover(recoverDto: RecoverDto) {
    const user = await this.userService.findByEmail(recoverDto.email);
    if (!user) {
      throw new UnauthorizedException("Account recovery failed.");
    }

    switch (recoverDto.method) {
      case "securityQuestions":
        if (!recoverDto.securityAnswers) {
          throw new BadRequestException("Security answers are required.");
        }
        if (!(await this.securityService.verifySecurityQuestions(user.id, recoverDto.securityAnswers))) {
          throw new UnauthorizedException("Failed to validate security questions.");
        }
        return { message: "Security questions validated. Reset password via support portal." };
      case "backupCodes":
        if (!recoverDto.backupCode) {
          throw new BadRequestException("Backup code is required.");
        }
        if (!(await this.securityService.verifyBackupCode(user.id, recoverDto.backupCode))) {
          throw new UnauthorizedException("Backup code invalid.");
        }
        return { message: "Backup code accepted. Proceed to reset credentials." };
      case "magicLink":
        if (!recoverDto.magicToken) {
          throw new BadRequestException("Magic token is required.");
        }
        const magicLink = await this.prisma.magicLink.findUnique({ where: { token: recoverDto.magicToken } });
        if (!magicLink || magicLink.used || magicLink.expiresAt < new Date() || magicLink.userId !== user.id) {
          throw new UnauthorizedException("Magic link invalid or expired.");
        }
        await this.prisma.magicLink.update({ where: { id: magicLink.id }, data: { used: true } });
        return { message: "Magic recovery link validated. Complete password reset." };
      case "emailOtp":
      case "phoneOtp":
        if (!recoverDto.otpCode) {
          throw new BadRequestException("OTP code is required for this recovery method.");
        }
        await this.otpService.validateOtp(user.id, recoverDto.otpCode);
        return { message: "OTP verified, continue recovery." };
      case "totp":
        if (!recoverDto.totpCode) {
          throw new BadRequestException("TOTP code is required.");
        }
        if (!user.security?.totpSecret || !(await this.securityService.verifyTotp(user.security.totpSecret, recoverDto.totpCode))) {
          throw new UnauthorizedException("Invalid TOTP code.");
        }
        return { message: "TOTP recovery accepted. Reset your password now." };
      case "govtId":
        if (!recoverDto.govtIdType?.trim() || !recoverDto.govtIdNumber?.trim()) {
          throw new BadRequestException("Government ID type and number are required.");
        }

        const govId = await this.prisma.govtIdStorage.findUnique({ where: { userId: user.id } });
        if (!govId || !govId.fingerprint) {
          throw new UnauthorizedException("Government ID is not configured for this account.");
        }

        const storedType = this.normalizeGovtIdType(govId.type);
        const providedType = this.normalizeGovtIdType(recoverDto.govtIdType);
        if (storedType !== providedType) {
          throw new UnauthorizedException("Government ID details do not match.");
        }

        const idMatches = await verify(govId.fingerprint, recoverDto.govtIdNumber.trim());
        if (!idMatches) {
          throw new UnauthorizedException("Government ID details do not match.");
        }

        const tokens = await this.generateAuthTokens(user.id, user.email, user.role);
        return {
          message: "Government ID matched. Logged in successfully.",
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        };
      default:
        throw new BadRequestException("Unsupported recovery method.");
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = resetPasswordDto.email
      ? await this.userService.findByEmail(resetPasswordDto.email)
      : await this.userService.findByPhone(resetPasswordDto.phone!);

    if (!user) {
      throw new UnauthorizedException("Unable to reset password.");
    }

    await this.otpService.validateOtp(user.id, resetPasswordDto.otpCode);

    const passwordHash = await this.hashValue(resetPasswordDto.password);
    await this.prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } });

    return { message: "Password reset successfully. You can now sign in with your new password." };
  }
}
