import { z } from "zod";

export const verifyOtpSchema = z.object({
  email: z.string().email().optional(),
  channel: z.enum(["email", "mobile"]).optional(),
  target: z.string().min(1).optional(),
  purpose: z.enum(["signup_email", "signup_mobile", "signin", "recovery"]).optional(),
  otpCode: z.string().min(4).max(6).optional(),
  otp: z.string().min(4).max(6).optional(),
}).refine(
  (data) => data.email || (data.channel && data.target),
  {
    message: "Either email or channel + target is required for OTP verification.",
  },
).refine(
  (data) => !!data.otpCode || !!data.otp,
  {
    message: "OTP code is required.",
  },
);

export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
