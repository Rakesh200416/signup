import { z } from "zod";

export const institutionAdminSignupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    officialEmail: z.string().email("Official email must be valid."),
    officialPhone: z.string().min(8, "Official phone number must be valid."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password is required."),
    googleId: z.string().email().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export type InstitutionAdminSignupDto = z.infer<typeof institutionAdminSignupSchema>;
