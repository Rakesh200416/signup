import { z } from "zod";

export const validatePasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type ValidatePasswordDto = z.infer<typeof validatePasswordSchema>;
