import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.string().email(),
  method: z.enum(["email", "phone", "magicLink"]),
  purpose: z.enum(["signin", "recovery"]).optional(),
});

export type RequestOtpDto = z.infer<typeof requestOtpSchema>;
