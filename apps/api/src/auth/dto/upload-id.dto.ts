import { z } from "zod";

export const uploadIdSchema = z.object({
  email: z.string().email(),
  govtIdType: z.string().min(2),
  govtIdNumber: z.string().min(4).optional(),
});

export type UploadIdDto = z.infer<typeof uploadIdSchema>;
