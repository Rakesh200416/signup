import { NestFactory, Reflector } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerStorage } from "@nestjs/throttler";
import { AppModule } from "./app.module";
import helmet from "helmet";
import * as cookieParser from "cookie-parser";
import * as csurf from "csurf";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.use(csurf({ cookie: { httpOnly: true, sameSite: "lax", secure: false } }));
  app.enableCors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-CSRF-Token"],
    exposedHeaders: ["set-cookie"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const storage = app.get(ThrottlerStorage);
  const throttlerGuard = new ThrottlerGuard({ throttlers: [{ ttl: 60, limit: 10 }] }, storage, app.get(Reflector));
  await throttlerGuard.onModuleInit();
  app.useGlobalGuards(throttlerGuard);

  await app.listen(process.env.API_PORT ?? 3001);
  console.log(`API running on http://localhost:${process.env.API_PORT ?? 3001}`);
}
bootstrap();