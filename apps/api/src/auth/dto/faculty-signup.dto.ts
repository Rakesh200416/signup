import { z } from "zod";

export const facultySignupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
      .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
      .regex(/(?=.*\d)/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Confirm password is required."),
    acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
    acceptPrivacy: z.boolean().refine((val) => val === true, "You must accept the privacy policy"),
    googleId: z.string().email().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export type FacultySignupDto = z.infer<typeof facultySignupSchema>;
