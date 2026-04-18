import { z } from "zod";

const phoneSchema = z
  .string()
  .min(6)
  .regex(/^[0-9+()\- ]+$/, "Phone number must contain only digits and formatting characters.");

export const resetPasswordSchema = z
  .object({
    email: z.string().email().optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    otpCode: z.string().min(6).max(6),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: "Email or phone number is required.",
    path: ["email"],
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords must match.",
        path: ["confirmPassword"],
      });
    }
  });

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
