import { z } from "zod";

const identifierSchema = z.string().min(1);
const phoneSchema = z.string().min(6).regex(/^[0-9+()\- ]+$/, "Phone number must contain only digits and formatting characters.");

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(8),
    captchaToken: z.string().min(1),
    acceptTerms: z.boolean(),
    otpCode: z.string().min(6).max(6).optional(),
    totpCode: z.string().optional(),
    backupCode: z.string().optional(),
    recoveryCode: z.string().optional(),
    securityAnswers: z.array(z.string().min(1)).optional(),
    googleId: z.string().min(3).optional(),
    validateOnly: z.boolean().optional(),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: "Email or phone number is required.",
    path: ["email"],
  });

export type LoginDto = z.infer<typeof loginSchema>;
