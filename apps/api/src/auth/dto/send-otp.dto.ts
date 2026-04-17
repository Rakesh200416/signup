import { z } from "zod";

export const sendOtpSchema = z.object({
  channel: z.enum(["email", "phone"]),
  target: z.string().min(1, "Target value is required."),
  purpose: z.enum(["signup_email", "signin", "recovery"]).optional(),
});

export type SendOtpDto = z.infer<typeof sendOtpSchema>;
