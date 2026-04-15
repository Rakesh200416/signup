import { z } from "zod";

export const validateMagicLinkSchema = z.object({
  token: z.string().min(1),
});

export type ValidateMagicLinkDto = z.infer<typeof validateMagicLinkSchema>;
