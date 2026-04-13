import { z } from "zod";

export const setup2FASchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totpCode: z.string().min(6).max(6).optional(),
});

export type Setup2FADto = z.infer<typeof setup2FASchema>;
