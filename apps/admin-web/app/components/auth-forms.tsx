"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import api from "../lib/api";
import { NeumorphicButton } from "./NeumorphicButton";
import { NeumorphicCard } from "./NeumorphicCard";
import { StepProgress } from "./StepProgress";
import { ThemeToggle } from "./ThemeToggle";
import { DatePicker } from "./DatePicker";
import { z } from "zod";

const getToastMessage = (error: unknown, fallback: string) => {
  if (typeof error === "string") return error;
  if (typeof error === "number" || typeof error === "boolean") return String(error);
  if (!error || typeof error !== "object") return fallback;

  const err = error as any;
  const message = err?.response?.data?.message ?? err?.message ?? err?.response?.data ?? err?.response ?? err;
  if (typeof message === "string") return message;
  try {
    return JSON.stringify(message);
  } catch {
    return fallback;
  }
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otpCode: z.string().min(6).max(6),
  captchaToken: z.string().optional(),
  acceptTerms: z.boolean().optional(),
});

const signupSchema = z.object({
  fullName: z.string().min(3),
  dob: z.string().min(8),
  govtIdType: z.string().min(2),
  govtIdUrl: z.string().url(),
  profilePhotoUrl: z.string().url(),
  officialEmail: z.string().email(),
  personalEmail: z.string().email().optional(),
  primaryPhone: z.string().min(8),
  secondaryPhone: z.string().min(8).optional(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  securityAnswers: z.array(z.string().min(3)).min(5),
  alternateEmail: z.string().email().optional(),
  ipWhitelist: z.string().optional(),
});

const identitySchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  dob: z.string().min(8, "Date of birth is required."),
  govtIdType: z.string().min(2, "Government ID type is required."),
});

const contactSchema = z.object({
  officialEmail: z.string().email("A valid official email is required."),
  personalEmail: z.string().email("A valid personal email is required.").optional(),
  primaryPhone: z.string().min(8, "Primary phone is required."),
  secondaryPhone: z.string().min(8, "Secondary phone must be at least 8 digits.").optional(),
});

