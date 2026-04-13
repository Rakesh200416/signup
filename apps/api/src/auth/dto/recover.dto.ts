import { z } from "zod";

export const recoverSchema = z.object({
  email: z.string().email(),
  method: z.enum(["securityQuestions", "backupCodes", "magicLink"]),
  securityAnswers: z
    .array(
      z.object({
        question: z.string().min(5),
        answer: z.string().min(3),
      }),
    )
    .optional(),
  backupCode: z.string().optional(),
  alternateEmail: z.string().email().optional(),
});

export type RecoverDto = z.infer<typeof recoverSchema>;
