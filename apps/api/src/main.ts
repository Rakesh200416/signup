import { NestFactory, Reflector } from "@nestjs/core";
import { ValidationPipe, BadRequestException } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerStorage } from "@nestjs/throttler";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import helmet from "helmet";
import * as cookieParser from "cookie-parser";
import * as csurf from "csurf";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProduction = process.env.NODE_ENV === "production";

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cookieParser());
  
  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });
  
  const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const facultyFrontendUrl = (process.env.FACULTY_FRONTEND_URL ?? "http://localhost:3002").replace(/\/$/, "");
  const allowedOrigins = [
    frontendUrl, 
    facultyFrontendUrl,
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, true); // Allow all origins for now (can be restricted later)
      }
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-CSRF-Token"],
    exposedHeaders: ["set-cookie"],
  });

  // if (isProduction) {
  //   const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: "none", secure: true, path: "/" } });
  //   app.use((req, res, next) => {
  //     if (req.method === "OPTIONS") {
  //       return next();
  //     }
  //     return csrfProtection(req, res, next);
  //   });
  // }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        console.log('Validation errors:', JSON.stringify(errors, null, 2));
        return new BadRequestException(errors);
      },
    }),
  );

  const storage = app.get(ThrottlerStorage);
  const throttlerGuard = new ThrottlerGuard({ throttlers: [{ ttl: 60, limit: 10 }] }, storage, app.get(Reflector));
  await throttlerGuard.onModuleInit();
  app.useGlobalGuards(throttlerGuard);

  const port = process.env.PORT ?? process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
