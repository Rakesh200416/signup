import { z } from "zod";

export const signupSchema = z.object({
  identity: z.object({
    fullName: z.string().min(3),
    dob: z.string().min(8),
    govtIdType: z.string().min(2),
    govtIdUrl: z.string().url().optional(),
    profilePhotoUrl: z.string().url().optional(),
  }),
  contact: z.object({
    officialEmail: z.string().email(),
    personalEmail: z.string().email().optional(),
    primaryPhone: z.string().min(8),
    secondaryPhone: z.string().min(8).optional(),
  }),
  security: z
    .object({
      password: z
        .string()
        .min(12)
        .regex(/(?=.*[a-z])/, "At least one lowercase character is required")
        .regex(/(?=.*[A-Z])/, "At least one uppercase character is required")
        .regex(/(?=.*\d)/, "At least one digit is required")
        .regex(/(?=.*[^A-Za-z0-9])/, "At least one special character is required"),
      confirmPassword: z.string(),
      securityQuestions: z
        .array(
          z.object({
            question: z.string().min(10),
            answer: z.string().min(3),
          }),
        )
        .min(3),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords must match",
      path: ["confirmPassword"],
    }),
  advanced: z.object({
    totpEnabled: z.boolean().optional(),
    magicLinkEmail: z.string().email().optional(),
    backupCodes: z.array(z.string()).optional(),
    ipWhitelist: z.array(z.string()).optional(),
  }),
});

export type SignupDto = z.infer<typeof signupSchema>;
