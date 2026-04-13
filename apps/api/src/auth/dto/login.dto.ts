import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  captchaToken: z.string().min(1),
  acceptTerms: z.boolean(),
  otpCode: z.string().min(6).max(6),
  totpCode: z.string().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
