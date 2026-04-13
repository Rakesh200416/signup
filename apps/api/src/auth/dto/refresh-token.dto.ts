import { z } from "zod";

export const refreshTokenSchema = z.object({
  email: z.string().email(),
  refreshToken: z.string().uuid(),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
