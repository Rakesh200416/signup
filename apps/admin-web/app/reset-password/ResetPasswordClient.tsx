"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import api from "../lib/api";
import { NeumorphicButton } from "../components/NeumorphicButton";
import { NeumorphicCard } from "../components/NeumorphicCard";
import { ToasterClient } from "../components/ToasterClient";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    otpCode: z.string().optional(),
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
  const [otpVerified, setOtpVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [otpContext, setOtpContext] = useState<{ email: string; password: string; confirmPassword: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", otpCode: "" },
  });

  const inputWrapperClass =
    "grid grid-cols-[52px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-[#d1d9e6] bg-[#e6e8ee] shadow-[inset_2px_2px_5px_#b8b9be,inset_-3px_-3px_7px_#ffffff] transition duration-300 focus-within:ring-2 focus-within:ring-[#8ec9ff]/40";

  const iconCellClass =
    "flex items-center justify-center border-r border-[#d1d9e6] text-[#5c6d94]";

  const inputClass =
    "w-full bg-transparent px-4 py-3 text-sm text-[#273457] outline-none placeholder:text-[#8e97b2]";

  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";
  const otpCode = watch("otpCode") || "";
  const email = watch("email") || "";

  const shouldShowPolicy = password.length > 0;
  const bothPasswordsTyped = password.length > 0 && confirmPassword.length > 0;
  const passwordsMatch = bothPasswordsTyped && password === confirmPassword;

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
  const passwordPolicyPassed = passwordValidCount === passwordPolicyRules.length;
  const passwordStrength =
    passwordValidCount === 5
      ? { label: "Strong", tone: "bg-[#e6f6e6] text-[#2f6f35] border-[#bceab3]" }
      : passwordValidCount >= 3
      ? { label: "Medium", tone: "bg-[#fff7df] text-[#a8791f] border-[#f4dd8d]" }
      : { label: "Weak", tone: "bg-[#fbeaea] text-[#9b3e42] border-[#e9c3c5]" };

  const canAskOtp = useMemo(() => {
    return email.trim().length > 0 && bothPasswordsTyped && passwordsMatch && passwordPolicyPassed;
  }, [email, bothPasswordsTyped, passwordsMatch, passwordPolicyPassed]);

  useEffect(() => {
    if (!otpContext) return;
    const emailChanged = otpContext.email !== email.trim();
    const pwdChanged = otpContext.password !== password;
    const confirmChanged = otpContext.confirmPassword !== confirmPassword;
    if (emailChanged || pwdChanged || confirmChanged) {
      setOtpVerified(false);
      setOtpContext(null);
    }
  }, [email, password, confirmPassword, otpContext]);

  const fetchCsrfToken = async () => {
    const response = await api.get("/auth/csrf-token");
    return response.data?.csrfToken;
  };

  const requestOtp = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      toast.error("Enter your email to receive the password reset OTP.");
      return;
    }

    if (!bothPasswordsTyped) {
      toast.error("Enter new password and confirm password before requesting OTP.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords must match before requesting OTP.");
      return;
    }

    if (!passwordPolicyPassed) {
      toast.error("Password policy is not complete. Please satisfy all rules first.");
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

      if (response.data?.devOtp) {
        setValue("otpCode", response.data.devOtp);
        toast.success(`[DEV] OTP auto-filled: ${response.data.devOtp}`);
      } else {
        toast.success(response.data.message || "OTP sent to your email.");
      }

      setOtpRequested(true);
      setOtpVerified(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const verifyOtp = async () => {
    const normalizedEmail = email.trim();
    const normalizedOtp = otpCode.trim();

    if (!otpRequested) {
      toast.error("Send OTP first.");
      return;
    }

    if (normalizedOtp.length !== 6) {
      toast.error("Enter the 6-digit OTP code.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const csrfToken = await fetchCsrfToken();
      await api.post(
        "/auth/verify-otp",
        { email: normalizedEmail, otpCode: normalizedOtp, purpose: "recovery" },
        { headers: { "X-CSRF-Token": csrfToken } },
      );

      setOtpVerified(true);
      setOtpContext({ email: normalizedEmail, password, confirmPassword });
      toast.success("OTP matched and verified successfully.");
    } catch (error: any) {
      setOtpVerified(false);
      toast.error(error?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmit = async (values: ResetPasswordForm) => {
    if (!otpVerified) {
      toast.error("Please verify OTP before updating password.");
      return;
    }

    try {
      setIsResetting(true);
      const csrfToken = await fetchCsrfToken();
      await api.post(
        "/auth/reset-password",
        {
          email: values.email.trim(),
          password: values.password,
          confirmPassword: values.confirmPassword,
          otpCode: (values.otpCode ?? "").trim(),
        },
        { headers: { "X-CSRF-Token": csrfToken } },
      );

      toast.success("Password is updated successfully.");
      setTimeout(() => {
        router.push("/signin");
      }, 1200);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Password reset failed.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e6e8ee] text-[#273457]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-[#ffffff] blur-3xl opacity-70" />
        <div className="absolute right-12 top-28 h-60 w-60 rounded-full bg-[#d4d5dd] blur-3xl opacity-70" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#f8f9fd] blur-3xl opacity-60" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <NeumorphicCard className="rounded-[28px] bg-[#e6e8ee] p-8 shadow-[6px_6px_12px_rgba(200,201,209,0.35),-6px_-6px_12px_rgba(255,255,255,0.95)] sm:p-10">
            <div className="mb-8 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-[#7c8db9]">Reset your password</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#1f2937]">Reset your password</h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#565f7a]">
                Type your new password first. After confirmation, send and verify OTP, then update password.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
              <label className="space-y-3 text-sm text-[#415174]">
                <span className="font-medium">Official email</span>
                <div className={inputWrapperClass}>
                  <span className={iconCellClass}>
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    placeholder="example@company.com"
                    {...register("email")}
                    className={inputClass}
                  />
                </div>
                <p className="min-h-[1rem] text-xs text-[#c45353] transition duration-200">{errors.email?.message as string}</p>
              </label>

              <label className="space-y-3 text-sm text-[#415174]">
                <span className="font-medium">New password</span>
                <div className={inputWrapperClass}>
                  <span className={iconCellClass}>
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={inputClass}
                  />
                </div>

                {shouldShowPolicy && (
                  <div className="mt-4 rounded-[18px] border border-[#d1d9e6] bg-[#e6e8ee] p-4 shadow-[inset_2px_2px_5px_#b8b9be,inset_-3px_-3px_7px_#ffffff] transition duration-300">
                    <p className="mb-3 text-sm font-medium text-[#4f5f9f]">Password policy</p>
                    <div className="grid gap-2">
                      {passwordPolicyRules.map((rule) => (
                        <div
                          key={rule.id}
                          className={`flex items-center gap-3 rounded-[14px] px-3 py-2 transition-colors duration-300 ${
                            rule.isValid ? "bg-[#eef8ef] text-[#2f6f35]" : "bg-[#faf0f2] text-[#8d3f4f]"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs transition duration-300 ${
                              rule.isValid
                                ? "border-[#bde5bc] bg-[#f4fbf4] text-[#2f6f35]"
                                : "border-[#ebc7cc] bg-[#fbf1f3] text-[#a45a68]"
                            }`}
                          >
                            {rule.isValid ? "✔" : "●"}
                          </span>
                          <span className="text-sm">{rule.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-4 flex items-center justify-between rounded-[16px] border px-4 py-3 text-sm font-medium transition duration-300 ${passwordStrength.tone}`}>
                      <span>{passwordStrength.label}</span>
                      <span className="text-xs text-[#556785]">Strength</span>
                    </div>
                  </div>
                )}

                <p className="min-h-[1rem] text-xs text-[#c45353] transition duration-200">{errors.password?.message as string}</p>
              </label>

              <label className="space-y-3 text-sm text-[#415174]">
                <span className="font-medium">Confirm password</span>
                <div className={inputWrapperClass}>
                  <span className={iconCellClass}>
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className={inputClass}
                  />
                </div>
                <p className="min-h-[1rem] text-xs text-[#c45353] transition duration-200">{errors.confirmPassword?.message as string}</p>
              </label>

              {bothPasswordsTyped && (
                <div className="rounded-[20px] border border-[#d1d9e6] bg-[#e6e8ee] p-5 shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#415174] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> OTP verification
                    </p>
                    {otpVerified && (
                      <span className="rounded-full border border-[#bde5bc] bg-[#eef8ef] px-3 py-1 text-xs font-semibold text-[#2f6f35]">Verified</span>
                    )}
                  </div>

                  {!passwordsMatch && (
                    <p className="mb-3 text-xs text-[#a45a68]">Passwords must match before requesting OTP.</p>
                  )}

                  {passwordsMatch && !passwordPolicyPassed && (
                    <p className="mb-3 text-xs text-[#a45a68]">Complete all password policy rules before requesting OTP.</p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className={inputWrapperClass}>
                      <span className={iconCellClass}>
                        <Lock className="h-5 w-5" />
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter 6-digit OTP"
                        {...register("otpCode")}
                        className={inputClass}
                      />
                    </div>

                    <NeumorphicButton
                      type="button"
                      className="h-12 w-full sm:w-auto"
                      onClick={requestOtp}
                      disabled={isRequestingOtp || !canAskOtp}
                    >
                      {otpRequested ? "Resend OTP" : "Send OTP"}
                    </NeumorphicButton>
                  </div>

                  <p className="mt-2 min-h-[1rem] text-xs text-[#c45353] transition duration-200">{errors.otpCode?.message as string}</p>

                  <NeumorphicButton
                    type="button"
                    className="mt-3 w-full"
                    onClick={verifyOtp}
                    disabled={!otpRequested || isVerifyingOtp || otpCode.trim().length !== 6}
                  >
                    {isVerifyingOtp ? "Verifying OTP..." : "Verify OTP"}
                  </NeumorphicButton>
                </div>
              )}

              <NeumorphicButton type="submit" className="w-full" disabled={isResetting || !otpVerified}>
                {isResetting ? "Updating password..." : "Update password"}
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
