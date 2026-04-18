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

@Injectable()
export class AuthService {
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

    const passwordHash = await this.hashValue(signupDto.security.password);
    const securityQuestions = await this.hashSecurityAnswers(signupDto.security.securityQuestions);
    const backupCodes = this.generateBackupCodes();

    const user = await this.userService.createSuperAdmin({
      name: signupDto.identity.fullName,
      email: signupDto.contact.officialEmail,
      password: passwordHash,
      profile: {
        govtIdType: signupDto.identity.govtIdType,
        govtIdUrl: signupDto.identity.govtIdUrl ?? null,
        phonePrimary: signupDto.contact.primaryPhone,
        phoneSecondary: signupDto.contact.secondaryPhone,
        backupEmail: signupDto.contact.personalEmail,
        googleId: signupDto.advanced.googleId ?? null,
        ipWhitelist: signupDto.advanced.ipWhitelist ?? [],
      },
      securityQuestions,
      backupCodes,
    });
    if (signupDto.advanced.recoveryCode) {
      await this.prisma.recoveryCode.create({
        data: {
          userId: user.id,
          codeHash: await hash(signupDto.advanced.recoveryCode),
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
    const backupCodes = this.generateBackupCodes();

    const user = await this.userService.createPlatformAdmin({
      name: signupDto.identity.fullName,
      email: signupDto.contact.officialEmail,
      password: passwordHash,
      profile: {
        govtIdType: signupDto.identity.govtIdType,
        govtIdUrl: signupDto.identity.govtIdUrl ?? null,
        profilePhotoUrl: signupDto.identity.profilePhotoUrl ?? null,
        phonePrimary: signupDto.contact.primaryPhone,
        phoneSecondary: signupDto.contact.secondaryPhone,
        backupEmail: signupDto.contact.personalEmail,
        googleId: signupDto.advanced.googleId ?? null,
        ipWhitelist: signupDto.advanced.ipWhitelist ?? [],
      },
      securityQuestions,
      backupCodes,
    });

    if (signupDto.advanced.recoveryCode) {
      await this.prisma.recoveryCode.create({
        data: {
          userId: user.id,
          codeHash: await hash(signupDto.advanced.recoveryCode),
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
    } catch (error) {
      emailDeliverySuccess = false;
      emailDeliveryError = error.message;
    }

    return {
      message: "Learner account created successfully. Please verify your email.",
      userId: user.id,
      emailDeliverySuccess,
      emailDeliveryError,
    };
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
    const user = loginDto.email
      ? await this.userService.findByEmail(loginDto.email)
      : loginDto.phone
      ? await this.userService.findByPhone(loginDto.phone)
      : null;
    const userAgent = this.configService.get<string>("USER_AGENT", "unknown");
    const loginId = loginDto.email ?? loginDto.phone ?? "unknown";
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
    const requiresMfa =
      totpEnabled &&
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

    if (!authVerified && hasTotpCredential && user.security?.totpSecret) {
      const totpValid = await this.securityService.verifyTotp(user.security.totpSecret, loginDto.totpCode);
      if (totpValid) {
        authVerified = true;
      }
    }

    if (!authVerified && hasAdditionalFallbackCredential) {
      const fallbackAllowed =
        user.verification.failedAttempts >= 5 ||
        user.verification.otpRequestCount >= 5 ||
        (user.verification.lockedUntil && user.verification.lockedUntil > new Date());

      if (!fallbackAllowed) {
        let fallbackCredentialValid = false;

        if (loginDto.backupCode && user.security) {
          fallbackCredentialValid = await this.securityService.verifyBackupCode(user.id, loginDto.backupCode);
        }

        if (!fallbackCredentialValid && loginDto.recoveryCode) {
          fallbackCredentialValid = await this.securityService.verifyRecoveryCode(user.id, loginDto.recoveryCode);
        }

        if (!fallbackCredentialValid && loginDto.securityAnswers?.length && user.security) {
          fallbackCredentialValid = await this.securityService.verifySecurityAnswers(user.id, loginDto.securityAnswers);
        }

        if (!fallbackCredentialValid && loginDto.googleId && user.profile?.googleId) {
          fallbackCredentialValid = loginDto.googleId.trim() === user.profile.googleId.trim();
        }

        if (fallbackCredentialValid) {
          await this.recordLoginAttempt(user.id, user.email, false, "Fallback not allowed yet", ip, userAgent);
          throw new ForbiddenException("Fallback authentication is only available after repeated OTP failures.");
        }
      }

      if (fallbackAllowed) {
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

    const tokens = await this.generateAuthTokens(user.id, user.email, user.role);
    await this.recordLoginAttempt(user.id, user.email, true, "Authenticated", ip, userAgent);

    return {
      message: "Authenticated successfully.",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };
  }

  async validatePassword(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return { valid: false };
    }

    const isValid = await verify(user.password, password);
    return { valid: isValid };
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const user = await this.userService.findByEmail(requestOtpDto.email);
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
    const destination = requestOtpDto.method === "phone" ? user.profile?.phonePrimary : user.email;
    if (!destination) {
      throw new BadRequestException("Requested OTP delivery method is not available for this account.");
    }

    const { code: otpCode, limitReached } = await this.otpService.createOtpForUser(user.id, method, destination);

    if (requestOtpDto.method === "email" && otpCode) {
      await this.emailService.sendOtpEmail(user.email, otpCode, requestOtpDto.purpose === "recovery" ? "Recovery" : "Sign-in");
    }

    if (requestOtpDto.method === "phone" && otpCode) {
      if (!user.profile?.phonePrimary) {
        throw new BadRequestException("Phone number is not configured for this account.");
      }
      await this.smsService.sendOtp(user.profile.phonePrimary, otpCode);
    }

    if (limitReached) {
      return {
        message: "OTP generation has reached its limit for the next 5 hours. Use fallback authentication methods instead.",
        deliveryMethod: requestOtpDto.method,
        limitReached: true,
      };
    }

    return {
      message: `OTP sent to ${requestOtpDto.method}.`,
      deliveryMethod: requestOtpDto.method,
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
    const user = await this.userService.findByEmail(setupDto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (setupDto.totpCode) {
      if (!user.isVerified) {
        throw new BadRequestException("Account must be verified before enabling two-factor authentication.");
      }
      const security = await this.prisma.security.findUnique({ where: { userId: user.id } });
      if (!security?.totpSecret || !(await this.securityService.verifyTotp(security.totpSecret, setupDto.totpCode))) {
        throw new BadRequestException("Invalid authenticator code.");
      }
      return {
        verified: true,
        message: "Two-factor authentication has been enabled.",
      };
    }

    if (!setupDto.password) {
      return this.securityService.initializeTwoFactor(user.id, user.email);
    }

    const isPasswordValid = await verify(user.password, setupDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials.");
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

  async uploadGovtId(email: string, govtIdType: string, buffer: Buffer, filename: string, contentType: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Unable to upload ID.");
    }

    const fileUrl = await this.storageService.uploadGovtId(filename, buffer, contentType);
    await this.prisma.govtIdStorage.upsert({
      where: { userId: user.id },
      create: { userId: user.id, type: govtIdType, fileUrl, verified: false },
      update: { fileUrl, type: govtIdType, verified: false },
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
        const govId = await this.prisma.govtIdStorage.findUnique({ where: { userId: user.id } });
        if (!govId || govId.verified !== true) {
          throw new UnauthorizedException("Government ID verification pending.");
        }
        return { message: "Government ID verified. Recovery may proceed after security review." };
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
