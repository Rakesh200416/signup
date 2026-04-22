import { z } from "zod";

export const validatePasswordSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8),
});

export type ValidatePasswordDto = z.infer<typeof validatePasswordSchema>;
