import { z } from "zod";

export const recoverSchema = z.object({
  email: z.string().email(),
  method: z.enum(["emailOtp", "phoneOtp", "magicLink", "backupCodes", "totp", "securityQuestions", "govtId"]),
  securityAnswers: z
    .array(
      z.object({
        question: z.string().min(5),
        answer: z.string().min(3),
      }),
    )
    .optional(),
  otpCode: z.string().optional(),
  backupCode: z.string().optional(),
  totpCode: z.string().optional(),
  magicToken: z.string().optional(),
  alternateEmail: z.string().email().optional(),
  govtidVerificationKey: z.string().optional(),
});

export type RecoverDto = z.infer<typeof recoverSchema>;
