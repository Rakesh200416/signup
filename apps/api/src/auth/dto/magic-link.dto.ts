import { z } from "zod";

export const magicLinkSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["signin", "recovery"]),
});

export type MagicLinkDto = z.infer<typeof magicLinkSchema>;
