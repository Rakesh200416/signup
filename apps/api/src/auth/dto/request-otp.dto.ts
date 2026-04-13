import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.string().email(),
  method: z.enum(["email", "phone"]),
});

export type RequestOtpDto = z.infer<typeof requestOtpSchema>;
