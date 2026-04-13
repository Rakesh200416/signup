# LMS-Main-Pro

## NeuroLXP Super Admin Authentication System

This repository includes a production-ready Super Admin auth system with NestJS backend, Next.js admin portal, PostgreSQL, JWT access + refresh tokens, email and SMS OTP, Google Authenticator TOTP, and secure government ID upload.

## API Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env` and set your values:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ACCESS_SECRET`
- `API_PORT`
- `FRONTEND_URL`
- `EMAIL_SERVICE`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

## Admin Web Environment Variables

Copy `apps/admin-web/.env.example` to `apps/admin-web/.env.local` and update the API URL.

## Backend Setup

1. Install dependencies in `apps/api`:
   - `cd apps/api`
   - `npm install`
2. Generate Prisma client:
   - `npm run prisma:generate`
3. Apply database schema:
   - `npm run prisma:dbpush`
   - or `npm run prisma:migrate:dev --name auth-system`
4. Start the API:
   - `npm run dev`

## Frontend Setup

1. Install dependencies in `apps/admin-web`:
   - `cd apps/admin-web`
   - `npm install`
2. Start the admin portal:
   - `npm run dev`

## Deployment on Render

1. Create a Render Web Service for the API.
2. Set `Build Command` to:
   - `npm install && npm run prisma:generate && npm run build`
3. Set `Start Command` to:
   - `npm run start:prod`
4. Add all required environment variables from `apps/api/.env.example`.
5. Create a second Render Web Service for the Next.js frontend.
6. Set `Build Command` to:
   - `npm install && npm run build`
7. Set `Start Command` to:
   - `npm run start`
8. Set `NEXT_PUBLIC_API_URL` to your deployed API URL.

## Notes

- Use strong secrets for JWT and email credentials.
- Enable HTTPS/SSL at the Render service or application layer.
- Store government ID files in S3 for production-grade security.
- Keep `apps/api/.env` out of source control.
