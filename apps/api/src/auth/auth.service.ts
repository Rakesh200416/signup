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
import { LoginDto } from "./dto/login.dto";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { Setup2FADto } from "./dto/setup-2fa.dto";
import { RecoverDto } from "./dto/recover.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
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
        ipWhitelist: signupDto.advanced.ipWhitelist ?? [],
      },
      securityQuestions,
      backupCodes,
    });

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

  async login(loginDto: LoginDto, ip: string) {
    const user = await this.userService.findByEmail(loginDto.email);
    const userAgent = this.configService.get<string>("USER_AGENT", "unknown");

    if (!user) {
      await this.recordLoginAttempt(null, loginDto.email, false, "User not found", ip, userAgent);
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (!loginDto.acceptTerms || !loginDto.captchaToken) {
      await this.recordLoginAttempt(user.id, user.email, false, "Missing terms or captcha", ip, userAgent);
      throw new BadRequestException("Captcha and terms acceptance are required.");
    }

    if (!user.verification) {
      await this.recordLoginAttempt(user.id, user.email, false, "Verification missing", ip, userAgent);
      throw new UnauthorizedException("Verification record not found.");
    }

    if (user.verification.lockedUntil && user.verification.lockedUntil > new Date()) {
      await this.recordLoginAttempt(user.id, user.email, false, "Account locked", ip, userAgent);
      throw new ForbiddenException("Account locked due to repeated failed authentication attempts.");
    }

    const isPasswordValid = await verify(user.password, loginDto.password);
    if (!isPasswordValid) {
      await this.otpService.incrementFailedAttempt(user.id);
      await this.recordLoginAttempt(user.id, user.email, false, "Invalid password", ip, userAgent);
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (!user.isVerified) {
      await this.recordLoginAttempt(user.id, user.email, false, "Account not verified", ip, userAgent);
      throw new ForbiddenException("Account must complete OTP verification before login.");
    }

    await this.otpService.validateOtp(user.id, loginDto.otpCode);

    if (user.profile?.ipWhitelist && Array.isArray(user.profile.ipWhitelist) && user.profile.ipWhitelist.length > 0) {
      const normalizedIp = ip.toString();
      if (!user.profile.ipWhitelist.includes(normalizedIp)) {
        await this.recordLoginAttempt(user.id, user.email, false, "IP not whitelisted", ip, userAgent);
        throw new ForbiddenException("Login from this IP address is not allowed.");
      }
    }

    if (user.security?.totpSecret) {
      const totpValid = await this.securityService.verifyTotp(user.security.totpSecret, loginDto.totpCode);
      if (!totpValid) {
        await this.recordLoginAttempt(user.id, user.email, false, "Invalid TOTP code", ip, userAgent);
        throw new UnauthorizedException("Invalid TOTP code.");
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
      const url = `${this.configService.get<string>("FRONTEND_URL", "http://localhost:3000")}/auth/magic-link?token=${magicToken}`;
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

    const { code: otpCode } = await this.otpService.createOtpForUser(user.id, method, destination);

    if (requestOtpDto.method === "email") {
      await this.emailService.sendOtpEmail(user.email, otpCode, requestOtpDto.purpose === "recovery" ? "Recovery" : "Sign-in");
    }

    if (requestOtpDto.method === "phone") {
      if (!user.profile?.phonePrimary) {
        throw new BadRequestException("Phone number is not configured for this account.");
      }
      await this.smsService.sendOtp(user.profile.phonePrimary, otpCode);
    }

    return {
      message: `OTP sent to ${requestOtpDto.method}.`,
      deliveryMethod: requestOtpDto.method,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.userService.findByEmail(verifyOtpDto.email);
    if (!user) {
      throw new UnauthorizedException("No matching account found.");
    }

    const verified = await this.otpService.validateOtp(user.id, verifyOtpDto.otpCode);
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

    const isPasswordValid = await verify(user.password, setupDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (setupDto.totpCode) {
      const security = await this.prisma.security.findUnique({ where: { userId: user.id } });
      if (!security?.totpSecret || !(await this.securityService.verifyTotp(security.totpSecret, setupDto.totpCode))) {
        throw new BadRequestException("Invalid authenticator code.");
      }
      return { verified: true, message: "Two-factor authentication has been enabled." };
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
}
