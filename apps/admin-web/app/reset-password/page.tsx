"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import api from "../lib/api";
import { NeumorphicButton } from "../components/NeumorphicButton";
import { NeumorphicCard } from "../components/NeumorphicCard";
import { ToasterClient } from "../components/ToasterClient";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    otpCode: z.string().min(6, "Enter the 6-digit OTP code.").max(6, "OTP code must be 6 digits."),
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

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [otpRequested, setOtpRequested] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", otpCode: "" },
  });

  const email = watch("email");
  const otpCode = watch("otpCode");

  const fetchCsrfToken = async () => {
    const response = await api.get("/auth/csrf-token");
    return response.data?.csrfToken;
  };

  const requestOtp = async () => {
    const normalizedEmail = email?.trim();
    if (!normalizedEmail) {
      toast.error("Enter your email to receive the password reset OTP.");
      return;
    }

    try {
      setIsRequestingOtp(true);
      const csrfToken = await fetchCsrfToken();
      const response = await api.post(
        "/auth/request-otp",
        { email: normalizedEmail, method: "email", purpose: "recovery" },
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      toast.success(response.data.message || "OTP sent to your email.");
      setOtpRequested(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const onSubmit = async (values: ResetPasswordForm) => {
    try {
      setIsResetting(true);
      const csrfToken = await fetchCsrfToken();
      await api.post(
        "/auth/reset-password",
        {
          email: values.email.trim(),
          password: values.password,
          confirmPassword: values.confirmPassword,
          otpCode: values.otpCode.trim(),
        },
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      toast.success("Password reset successful. Please sign in with your new password.");
      router.push("/");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Password reset failed.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <NeumorphicCard>
            <div className="mb-6 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Reset password</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">Reset your account password</h1>
              <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-[#cbd5e1]">
                Enter your email, choose a new password, request a recovery OTP, and submit to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Official email</span>
                <input className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("email")} />
                <span className="text-xs text-red-500">{errors.email?.message as string}</span>
              </label>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                  <span>OTP code</span>
                  <input className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("otpCode")} />
                  <span className="text-xs text-red-500">{errors.otpCode?.message as string}</span>
                </label>
                <NeumorphicButton type="button" className="h-fit w-full whitespace-nowrap" onClick={requestOtp} disabled={isRequestingOtp}>
                  {otpRequested ? "Resend OTP" : "Send OTP"}
                </NeumorphicButton>
              </div>

              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>New password</span>
                <input type="password" className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("password")} />
                <span className="text-xs text-red-500">{errors.password?.message as string}</span>
              </label>

              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Confirm password</span>
                <input type="password" className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("confirmPassword")} />
                <span className="text-xs text-red-500">{errors.confirmPassword?.message as string}</span>
              </label>

              <NeumorphicButton type="submit" className="w-full" disabled={isResetting}>
                Reset password
              </NeumorphicButton>
            </form>
          </NeumorphicCard>
        </div>
      </div>
      <ToasterClient />
    </main>
  );
}