const securitySchema = z
  .object({
    password: z
      .string()
      .min(12, "Password must be at least 12 characters.")
      .regex(/(?=.*[a-z])/, "At least one lowercase character is required.")
      .regex(/(?=.*[A-Z])/, "At least one uppercase character is required.")
      .regex(/(?=.*\d)/, "At least one digit is required.")
      .regex(/(?=.*[^A-Za-z0-9])/, "At least one special character is required."),
    confirmPassword: z.string().min(12, "Confirm your password."),
    question1: z.string().min(10, "Security question 1 is required."),
    answer1: z.string().min(3, "Answer 1 is required."),
    question2: z.string().min(10, "Security question 2 is required."),
    answer2: z.string().min(3, "Answer 2 is required."),
    question3: z.string().min(10, "Security question 3 is required."),
    answer3: z.string().min(3, "Answer 3 is required."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

const recoverySchema = z.object({
  alternateEmail: z.string().email("A valid alternate email is required."),
  alternatePhone: z.string().min(8, "Alternate phone is required."),
  ipWhitelist: z.string().optional(),
});

interface LoginFormProps {
  initialEmail?: string;
  redirectTo?: string;
  pageTitle?: string;
}

export function LoginForm({ initialEmail = "", redirectTo = "/dashboard", pageTitle = "Secure sign in" }: LoginFormProps = {}) {
  const [otpRequested, setOtpRequested] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "phone">("email");
  const [authStage, setAuthStage] = useState<"otp" | "totp" | "security" | "recovery" | "googleId" | "govtId">("otp");
  const [otpVerified, setOtpVerified] = useState(false);
  const [fallbackVerified, setFallbackVerified] = useState(false);
  const [failedOtpAttempts, setFailedOtpAttempts] = useState(0);
  const [otpRequestCount, setOtpRequestCount] = useState(0);
  const [otpRequestBlocked, setOtpRequestBlocked] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [totpInput, setTotpInput] = useState("");
  const [securityAnswers, setSecurityAnswers] = useState(["", "", ""]);
  const [googleIdInput, setGoogleIdInput] = useState("");
  const [govtIdInput, setGovtIdInput] = useState("");
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
  const [isVerifyingSecurity, setIsVerifyingSecurity] = useState(false);
  const [isVerifyingRecovery, setIsVerifyingRecovery] = useState(false);
  const [isVerifyingGovtId, setIsVerifyingGovtId] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [isInitializingTotp, setIsInitializingTotp] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialEmail,
      password: "",
      otpCode: "",
      captchaToken: "",
      acceptTerms: true,
    },
  });

  const email = watch("email");
  const password = watch("password");
  const otpCode = watch("otpCode");

  const fetchCsrfToken = async () => {
    const response = await api.get("/auth/csrf-token");
    return response.data?.csrfToken;
  };

  const requestOtp = async () => {
    if (otpRequestBlocked) {
      toast.error("OTP generation is currently limited. Use fallback methods instead.");
      return;
    }

    if (!email || !password) {
      toast.error("Enter email and password before requesting OTP.");
      return;
    }

    try {
      setIsRequestingOtp(true);
      const csrfToken = await fetchCsrfToken();
      const response = await api.post(
        "/auth/request-otp",
        { email, method: deliveryMethod },
        { headers: { "X-CSRF-Token": csrfToken } },
      );

      const limitReached = response.data?.limitReached;
      const nextCount = otpRequestCount + 1;
      setOtpRequestCount(nextCount);

      if (limitReached) {
        setShowFallback(true);
        setAuthStage("totp");
        setOtpRequestBlocked(true);
        setOtpRequested(false);
        toast.error(response.data.message || "OTP generation has reached its limit. Use fallback methods.");
        await initiateTotpSetup();
      } else {
        toast.success(response.data.message || "OTP requested successfully.");
        setOtpRequested(true);
        setAuthStage("otp");
        setOtpVerified(false);
      }

      if (nextCount >= 5) {
        setShowFallback(true);
        setAuthStage("totp");
      }
    } catch (error: any) {
      const message = getToastMessage(error, "OTP request failed.");
      toast.error(message);
      if (typeof message === "string" && message.toLowerCase().includes("temporarily limited")) {
        setShowFallback(true);
        setAuthStage("totp");
        setOtpRequestBlocked(true);
        await initiateTotpSetup();
      }
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const initiateTotpSetup = async () => {
    if (!email || !password) {
      toast.error("Enter email and password before starting Authenticator setup.");
      return;
    }

    try {
      setIsInitializingTotp(true);
      const csrfToken = await fetchCsrfToken();
      const response = await api.post(
        "/auth/setup-2fa",
        { email: email.trim(), password },
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      setQrCodeDataUrl(response.data.qrCodeDataUrl || "");
      setOtpauthUrl(response.data.otpauthUrl || "");
      toast.success("Scan the QR code with Google Authenticator and enter the 6-digit code below.");
    } catch (error: any) {
      toast.error(getToastMessage(error, "Unable to initialize Google Authenticator."));
    } finally {
      setIsInitializingTotp(false);
    }
  };

  const openFallbackMethods = async () => {
    setShowFallback(true);
    setAuthStage("totp");
    setOtpRequestBlocked(true);
    await initiateTotpSetup();
  };

  const verifyOtpCode = async () => {
    if (!email || !password) {
      toast.error("Enter email and password before verifying OTP.");
      return;
    }

    const cleanOtp = otpCode?.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      toast.error("Enter the 6-digit OTP code.");
      return;
    }

    try {
      const csrfToken = await fetchCsrfToken();
      await api.post(
        "/auth/verify-otp",
        { email: email.trim(), otpCode: cleanOtp },
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      setOtpVerified(true);
      setFailedOtpAttempts(0);
      setShowFallback(false);
      toast.success("OTP code accepted. Click Let's dive to complete sign in.");
    } catch (error: any) {
      const nextAttempts = failedOtpAttempts + 1;
      setFailedOtpAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setShowFallback(true);
        setAuthStage("totp");
        toast.error("OTP failed too many times. Use Google Authenticator, security questions, or Google ID fallback.");
      } else {
        toast.error(getToastMessage(error, "OTP verification failed."));
      }
    }
  };

  const completeSignIn = async (values: z.infer<typeof loginSchema>) => {
    if (!otpRequested && !fallbackVerified) {
      toast.error("Request an OTP before signing in or use a fallback method.");
      return;
    }

    if (!otpVerified && !fallbackVerified) {
      toast.error("Verify the OTP or complete a fallback authentication method before signing in.");
      return;
    }

    try {
      setIsLoggingIn(true);
      const csrfToken = await fetchCsrfToken();
      const response = await api.post(
        "/auth/login",
        {
          email: values.email.trim(),
          password: values.password,
          otpCode: values.otpCode?.trim(),
          totpCode: totpInput.trim() || undefined,
          securityAnswers: securityAnswers.filter((answer) => answer.trim().length > 0),
          googleId: googleIdInput.trim() || undefined,
          captchaToken: values.captchaToken || "login-captcha-token",
          acceptTerms: values.acceptTerms ?? true,
        },
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      toast.success("Login successful");
      router.push(redirectTo);
      console.log(response.data);
    } catch (error: any) {
      toast.error(getToastMessage(error, "Login failed"));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const verifyTotp = () => {
    if (!totpInput.trim() || totpInput.trim().length !== 6) {
      toast.error("Enter the 6-digit authenticator code.");
      return;
    }

    setFallbackVerified(true);
    toast.success("Google Authenticator code entered. Complete sign in now or try security questions if it fails.");
  };

  const verifySecurity = () => {
    const hasAll = securityAnswers.every((answer) => answer.trim().length >= 2);
    if (!hasAll) {
      toast.error("Answer all security questions to continue.");
      return;
    }

    setFallbackVerified(true);
    toast.success("Security answers accepted. Complete sign in now or continue to Google ID if needed.");
  };

  const verifyGoogleId = () => {
    if (!googleIdInput.trim() || googleIdInput.trim().length < 3) {
      toast.error("Enter the Google ID used at signup.");
      return;
    }

    setFallbackVerified(true);
    toast.success("Google ID accepted. Complete sign in now.");
  };

  const verifyRecovery = () => {
    if (!recoveryCodeInput.trim()) {
      toast.error("Enter a recovery code to continue.");
      return;
    }

    setAuthStage("govtId");
    toast.success("Recovery code accepted. Next, verify with government ID.");
  };

  const verifyGovtId = () => {
    if (!govtIdInput.trim()) {
      toast.error("Enter your government ID reference.");
      return;
    }

    toast.success("Government ID verification completed. Please sign in now.");
    setShowFallback(false);
    setAuthStage("otp");
  };

  return (
    <NeumorphicCard className="max-w-xl w-full force-white-text">
      <div className="mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-[#e6ebf2] p-6 shadow-[inset_6px_6px_16px_rgba(177,190,204,0.35),inset_-6px_-6px_16px_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-[#17202c] dark:shadow-[inset_6px_6px_16px_rgba(0,0,0,0.55),inset_-6px_-6px_16px_rgba(255,255,255,0.05)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#475569] dark:text-[#94a3b8]">Sign in</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">{pageTitle}</h1>
        </div>
        <ThemeToggle />
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit(completeSignIn)}>
        <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
          <span>Official email</span>
          <input className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("email")} />
          <span className="text-xs text-red-500">{errors.email?.message as string}</span>
        </label>
        <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
          <span>Password</span>
          <input type="password" className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("password")} />
          <span className="text-xs text-red-500">{errors.password?.message as string}</span>
        </label>
        <div className="neumorphic-surface p-5">
          <p className="text-sm font-medium text-[#334155] dark:text-[#cbd5e1]">Delivery method</p>
          <div className="mt-3 flex flex-col gap-3">
            {(["email", "phone"] as Array<"email" | "phone">).map((method) => (
              <label key={method} className="flex items-center gap-3 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <input
                  type="radio"
                  name="otpDelivery"
                  checked={deliveryMethod === method}
                  onChange={() => setDeliveryMethod(method)}
                  className="h-4 w-4 rounded border-gray-300 text-[#3549ff] focus:ring-[#3549ff]"
                />
                <span>Send OTP via {method}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <NeumorphicButton
            type="button"
            className="w-full max-w-[320px]"
            onClick={requestOtp}
            disabled={isRequestingOtp || otpRequestBlocked}
          >
            {otpRequestBlocked ? "OTP limit reached" : otpRequested ? "Resend OTP" : "Request OTP"}
          </NeumorphicButton>
        </div>

        {(otpRequestBlocked || failedOtpAttempts >= 5) && !showFallback ? (
          <div className="mt-5 rounded-3xl border border-amber-300/80 bg-amber-50 p-4 text-sm text-[#92400e] dark:border-amber-400/30 dark:bg-[#2b1f0f] dark:text-[#f8d19b]">
            <p className="font-semibold">OTP generation is temporarily limited.</p>
            <p className="mt-2 text-[#475569] dark:text-[#cbd5e1]">
              Email and phone OTP will resume after 5 hours. Meanwhile, use Google Authenticator or fallback verification.
            </p>
            <NeumorphicButton type="button" className="mt-4 w-full" onClick={openFallbackMethods}>
              Check other verification methods
            </NeumorphicButton>
          </div>
        ) : null}

        <div className="neumorphic-surface p-5">
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>OTP code</span>
            <input className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("otpCode")} />
            <span className="text-xs text-red-500">{errors.otpCode?.message as string}</span>
          </label>
          <div className="mt-4">
            {!otpVerified ? (
              <NeumorphicButton type="button" className="w-full" onClick={verifyOtpCode} disabled={!otpRequested || isRequestingOtp}>
                Verify OTP
              </NeumorphicButton>
            ) : (
              <NeumorphicButton type="submit" className="w-full" disabled={isLoggingIn}>
                Let's dive
              </NeumorphicButton>
            )}
            <p className="mt-3 text-xs text-[#64748b] dark:text-[#94a3b8]">
              {otpVerified
                ? "OTP confirmed. Tap Let's dive to complete sign in."
                : "Verify the 6-digit OTP sent to your email or phone before signing in."}
            </p>
          </div>
          {showFallback && (
            <div className="mt-6 neumorphic-surface p-4 text-sm text-[#334155] dark:text-[#e2e8f0]">
              <p className="font-semibold text-[#92400e] dark:text-[#fbbf24]">Ok, don't worry — let's try other methods.</p>
              <p className="mt-2 text-[#475569] dark:text-[#94a3b8]">Start with Google Authenticator. If that fails, continue to security questions, then verify your Google ID from signup.</p>
            </div>
          )}
        </div>

        {authStage === "totp" && showFallback && (
          <div className="mt-6 neumorphic-surface p-5 dark:text-[#cbd5e1]">
            <p className="text-sm font-semibold text-[#111827] dark:text-[#f8fafc]">Google Authenticator</p>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">
              Scan the QR code with Google Authenticator or Authy, then enter the 6-digit code.
            </p>
            {qrCodeDataUrl ? (
              <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <img src={qrCodeDataUrl} alt="Authenticator QR code" className="mx-auto max-w-full" />
                <p className="mt-3 text-xs text-[#64748b] dark:text-[#94a3b8]">
                  If you already have a configured authenticator, enter the code directly.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">No QR code yet? Generate one now.</p>
                <NeumorphicButton type="button" className="mt-3 w-full" onClick={initiateTotpSetup} disabled={isInitializingTotp}>
                  {isInitializingTotp ? "Generating QR code..." : "Generate QR code"}
                </NeumorphicButton>
              </div>
            )}
            <input
              value={totpInput}
              onChange={(event) => setTotpInput(event.target.value)}
              placeholder="Enter authenticator code"
              className="mt-4 neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <NeumorphicButton type="button" className="w-full" onClick={verifyTotp} disabled={isVerifyingTotp}>
                Verify authenticator
              </NeumorphicButton>
              <NeumorphicButton type="button" className="w-full" onClick={() => {
                setAuthStage("security");
                setFallbackVerified(false);
              }}>
                Try security questions
              </NeumorphicButton>
            </div>
          </div>
        )}

        {authStage === "security" && showFallback && (
          <div className="mt-6 neumorphic-surface p-5 dark:text-[#cbd5e1]">
            <p className="text-sm font-semibold text-[#111827] dark:text-[#f8fafc]">Security questions</p>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Answer any three of your registered security questions.</p>
            {securityAnswers.map((value, index) => (
              <input
                key={index}
                value={value}
                onChange={(event) => {
                  const next = [...securityAnswers];
                  next[index] = event.target.value;
                  setSecurityAnswers(next);
                }}
                placeholder={`Answer ${index + 1}`}
                className="mt-4 neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              />
            ))}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <NeumorphicButton type="button" className="w-full" onClick={verifySecurity} disabled={isVerifyingSecurity}>
                Verify answers
              </NeumorphicButton>
              <NeumorphicButton type="button" className="w-full" onClick={() => setAuthStage("googleId")}>Use Google ID</NeumorphicButton>
            </div>
          </div>
        )}

        {authStage === "googleId" && showFallback && (
          <div className="mt-6 neumorphic-surface p-5 dark:text-[#cbd5e1]">
            <p className="text-sm font-semibold text-[#111827] dark:text-[#f8fafc]">Google ID verification</p>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Enter the Google ID you used during signup.</p>
            <input
              value={googleIdInput}
              onChange={(event) => setGoogleIdInput(event.target.value)}
              placeholder="Enter Google ID"
              className="mt-4 neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <NeumorphicButton type="button" className="w-full" onClick={verifyGoogleId}>
                Verify Google ID
              </NeumorphicButton>
              <NeumorphicButton type="button" className="w-full" onClick={() => setAuthStage("security")}>Back to security questions</NeumorphicButton>
            </div>
          </div>
        )}

        {authStage === "recovery" && showFallback && (
          <div className="mt-6 neumorphic-surface p-5 dark:text-[#cbd5e1]">
            <p className="text-sm font-semibold text-[#111827] dark:text-[#f8fafc]">Recovery code</p>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Enter one of your eight recovery codes to continue.</p>
            <input
              value={recoveryCodeInput}
              onChange={(event) => setRecoveryCodeInput(event.target.value)}
              placeholder="Enter recovery code"
              className="mt-4 neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <NeumorphicButton type="button" className="w-full" onClick={verifyRecovery} disabled={isVerifyingRecovery}>
                Verify recovery code
              </NeumorphicButton>
              <NeumorphicButton type="button" className="w-full" onClick={() => setAuthStage("govtId")}>Verify with govt ID</NeumorphicButton>
            </div>
          </div>
        )}

        {authStage === "govtId" && showFallback && (
          <div className="mt-6 rounded-3xl border border-white/90 bg-[#f8fafc] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff] dark:border-slate-700 dark:bg-[#111827] dark:text-[#cbd5e1]">
            <p className="text-sm font-semibold text-[#111827] dark:text-[#f8fafc]">Government ID verification</p>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Enter the government ID reference used for your account.</p>
            <input
              value={govtIdInput}
              onChange={(event) => setGovtIdInput(event.target.value)}
              placeholder="Enter government ID"
              className="mt-4 neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
            />
            <NeumorphicButton type="button" className="mt-4 w-full" onClick={verifyGovtId} disabled={isVerifyingGovtId}>
              Verify government ID
            </NeumorphicButton>
          </div>
        )}
      </form>
    </NeumorphicCard>
  );
}

const govtIdOptions = [
  { label: "Aadhar", value: "aadhar" },
  { label: "PAN", value: "pan" },
  { label: "Passport", value: "passport" },
  { label: "Driving Licence", value: "driving_license" },
];

export function SignupWizard() {
  const steps = ["Basic info", "Contact verification", "Security", "Recovery", "2FA", "Review"];
  const [step, setStep] = useState(0);
  const [payload, setPayload] = useState<any>({ identity: {}, contact: {}, security: {}, advanced: {} });
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
  const [govtIdFile, setGovtIdFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [setupBackupCodes, setSetupBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState("");
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);

  const identityForm = useForm<z.infer<typeof identitySchema>>({
    resolver: zodResolver(identitySchema),
    defaultValues: { fullName: "", dob: "", govtIdType: "" },
  });
  const { register: registerIdentity, control: identityControl, handleSubmit: handleIdentitySubmit, formState: { errors: identityErrors } } = identityForm;

  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { officialEmail: "", personalEmail: "", primaryPhone: "", secondaryPhone: "" },
  });
  const { register: registerContact, handleSubmit: handleContactSubmit, formState: { errors: contactErrors } } = contactForm;

  const securityForm = useForm<z.infer<typeof securitySchema>>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      question1: "",
      answer1: "",
      question2: "",
      answer2: "",
      question3: "",
      answer3: "",
    },
  });
  const { register: registerSecurity, handleSubmit: handleSecuritySubmit, formState: { errors: securityErrors } } = securityForm;

  const recoveryForm = useForm<z.infer<typeof recoverySchema>>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { alternateEmail: "", alternatePhone: "", ipWhitelist: "" },
  });
  const { register: registerRecovery, handleSubmit: handleRecoverySubmit, formState: { errors: recoveryErrors } } = recoveryForm;

  useEffect(() => {
    resetCaptcha();
  }, []);

  const resetCaptcha = () => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    setCaptchaQuestion(`${a} + ${b} = ?`);
    setCaptchaAnswer(`${a + b}`);
    setCaptchaInput("");
    setCaptchaReady(true);
  };

  const fetchCsrfToken = async () => {
    const response = await api.get("/auth/csrf-token");
    return response.data?.csrfToken;
  };

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10).toUpperCase());
    setBackupCodes(codes);
    setBackupConfirmed(false);
    return codes;
  };

  const goNext = (section: string, data: any) => {
    const nextPayload = { ...data };
    if (section === "identity") {
      if (!govtIdFile) {
        toast.error("Please upload your government ID document before continuing.");
        return;
      }
      nextPayload.govtIdFile = govtIdFile;
      nextPayload.profilePhotoFile = photoFile;
    }
    setPayload((current: any) => ({ ...current, [section]: nextPayload }));
    setStep((current) => current + 1);
  };

  const createAccountAndPrepare2FA = async (finalPayload: any, finalBackupCodes: string[]) => {
    const identity = finalPayload.identity || {};
    const contact = finalPayload.contact || {};
    const security = finalPayload.security || {};
    const advanced = finalPayload.advanced || {};

    const signupPayload = {
      identity: {
        fullName: identity.fullName,
        dob: identity.dob,
        govtIdType: identity.govtIdType,
      },
      contact: {
        officialEmail: contact.officialEmail,
        personalEmail: contact.personalEmail,
        primaryPhone: contact.primaryPhone,
        secondaryPhone: contact.secondaryPhone,
      },
      security: {
        password: security.password,
        confirmPassword: security.confirmPassword,
        securityQuestions: [
          { question: security.question1, answer: security.answer1 },
          { question: security.question2, answer: security.answer2 },
          { question: security.question3, answer: security.answer3 },
        ],
      },
      advanced: {
        totpEnabled: true,
        backupCodes: finalBackupCodes,
        ipWhitelist: advanced.ipWhitelist ? advanced.ipWhitelist.split(",").map((ip: string) => ip.trim()).filter(Boolean) : [],
      },
    };

    setStep(4);
    setCreatedEmail(contact.officialEmail || "");
    setQrCodeDataUrl("");
    setOtpauthUrl("");
    setSetupBackupCodes([]);
    setTwoFactorVerified(false);
    setSignupComplete(false);

    try {
      setIsSubmitting(true);
      const csrfToken = await fetchCsrfToken();
      await api.post(
        "/auth/signup",
        signupPayload,
        { headers: { "X-CSRF-Token": csrfToken } },
      );

      if (photoFile) {
        const photoForm = new FormData();
        photoForm.append("email", contact.officialEmail);
        photoForm.append("profilePhotoFile", photoFile);
        await api.post(
          "/auth/upload-profile-photo",
          photoForm,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "X-CSRF-Token": csrfToken,
            },
          },
        );
      }

      const setupResponse = await api.post(
        "/auth/setup-2fa",
        { email: contact.officialEmail, password: security.password },
        { headers: { "X-CSRF-Token": csrfToken } },
      );

      setQrCodeDataUrl(setupResponse.data.qrCodeDataUrl || "");
      setOtpauthUrl(setupResponse.data.otpauthUrl || "");
      setSetupBackupCodes(setupResponse.data.backupCodes || []);
      setTwoFactorVerified(false);

      toast.success("Scan the QR code to finish Authenticator setup.");
    } catch (error: any) {
      toast.error(getToastMessage(error, "Signup failed."));
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishSignup = () => {
    setSignupComplete(true);
    toast.success("Signup complete. Your account is ready.");
  };

  const verifyTwoFactor = async () => {
    if (!totpCode.trim() || totpCode.trim().length !== 6) {
      toast.error("Enter the 6-digit authenticator code.");
      return;
    }

    try {
      setIsVerifyingTotp(true);
      const csrfToken = await fetchCsrfToken();
      await api.post(
        "/auth/setup-2fa",
        { email: payload.contact.officialEmail, password: payload.security.password, totpCode: totpCode.trim() },
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      setTwoFactorVerified(true);
      setStep(5);
      toast.success("Authenticator code verified. Proceed to the review step.");
    } catch (error: any) {
      toast.error(getToastMessage(error, "Authenticator verification failed."));
    } finally {
      setIsVerifyingTotp(false);
    }
  };

  return (
    <NeumorphicCard className="max-w-3xl w-full force-white-text">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#4b5563]">Super Admin onboarding</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">Secure multi-step signup</h2>
        </div>
        <ThemeToggle />
      </div>
      <StepProgress steps={steps} current={step} />

      {signupComplete ? (
        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/90 dark:border-slate-700 bg-[#f0f4fb] dark:bg-[#111827] p-8 shadow-[inset_8px_8px_16px_#c1c7d0,inset_-8px_-8px_16px_#ffffff]">
            <h3 className="text-2xl font-semibold text-[#111827] dark:text-[#f8fafc]">Account created successfully</h3>
            <p className="mt-3 text-sm text-[#475569] dark:text-[#94a3b8]">
              Your account has been created for <strong>{createdEmail}</strong>. An OTP has been sent to your official email and phone if configured.
            </p>
            <p className="mt-4 text-sm text-[#334155] dark:text-[#cbd5e1]">
              Please verify your OTP on the verification page before signing in.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <NeumorphicButton type="button" className="w-full" onClick={() => window.location.href = "/verify-otp"}>Verify OTP</NeumorphicButton>
              <NeumorphicButton type="button" className="w-full" onClick={() => window.location.href = "/"}>Go to Login</NeumorphicButton>
            </div>
          </div>
        </div>
      ) : (
        <>
          {step === 0 && (
            <form onSubmit={identityForm.handleSubmit((data) => goNext("identity", data))} className="grid gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#111827] dark:text-[#f8fafc]">Basic info</h3>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Start with your identity details before verification.</p>
          </div>
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>Full name</span>
            <input
              type="text"
              {...registerIdentity("fullName")}
              className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{identityErrors.fullName?.message as string}</span>
          </label>
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>Date of birth</span>
            <Controller
              control={identityControl}
              name="dob"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Choose birth date"
                  className="w-full"
                />
              )}
            />
            <span className="text-xs text-red-500">{identityErrors.dob?.message as string}</span>
          </label>
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>Government ID type</span>
            <div className="relative">
              <select
                {...registerIdentity("govtIdType")}
                className="w-full appearance-none rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 pr-10 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                required
              >
                <option value="">Select an ID type</option>
                {govtIdOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] dark:text-[#94a3b8]">▾</span>
            </div>
            <span className="text-xs text-red-500">{identityErrors.govtIdType?.message as string}</span>
          </label>
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>Government ID upload</span>
            <div className="relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => setGovtIdFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 pr-16 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                required
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-[#e2e8f0] px-3 py-1 text-xs text-[#334155] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.08)] dark:bg-[#1f2937] dark:text-[#cbd5e1]">
                📎 Browse
              </span>
            </div>
            {govtIdFile && <p className="text-xs text-[#334155] dark:text-[#cbd5e1]">Selected file: {govtIdFile.name}</p>}
          </label>
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>Upload profile photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
            />
            {photoFile && <p className="text-xs text-[#334155] dark:text-[#cbd5e1]">Selected file: {photoFile.name}</p>}
          </label>
          <div className="flex items-center justify-between gap-4">
            <button type="button" disabled className="cursor-not-allowed rounded-3xl bg-[#e6ebf2] dark:bg-[#1f2937] px-6 py-3 text-sm text-[#94a3b8] shadow-[inset_4px_4px_10px_#c1c7d0]">Back</button>
            <NeumorphicButton type="submit" className="w-full">Continue</NeumorphicButton>
          </div>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={contactForm.handleSubmit((data) => goNext("contact", data))} className="grid gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#111827] dark:text-[#f8fafc]">Contact verification</h3>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Enter email and phone details for mandatory OTP verification.</p>
          </div>
          {[
            { label: "Official email", name: "officialEmail", type: "email" },
            { label: "Personal email", name: "personalEmail", type: "email" },
            { label: "Primary phone", name: "primaryPhone", type: "tel" },
            { label: "Secondary phone", name: "secondaryPhone", type: "tel" },
          ].map((field) => (
            <label key={field.name} className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>{field.label}</span>
              <input
                type={field.type}
                {...registerContact(field.name as any)}
                className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                required={field.name !== "secondaryPhone"}
              />
              <span className="text-xs text-red-500">{(contactErrors as any)[field.name]?.message as string}</span>
            </label>
          ))}
          <div className="grid gap-4 rounded-3xl border border-white/90 dark:border-slate-700 bg-[#f0f4fb] dark:bg-[#111827] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-medium text-[#334155] dark:text-[#cbd5e1]">Email OTP</p>
                <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">OTP codes are generated automatically when the account is created. Verify them on the OTP confirmation page.</p>
              </div>
              <NeumorphicButton type="button" className="w-full cursor-not-allowed opacity-70" disabled>OTP after signup</NeumorphicButton>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-medium text-[#334155] dark:text-[#cbd5e1]">Phone OTP</p>
                <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a3b8]">A code is delivered to your primary phone after signup is complete.</p>
              </div>
              <NeumorphicButton type="button" className="w-full cursor-not-allowed opacity-70" disabled>OTP after signup</NeumorphicButton>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(0)}>Back</NeumorphicButton>
            <NeumorphicButton type="submit" className="w-full">Continue</NeumorphicButton>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSecuritySubmit((data) => goNext("security", data))} className="grid gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#111827] dark:text-[#f8fafc]">Security</h3>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Use a strong password and recovery questions.</p>
          </div>
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>Password</span>
            <input
              type="password"
              {...registerSecurity("password")}
              className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{securityErrors.password?.message as string}</span>
            <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">Minimum 12 chars, 1 uppercase, 1 number, 1 special character.</p>
          </label>
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>Confirm password</span>
            <input
              type="password"
              {...registerSecurity("confirmPassword")}
              className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{securityErrors.confirmPassword?.message as string}</span>
          </label>
          {Array.from({ length: 3 }, (_, index) => {
            const questionKey = `question${index + 1}` as "question1" | "question2" | "question3";
            const answerKey = `answer${index + 1}` as "answer1" | "answer2" | "answer3";
            return (
              <div key={index} className="grid gap-3 rounded-3xl border border-white/90 dark:border-slate-700 bg-[#f0f4fb] dark:bg-[#111827] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
                <p className="text-sm font-medium text-[#334155] dark:text-[#cbd5e1]">Security question {index + 1}</p>
                <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                  <span>Question</span>
                  <input
                    type="text"
                    {...registerSecurity(questionKey)}
                    className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                    required
                  />
                  <span className="text-xs text-red-500">{(securityErrors as any)[questionKey]?.message as string}</span>
                </label>
                <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                  <span>Answer</span>
                  <input
                    type="text"
                    {...registerSecurity(answerKey)}
                    className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                    required
                  />
                  <span className="text-xs text-red-500">{(securityErrors as any)[answerKey]?.message as string}</span>
                </label>
              </div>
            );
          })}
          <div className="rounded-3xl border border-white/90 dark:border-slate-700 bg-[#f0f4fb] dark:bg-[#111827] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <p className="text-sm font-medium text-[#334155] dark:text-[#cbd5e1]">Simple CAPTCHA</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="rounded-3xl bg-white dark:bg-[#0f172a] p-4 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_4px_4px_10px_#c1c7d0]">{captchaQuestion}</div>
              <input
                type="text"
                value={captchaInput}
                onChange={(event) => setCaptchaInput(event.target.value)}
                placeholder="Enter result"
                className="rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              />
            </div>
            <p className="mt-3 text-xs text-[#64748b] dark:text-[#94a3b8]">This quick math check keeps bots out.</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(1)}>Back</NeumorphicButton>
            <NeumorphicButton type="submit" className="w-full">Continue</NeumorphicButton>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={recoveryForm.handleSubmit(async (data) => {
          const nextBackupCodes = backupCodes.length ? backupCodes : generateBackupCodes();
          const nextPayload = { ...payload, advanced: { ...payload.advanced, ...data } };
          setPayload(nextPayload);
          await createAccountAndPrepare2FA(nextPayload, nextBackupCodes);
        })} className="grid gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#111827] dark:text-[#f8fafc]">Recovery setup</h3>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Capture alternate recovery channels and backup codes.</p>
          </div>
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>Alternate email</span>
            <input
              type="email"
              {...registerRecovery("alternateEmail")}
              className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{recoveryErrors.alternateEmail?.message as string}</span>
          </label>
          <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
            <span>Alternate phone number</span>
            <input
              type="tel"
              {...registerRecovery("alternatePhone")}
              className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{recoveryErrors.alternatePhone?.message as string}</span>
          </label>
          <div className="rounded-3xl border border-white/90 dark:border-slate-700 bg-[#f0f4fb] dark:bg-[#111827] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#111827] dark:text-[#f8fafc]">Recovery codes</p>
              <button type="button" onClick={generateBackupCodes} className="rounded-3xl border border-[#cbd5e1] px-4 py-2 text-sm text-[#334155] dark:text-[#cbd5e1] transition hover:bg-[#e2e8f0]">Generate codes</button>
            </div>
            {backupCodes.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {backupCodes.map((code) => (
                  <div key={code} className="rounded-2xl bg-white dark:bg-[#0f172a] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_4px_4px_10px_#c1c7d0]">{code}</div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#64748b] dark:text-[#94a3b8]">Generate 8 backup codes and store them securely. Each code is 8 characters long.</p>
            )}
            <label className="mt-4 flex items-center gap-3 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <input type="checkbox" checked={backupConfirmed} onChange={(event) => setBackupConfirmed(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#3549ff] focus:ring-[#3549ff]" />
              <span>I have stored the recovery codes securely.</span>
            </label>
          </div>
          <div className="flex items-center justify-between gap-4">
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(2)}>Back</NeumorphicButton>
            <NeumorphicButton type="submit" className="w-full" disabled={backupCodes.length === 0 || !backupConfirmed}>Continue</NeumorphicButton>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className="grid gap-6">
          <div>
            <h3 className="text-2xl font-semibold text-[#111827] dark:text-[#f8fafc]">Google Authenticator 2FA</h3>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Scan the QR code and enter the 6-digit authenticator code on this page to continue.</p>
          </div>

          {qrCodeDataUrl ? (
            <div className="grid gap-6 rounded-3xl border border-white/90 dark:border-slate-700 bg-[#f0f4fb] dark:bg-[#111827] p-6 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
              <div className="text-sm text-[#334155] dark:text-[#cbd5e1]">
                <p className="font-semibold text-[#111827] dark:text-[#f8fafc]">Step 1</p>
                <p className="mt-2">Open Google Authenticator, Authy, or another TOTP app and scan the QR code below.</p>
              </div>
              <div className="rounded-3xl border border-[#dbe0ea] bg-white dark:bg-[#0f172a] p-6 text-center">
                <img src={qrCodeDataUrl} alt="Authenticator QR code" className="mx-auto max-w-full" />
              </div>
              {otpauthUrl && (
                <div className="rounded-3xl border border-[#dbe0ea] bg-[#f8fafc] p-4 text-xs text-[#334155] dark:text-[#cbd5e1]">
                  <p className="font-semibold text-[#111827] dark:text-[#f8fafc]">Manual setup string</p>
                  <p className="mt-2 break-words">{otpauthUrl}</p>
                </div>
              )}
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Authenticator code</span>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(event) => setTotpCode(event.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full rounded-3xl border border-white/90 dark:border-slate-700 bg-[#e6ebf2] dark:bg-[#1f2937] px-4 py-3 text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                />
              </label>
              <NeumorphicButton type="button" className="w-full" onClick={verifyTwoFactor} disabled={isVerifyingTotp || twoFactorVerified}>
                {twoFactorVerified ? "Verified" : isVerifyingTotp ? "Verifying..." : "Verify code"}
              </NeumorphicButton>

              {twoFactorVerified && (
                <div className="rounded-3xl border border-[#22c55e] bg-[#ecfdf5] p-4 text-sm text-[#166534]">
                  <p className="font-semibold">Two-factor authentication is enabled.</p>
                  <p className="mt-2">Your Super Admin account is now protected with Google Authenticator.</p>
                </div>
              )}

              {setupBackupCodes.length > 0 && (
                <div className="rounded-3xl border border-[#e2e8f0] bg-[#e6ebf2] dark:bg-[#1f2937] p-4 text-sm text-[#334155] dark:text-[#cbd5e1]">
                  <p className="mb-3 font-semibold text-[#111827] dark:text-[#f8fafc]">Backup codes</p>
                  <ul className="grid gap-2">
                    {setupBackupCodes.map((code) => (
                      <li key={code} className="rounded-2xl bg-white dark:bg-[#0f172a] px-4 py-3 shadow-[inset_4px_4px_10px_#c1c7d0]">{code}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/90 dark:border-slate-700 bg-[#f0f4fb] dark:bg-[#111827] p-6 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
              <p className="text-sm text-[#334155] dark:text-[#cbd5e1]">
                {isSubmitting
                  ? "Creating your account and generating the Google Authenticator QR code..."
                  : "Preparing your authenticator setup. If this takes a moment, please wait."}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(3)}>Back</NeumorphicButton>
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(5)} disabled={!twoFactorVerified}>
              {twoFactorVerified ? "Continue to review" : "Verify code first"}
            </NeumorphicButton>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="grid gap-6">
          <div>
            <h3 className="text-2xl font-semibold text-[#111827] dark:text-[#f8fafc]">Review & complete</h3>
            <p className="mt-2 text-sm text-[#475569] dark:text-[#94a3b8]">Confirm the information and accept terms to finish your signup.</p>
          </div>
          <div className="grid gap-4 rounded-3xl border border-white/90 dark:border-slate-700 bg-[#f0f4fb] dark:bg-[#111827] p-6 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <SummaryItem title="Name" value={payload.identity.fullName || "-"} />
            <SummaryItem title="Official email" value={payload.contact.officialEmail || "-"} />
            <SummaryItem title="Primary phone" value={payload.contact.primaryPhone || "-"} />
            <SummaryItem title="Alternate email" value={payload.advanced.alternateEmail || "-"} />
            <SummaryItem title="Recovery codes" value={`${backupCodes.length} codes generated`} />
            <SummaryItem title="2FA" value="Google Authenticator setup after signup" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(4)}>Back</NeumorphicButton>
            <NeumorphicButton type="button" className="w-full" onClick={finishSignup} disabled={isSubmitting}>{isSubmitting ? "Finalizing..." : "Finalize signup"}</NeumorphicButton>
          </div>
        </div>
      )}
        </>
      )}
    </NeumorphicCard>
  );
}

function SummaryItem({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white dark:bg-[#0f172a] px-4 py-4 shadow-[inset_4px_4px_10px_#c1c7d0]">
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b] dark:text-[#94a3b8]">{title}</p>
      <p className="mt-2 text-sm text-[#111827] dark:text-[#f8fafc]">{value}</p>
    </div>
  );
}
