import { z } from "zod";

export const setup2FASchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type Setup2FADto = z.infer<typeof setup2FASchema>;
