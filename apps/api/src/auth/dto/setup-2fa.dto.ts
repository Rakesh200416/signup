import { z } from "zod";

export const setup2FASchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  totpCode: z.string().min(6).max(6).optional(),
}).refine(
  (data) => !!data.password || !!data.totpCode,
  {
    message: "Password or TOTP code is required.",
  },
);

export type Setup2FADto = z.infer<typeof setup2FASchema>;
