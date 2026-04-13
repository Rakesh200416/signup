import { Injectable, INestApplication, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.warn("Prisma connection failed during startup:", (error as Error).message);
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    // Optional shutdown hook removed for Prisma version compatibility.
    return;
  }
}
