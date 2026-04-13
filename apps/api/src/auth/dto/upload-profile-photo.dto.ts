import { z } from "zod";

export const uploadProfilePhotoSchema = z.object({
  email: z.string().email(),
});

export type UploadProfilePhotoDto = z.infer<typeof uploadProfilePhotoSchema>;
