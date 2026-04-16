import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
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
});

export type LoginDto = z.infer<typeof loginSchema>;
