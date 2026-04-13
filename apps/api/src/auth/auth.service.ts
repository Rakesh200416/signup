import { Injectable, BadRequestException, UnauthorizedException, ConflictException, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { UserService } from "../user/user.service";
import { OtpService } from "../otp/otp.service";
import { SecurityService } from "../security/security.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { Setup2FADto } from "./dto/setup-2fa.dto";
import { RecoverDto } from "./dto/recover.dto";
import { hash, verify } from "argon2";
import { jwtConstants } from "./auth.constants";
import { randomUUID } from "crypto";
import { sign } from "jsonwebtoken";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly securityService: SecurityService,
    private readonly configService: ConfigService,
  ) {}

  private async generateAuthTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const secret = this.configService.get<string>("JWT_ACCESS_SECRET", this.configService.get<string>("JWT_SECRET", "super-admin-secret"));
    const accessToken = sign(payload, secret, {
      expiresIn: jwtConstants.accessTokenTTL as any,
    });
    const refreshToken = randomUUID();
    const refreshTokenHash = await hash(refreshToken);
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

  private async hashSecurityAnswers(securityQuestions: { question: string; answer: string }[]) {
    return Promise.all(
      securityQuestions.map(async (entry) => ({
        question: entry.question,
        answerHash: await hash(entry.answer),
      })),
    );
  }

  async signup(signupDto: SignupDto) {
    const existing = await this.userService.findByEmail(signupDto.contact.officialEmail);
    if (existing) {
      throw new ConflictException("A user with this official email already exists.");
    }

    const passwordHash = await hash(signupDto.security.password);
    const securityQuestions = await this.hashSecurityAnswers(signupDto.security.securityQuestions);
    const otpCode = this.otpService.generateOtpCode();

    const user = await this.userService.createSuperAdmin({
      name: signupDto.identity.fullName,
      email: signupDto.contact.officialEmail,
      password: passwordHash,
      profile: {
        govtIdType: signupDto.identity.govtIdType,
        govtIdUrl: signupDto.identity.govtIdUrl,
        phonePrimary: signupDto.contact.primaryPhone,
        phoneSecondary: signupDto.contact.secondaryPhone,
        backupEmail: signupDto.contact.personalEmail,
        ipWhitelist: signupDto.advanced.ipWhitelist ?? [],
      },
      securityQuestions,
      backupCodes: [],
      otpCode,
    });

    return {
      message: "Super admin provisional account created. Verify OTP on official email and phone before login.",
      userId: user.id,
      otpCode,
      status: "PENDING_APPROVAL",
    };
  }

  async login(loginDto: LoginDto, ip: string) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (!loginDto.acceptTerms || !loginDto.captchaToken) {
      throw new BadRequestException("Captcha and terms acceptance are required.");
    }

    if (!user.verification) {
      throw new UnauthorizedException("Verification record not found.");
    }

    if (user.verification.lockedUntil && user.verification.lockedUntil > new Date()) {
      throw new ForbiddenException("Account locked due to repeated failed authentication attempts.");
    }

    const isPasswordValid = await verify(user.password, loginDto.password);
    if (!isPasswordValid) {
      await this.otpService.incrementFailedAttempt(user.id);
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (!user.isVerified) {
      throw new ForbiddenException("Account must complete OTP verification before login.");
    }

    await this.otpService.validateOtp(user.id, loginDto.otpCode);

    if (user.profile?.ipWhitelist && Array.isArray(user.profile.ipWhitelist) && user.profile.ipWhitelist.length > 0) {
      const normalizedIp = ip.toString();
      if (!user.profile.ipWhitelist.includes(normalizedIp)) {
        throw new ForbiddenException("Login from this IP address is not allowed.");
      }
    }

    if (user.security?.totpSecret) {
      const totpValid = await this.securityService.verifyTotp(user.security.totpSecret, loginDto.totpCode);
      if (!totpValid) {
        throw new UnauthorizedException("Invalid TOTP code.");
      }
    }

    const tokens = await this.generateAuthTokens(user.id, user.email, user.role);
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

    if (!user.profile?.backupEmail && !user.profile?.phonePrimary) {
      throw new BadRequestException("No email or phone number available for OTP delivery.");
    }

    const otpRecord = await this.otpService.createOtpForUser(user.id);
    const otpCode = otpRecord.emailOTP ?? otpRecord.phoneOTP ?? "";

    return {
      message: `OTP sent to ${requestOtpDto.method} on file. Use the code to continue.`,
      deliveryMethod: requestOtpDto.method,
      otpCode,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.userService.findByEmail(verifyOtpDto.email);
    if (!user || !user.verification) {
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

    return this.securityService.initializeTwoFactor(user.id, user.email);
  }

  async recover(recoverDto: RecoverDto) {
    const user = await this.userService.findByEmail(recoverDto.email);
    if (!user) {
      throw new UnauthorizedException("Account recovery failed.");
    }

    if (recoverDto.method === "securityQuestions") {
      const result = await this.securityService.verifySecurityQuestions(user.id, recoverDto.securityAnswers ?? []);
      if (!result) {
        throw new UnauthorizedException("Failed to validate security questions.");
      }
      return { message: "Security questions validated. Reset password via support portal." };
    }

    if (recoverDto.method === "backupCodes") {
      const matched = await this.securityService.verifyBackupCode(user.id, recoverDto.backupCode ?? "");
      if (!matched) {
        throw new UnauthorizedException("Backup code invalid.");
      }
      return { message: "Backup code accepted. Proceed to reset credentials." };
    }

    if (recoverDto.method === "magicLink") {
      const magicToken = randomUUID();
      return { message: "Magic link generated and sent to alternate email.", magicToken }; 
    }

    throw new BadRequestException("Unsupported recovery method.");
  }
}
