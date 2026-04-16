"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Mail, Lock } from "lucide-react";
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

export default function ResetPasswordClient() {
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

  const inputWrapperClass =
    "flex items-center gap-3 rounded-[20px] border border-[#dee3ee] bg-[#edf1f8] px-4 py-3 shadow-[inset_2px_2px_5px_rgba(200,201,209,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] transition duration-200 ease-out hover:border-[#c6d0ff] hover:shadow-[inset_2px_2px_9px_rgba(200,201,209,0.5),inset_-2px_-2px_9px_rgba(255,255,255,0.95)] focus-within:border-[#7c8bff] focus-within:shadow-[inset_2px_2px_5px_rgba(176,184,204,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.95),0_0_0_4px_rgba(98,114,255,0.12)]";

  const password = watch("password") || "";
  const passwordPolicyRules = [
    {
      id: "length",
      label: "At least 8 characters",
      isValid: password.length >= 8,
    },
    {
      id: "special",
      label: "At least 1 special character",
      isValid: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: "uppercase",
      label: "At least 1 uppercase letter",
      isValid: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "At least 1 lowercase letter",
      isValid: /[a-z]/.test(password),
    },
    {
      id: "digit",
      label: "At least 1 numeric digit",
      isValid: /[0-9]/.test(password),
    },
  ];

  const passwordValidCount = passwordPolicyRules.filter((rule) => rule.isValid).length;
  const passwordStrength =
    passwordValidCount === 5
      ? { label: "Strong", emoji: "🟢", tone: "bg-[#e6f6e6] text-[#2f6f35] border-[#bceab3]" }
      : passwordValidCount >= 3
      ? { label: "Medium", emoji: "🟡", tone: "bg-[#fff7df] text-[#a8791f] border-[#f4dd8d]" }
      : { label: "Weak", emoji: "🔴", tone: "bg-[#fbeaea] text-[#9b3e42] border-[#e9c3c5]" };

  const email = watch("email");

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
    <main className="relative min-h-screen overflow-hidden bg-[#e6e7ee] text-[#273457]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-[#ffffff] blur-3xl opacity-70" />
        <div className="absolute right-12 top-28 h-60 w-60 rounded-full bg-[#d4d5dd] blur-3xl opacity-70" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#f8f9fd] blur-3xl opacity-60" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <NeumorphicCard className="rounded-[28px] bg-[#e6e7ee] p-8 shadow-[6px_6px_12px_rgba(200,201,209,0.35),-6px_-6px_12px_rgba(255,255,255,0.95)] sm:p-10">
            <div className="mb-8 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-[#7c8db9]">Reset your password</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#1f2937]">Reset your password</h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#565f7a]">
                Enter your new password to continue and verify your account using the one-time code sent to your email.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
              <label className="space-y-3 text-sm text-[#415174]">
                <span className="font-medium">Official email</span>
                <div className={inputWrapperClass}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#e6e7ee] shadow-[inset_2px_2px_5px_rgba(200,201,209,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] text-[#69718a]">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    placeholder="example@company.com"
                    {...register("email")}
                    className="w-full border-0 bg-transparent text-sm text-[#273457] placeholder:text-[#8e97b2] outline-none"
                  />
                </div>
                <p className="min-h-[1rem] text-xs text-[#c45353] transition duration-200">{errors.email?.message as string}</p>
              </label>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <label className="space-y-3 text-sm text-[#415174]">
                  <span className="font-medium">OTP code</span>
                  <div className={inputWrapperClass}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#e6e7ee] shadow-[inset_2px_2px_5px_rgba(200,201,209,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] text-[#69718a]">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      {...register("otpCode")}
                      className="w-full border-0 bg-transparent text-sm text-[#273457] placeholder:text-[#8e97b2] outline-none"
                    />
                  </div>
                  <p className="min-h-[1rem] text-xs text-[#c45353] transition duration-200">{errors.otpCode?.message as string}</p>
                </label>
                <NeumorphicButton
                  type="button"
                  className="h-14 w-full max-w-[200px] whitespace-nowrap"
                  onClick={requestOtp}
                  disabled={isRequestingOtp}
                >
                  {otpRequested ? "Resend OTP" : "Send OTP"}
                </NeumorphicButton>
              </div>

              <label className="space-y-3 text-sm text-[#415174]">
                <span className="font-medium">New password</span>
                <div className={inputWrapperClass}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#e6e7ee] shadow-[inset_2px_2px_5px_rgba(200,201,209,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] text-[#69718a]">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="w-full border-0 bg-transparent text-sm text-[#273457] placeholder:text-[#8e97b2] outline-none"
                  />
                </div>
                <div className="mt-4 rounded-[16px] border border-[#c8c9d1] bg-[#e6e7ee] p-4 shadow-[inset_2px_2px_5px_rgba(200,201,209,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] transition duration-300">
                  <p className="mb-3 text-sm font-medium text-[#4f5f9f]">Password policy</p>
                  <div className="grid gap-2">
                    {passwordPolicyRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={
                          `flex items-center gap-3 rounded-[14px] px-3 py-2 transition-colors duration-300 ${
                            rule.isValid ? "bg-[#eef8ef] text-[#2f6f35]" : "bg-[#faf0f2] text-[#8d3f4f]"
                          }`
                        }
                      >
                        <span
                          className={
                            `flex h-6 w-6 items-center justify-center rounded-full border text-xs transition duration-300 ${
                              rule.isValid
                                ? "border-[#bde5bc] bg-[#f4fbf4] text-[#2f6f35]"
                                : "border-[#ebc7cc] bg-[#fbf1f3] text-[#a45a68]"
                            }`
                          }
                        >
                          {rule.isValid ? "✔" : "●"}
                        </span>
                        <span className="text-sm">{rule.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-4 flex items-center justify-between rounded-[16px] border px-4 py-3 text-sm font-medium transition duration-300 ${passwordStrength.tone}`}>
                    <span className="flex items-center gap-2">
                      <span>{passwordStrength.emoji}</span>
                      <span>{passwordStrength.label}</span>
                    </span>
                    <span className="text-xs text-[#556785]">Strength</span>
                  </div>
                </div>
                <p className="min-h-[1rem] text-xs text-[#c45353] transition duration-200">{errors.password?.message as string}</p>
              </label>

              <label className="space-y-3 text-sm text-[#415174]">
                <span className="font-medium">Confirm password</span>
                <div className={inputWrapperClass}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#e6e7ee] shadow-[inset_2px_2px_5px_rgba(200,201,209,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] text-[#69718a]">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className="w-full border-0 bg-transparent text-sm text-[#273457] placeholder:text-[#8e97b2] outline-none"
                  />
                </div>
                <p className="min-h-[1rem] text-xs text-[#c45353] transition duration-200">{errors.confirmPassword?.message as string}</p>
              </label>

              <NeumorphicButton type="submit" className="w-full" disabled={isResetting}>
                Reset password
              </NeumorphicButton>

              <div className="pt-1 text-center">
                <Link href="/signin" className="text-sm font-medium text-[#50608b] transition duration-200 hover:text-[#374b9f] hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </form>
          </NeumorphicCard>
        </div>
      </div>
      <ToasterClient position="top-center" />
    </main>
  );
}
