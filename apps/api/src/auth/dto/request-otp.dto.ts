import { z } from "zod";

export const requestOtpSchema = z.object({
  // Accept either a resolved email or a raw identifier (username / phone)
  identifier: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  method: z.enum(["email", "phone", "magicLink"]),
  channel: z.enum(["primary", "alternate"]).optional(),
  purpose: z.enum(["signin", "recovery"]).optional(),
}).refine((d) => !!d.identifier || !!d.email, {
  message: "Either 'identifier' or 'email' is required.",
});

export type RequestOtpDto = z.infer<typeof requestOtpSchema>;
