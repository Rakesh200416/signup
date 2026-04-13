import { z } from "zod";

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otpCode: z.string().min(6).max(6),
});

export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
