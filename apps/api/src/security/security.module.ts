import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SecurityService } from "./security.service";

@Module({
  imports: [PrismaModule],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
