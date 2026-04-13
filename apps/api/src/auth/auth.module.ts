import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { PrismaModule } from "../prisma/prisma.module";
import { UserModule } from "../user/user.module";
import { OtpModule } from "../otp/otp.module";
import { SecurityModule } from "../security/security.module";
import { EmailModule } from "../email/email.module";
import { SmsModule } from "../sms/sms.module";
import { StorageModule } from "../storage/storage.module";
import { jwtConstants } from "./auth.constants";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_ACCESS_SECRET", config.get<string>("JWT_SECRET", "super-admin-secret")),
      }),
    }),
    UserModule,
    OtpModule,
    SecurityModule,
    EmailModule,
    SmsModule,
    StorageModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
