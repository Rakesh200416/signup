import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  UsePipes,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Express } from "express";
import { AuthService } from "./auth.service";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { loginSchema, LoginDto } from "./dto/login.dto";
import { requestOtpSchema, RequestOtpDto } from "./dto/request-otp.dto";
import { signupSchema, SignupDto } from "./dto/signup.dto";
import { verifyOtpSchema, VerifyOtpDto } from "./dto/verify-otp.dto";
import { setup2FASchema, Setup2FADto } from "./dto/setup-2fa.dto";
import { recoverSchema, RecoverDto } from "./dto/recover.dto";
import { refreshTokenSchema, RefreshTokenDto } from "./dto/refresh-token.dto";
import { uploadIdSchema, UploadIdDto } from "./dto/upload-id.dto";
import { uploadProfilePhotoSchema, UploadProfilePhotoDto } from "./dto/upload-profile-photo.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("csrf-token")
  getCsrfToken(@Req() req: Request) {
    const token = req.csrfToken?.();
    return { csrfToken: token || "" };
  }

  @Post("signup")
  @UsePipes(new ZodValidationPipe(signupSchema))
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post("login")
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
    return this.authService.login(loginDto, ip);
  }

  @Post("request-otp")
  @UsePipes(new ZodValidationPipe(requestOtpSchema))
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto);
  }

  @Post("refresh")
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post("verify-otp")
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post("setup-2fa")
  @UsePipes(new ZodValidationPipe(setup2FASchema))
  async setupTwoFactor(@Body() setupDto: Setup2FADto) {
    return this.authService.setupTwoFactor(setupDto);
  }

  @Post("upload-id")
  @UseInterceptors(FileInterceptor("govtIdFile"))
  async uploadGovtId(
    @Body(new ZodValidationPipe(uploadIdSchema)) uploadIdDto: UploadIdDto,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new UnauthorizedException("Government ID file upload is required.");
    }
    return this.authService.uploadGovtId(uploadIdDto.email, uploadIdDto.govtIdType, file.buffer, file.originalname, file.mimetype);
  }

  @Post("upload-profile-photo")
  @UseInterceptors(FileInterceptor("profilePhotoFile"))
  async uploadProfilePhoto(
    @Body(new ZodValidationPipe(uploadProfilePhotoSchema)) uploadPhotoDto: UploadProfilePhotoDto,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new UnauthorizedException("Profile photo file upload is required.");
    }
    return this.authService.uploadProfilePhoto(uploadPhotoDto.email, file.buffer, file.originalname, file.mimetype);
  }

  @Post("recover")
  @UsePipes(new ZodValidationPipe(recoverSchema))
  async recover(@Body() recoverDto: RecoverDto) {
    return this.authService.recover(recoverDto);
  }
}
