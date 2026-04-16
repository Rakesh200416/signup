"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { Mail, Lock, ShieldCheck, ChevronDown, CircleCheckBig, CircleAlert } from "lucide-react";
import { DropdownSelect } from "./DropdownSelect";
import api from "../lib/api";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otpCode: z
    .string()
    .optional()
    .refine((value) => !value || value.length === 6, {
      message: "Enter the 6-digit OTP code.",
    }),
  captchaToken: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

const sectionCard =
  "rounded-[24px] border border-white/80 bg-[#e6e7ee] p-5 shadow-[6px_6px_12px_#c8c9d1,-6px_-6px_12px_#ffffff] transition duration-300 hover:shadow-[8px_8px_20px_rgba(200,201,209,0.35),-8px_-8px_20px_rgba(255,255,255,0.8)]";

const inputGroup =
  "grid grid-cols-[52px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-[#e6e7ee] bg-[#e6e7ee] shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff] transition duration-300 focus-within:shadow-[inset_2px_2px_5px_#a9abb4,inset_-2px_-2px_5px_#ffffff,0_0_0_4px_rgba(75,87,146,0.12)] hover:shadow-[inset_2px_2px_5px_rgba(75,87,146,0.12),inset_-2px_-2px_5px_#ffffff]";

const inputField =
  "w-full bg-transparent px-4 py-4 text-base text-[#273457] outline-none placeholder:text-[#8e97b2] transition duration-300 hover:text-[#1d2a4b]";

const otpBox =
  "flex h-16 items-center justify-center rounded-[16px] border border-[#d8dbe6] bg-[#e6e7ee] text-xl font-semibold text-[#273457] shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff] transition duration-300 hover:shadow-[inset_3px_3px_7px_rgba(200,201,209,0.4),inset_-3px_-3px_7px_rgba(255,255,255,0.9)]";

const primaryButton =
  "w-full rounded-[20px] border border-white/80 bg-[#e6e7ee] px-6 py-4 text-sm font-semibold text-[#273457] shadow-[6px_6px_12px_#c8c9d1,-6px_-6px_12px_#ffffff] transition duration-300 hover:-translate-y-0.5 hover:shadow-[8px_8px_16px_rgba(200,201,209,0.35),-8px_-8px_16px_rgba(255,255,255,0.8)] active:translate-y-0.5 active:shadow-[inset_2px_2px_5px_rgba(200,201,209,0.7),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] disabled:cursor-not-allowed disabled:opacity-70";

const secondaryButton =
  "w-full rounded-[18px] border border-white/80 bg-[#e6e7ee] px-5 py-3 text-sm font-medium text-[#273457] shadow-[6px_6px_12px_#c8c9d1,-6px_-6px_12px_#ffffff] transition duration-300 hover:-translate-y-0.5 hover:shadow-[8px_8px_16px_rgba(200,201,209,0.28),-8px_-8px_16px_rgba(255,255,255,0.82)] active:translate-y-0.5 active:shadow-[inset_2px_2px_5px_rgba(200,201,209,0.75),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] disabled:cursor-not-allowed disabled:opacity-70";

function getToastMessage(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return fallback;
  const err = error as { message?: string; response?: { data?: { message?: string | string[] } } };
  const message = err.response?.data?.message ?? err.message;
  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" ? message : fallback;
}

interface Props {
  initialEmail?: string;
  redirectTo?: string;
  pageTitle?: string;
  allowedFallbackMethods?: Array<"totp" | "backup" | "recovery" | "security">;
  hideOtpSection?: boolean;
  allowFallbackSwitch?: boolean;
}

export function NeumorphicLoginForm({
  initialEmail = "",
  redirectTo = "/dashboard",
  pageTitle = "Super Admin Sign in",
  allowedFallbackMethods,
  hideOtpSection = false,
  allowFallbackSwitch = true,
}: Props) {
  const router = useRouter();
  const [otpRequested, setOtpRequested] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "phone">("email");
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState("");
  const [fallbackVerified, setFallbackVerified] = useState(false);
  const [failedOtpAttempts, setFailedOtpAttempts] = useState(0);
  const [otpRequestCount, setOtpRequestCount] = useState(0);
  const [lockPhase, setLockPhase] = useState(0);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [otpExpiredToastShown, setOtpExpiredToastShown] = useState(false);

  const fallbackMethodOptions = (allowedFallbackMethods ?? ["totp", "backup", "recovery", "security"]).map((method) => ({
    value: method,
    label:
      method === "totp"
        ? "1. Google Authenticator"
        : method === "backup"
        ? "2. Backup code"
        : method === "recovery"
        ? "3. Recovery code"
        : "4. Security questions",
  }));
  const initialFallbackMethod = fallbackMethodOptions[0]?.value ?? "totp";
  const [availableFallbackMethods, setAvailableFallbackMethods] = useState(fallbackMethodOptions);
  const [selectedMethod, setSelectedMethod] = useState<"totp" | "backup" | "recovery" | "security">(initialFallbackMethod);
  const [currentFallbackMethod, setCurrentFallbackMethod] = useState<"totp" | "backup" | "recovery" | "security">(initialFallbackMethod);
  const [authStage, setAuthStage] = useState<"otp" | "totp" | "backup" | "recovery" | "security">(
    hideOtpSection ? initialFallbackMethod : "otp",
  );
  const [showFallback, setShowFallback] = useState(hideOtpSection);
  const [fallbackSelectionOpen, setFallbackSelectionOpen] = useState(false);
  const [fallbackAttemptFailed, setFallbackAttemptFailed] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [passwordValidationMessage, setPasswordValidationMessage] = useState("");
  const [totpInput, setTotpInput] = useState("");
  const [securityAnswers, setSecurityAnswers] = useState(["", "", ""]);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [backupCodeInput, setBackupCodeInput] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingFallback, setIsVerifyingFallback] = useState(false);
  const [validatedFallbackPayload, setValidatedFallbackPayload] = useState<Record<string, any> | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [isInitializingTotp, setIsInitializingTotp] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: "", otpCode: "", captchaToken: "", rememberMe: true },
  });

  const email = watch("email");
  const password = watch("password");
  const otpCode = watch("otpCode");
  const rememberMe = watch("rememberMe");
  const otpHasError = Boolean(errors.otpCode);
  const otpBoxClass = `h-14 w-full rounded-[18px] border-2 px-4 text-center text-xl font-semibold text-[#273457] bg-white outline-none transition duration-200 ${otpHasError ? "border-rose-400 shadow-[0_0_0_1px_rgba(244,174,178,0.6)]" : "border-slate-300 shadow-[0_0_0_1px_rgba(148,163,184,0.35)]"} focus:border-[#6272ff] focus:ring-2 focus:ring-[#8ec9ff]/30 focus:shadow-[0_0_0_0_rgba(0,0,0,0.08)]`;
  const isPasswordVerified = passwordStatus === "valid";
  const isOtpLocked = Boolean(lockExpiresAt && lockExpiresAt > Date.now());
  const remainingAttempts = Math.max(0, 5 - failedOtpAttempts);
  const otpTimerTextColor = otpExpiresAt
    ? retryCountdown > 20
      ? "text-emerald-600"
      : retryCountdown > 10
      ? "text-amber-600"
      : "text-rose-500"
    : "text-[#415174]";
  const currentFallbackLabel = availableFallbackMethods.find((option) => option.value === currentFallbackMethod)?.label ?? "selected fallback";

  const fetchCsrfToken = async () => (await api.get("/auth/csrf-token")).data?.csrfToken;

  const validatePassword = async (emailValue: string, passwordValue: string) => {
    if (!emailValue?.trim() || !passwordValue?.trim() || passwordValue.trim().length < 8) {
      setPasswordStatus("idle");
      setPasswordValidationMessage("");
      return;
    }
    try {
      const csrfToken = await fetchCsrfToken();
      const response = await api.post(
        "/auth/validate-password",
        { email: emailValue.trim(), password: passwordValue.trim() },
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      if (response.data?.valid) {
        setPasswordStatus("valid");
        setPasswordValidationMessage("Password is correct.");
        toast.success("Password is correct.");
      } else {
        setPasswordStatus("invalid");
        setPasswordValidationMessage("Password does not match.");
        toast.error("Password does not match.");
      }
    } catch (error) {
      setPasswordStatus("invalid");
      setPasswordValidationMessage(getToastMessage(error, "Password validation failed."));
      toast.error(getToastMessage(error, "Password validation failed."));
    }
  };

  const initiateTotpSetup = async () => {
    if (!email || !password) return toast.error("Enter email and password before starting Authenticator setup.");
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
      setOtpExpiresAt(Date.now() + 30_000);
      toast.success("Scan the QR code with Google Authenticator and enter the 6-digit code within 30 seconds.");
    } catch (error) {
      toast.error(getToastMessage(error, "Unable to initialize Google Authenticator."));
    } finally {
      setIsInitializingTotp(false);
    }
  };

  const chooseOtherMethod = async () => {
    if (!availableFallbackMethods.length) return toast.error("No fallback methods remain. Contact support for help.");
    const method = availableFallbackMethods.find((option) => option.value === selectedMethod) ? selectedMethod : availableFallbackMethods[0].value;
    setShowFallback(true);
    setFallbackSelectionOpen(false);
    setFallbackAttemptFailed(false);
    setSelectedMethod(method);
    setCurrentFallbackMethod(method);
    setAuthStage(method);
  };

  const openFallbackMethods = async () => {
    if (!availableFallbackMethods.length) return toast.error("No fallback methods remain. Contact support for help.");
    const nextMethod = availableFallbackMethods[0].value;
    setShowFallback(true);
    setFallbackSelectionOpen(true);
    setFallbackAttemptFailed(false);
    setSelectedMethod(nextMethod);
    setCurrentFallbackMethod(nextMethod);
    setAuthStage(nextMethod);
  };

  const requestOtp = async () => {
    if (hideOtpSection) return;
    if (!isPasswordVerified) return toast.error("Verify your password before requesting OTP.");
    if (isOtpLocked) return toast.error("OTP is locked. Wait until the lock expires before requesting again.");
    if (!email || !password) return toast.error("Enter email and password before requesting OTP.");
    try {
      setIsRequestingOtp(true);
      const csrfToken = await fetchCsrfToken();
      const response = await api.post(
        "/auth/request-otp",
        { email, method: deliveryMethod },
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      const nextCount = otpRequestCount + 1;
      setOtpRequestCount(nextCount);
      setOtpRequested(true);
      setOtpVerified(false);
      setFallbackVerified(false);
      setVerifiedOtpCode("");
      setValue("otpCode", "");
      setTotpInput("");
      setOtpExpiresAt(Date.now() + 30_000);
      setRetryCountdown(30);
      setOtpExpiredToastShown(false);
      toast.success(response.data.message || `OTP sent by ${deliveryMethod}. It is valid for 30 seconds.`);
    } catch (error) {
      const message = getToastMessage(error, "OTP request failed.");
      toast.error(`${message} You can still use other options.`);
      setOtpRequestCount(otpRequestCount + 1);
      setShowFallback(true);
      setFallbackSelectionOpen(true);
      setFallbackAttemptFailed(false);
      const fallbackMethod = availableFallbackMethods[0]?.value ?? "totp";
      setSelectedMethod(fallbackMethod);
      setCurrentFallbackMethod(fallbackMethod);
      setAuthStage(fallbackMethod);
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const removeFallbackMethod = (method: "totp" | "backup" | "recovery" | "security") => {
    setAvailableFallbackMethods((current) => {
      const next = current.filter((option) => option.value !== method);
      if (selectedMethod === method && next.length > 0) {
        setSelectedMethod(next[0].value);
      }
      if (currentFallbackMethod === method && next.length > 0) {
        setCurrentFallbackMethod(next[0].value);
      }
      return next;
    });
  };

  const updateTimers = () => {
    const now = Date.now();
    if (otpExpiresAt) {
      const secondsLeft = Math.max(0, Math.ceil((otpExpiresAt - now) / 1000));
      setRetryCountdown(secondsLeft);
      if (secondsLeft <= 0) {
        setOtpExpiresAt(null);
      }
    }
    if (lockExpiresAt) {
      const secondsLeft = Math.max(0, Math.ceil((lockExpiresAt - now) / 1000));
      setLockRemaining(secondsLeft);
      if (secondsLeft <= 0) {
        setLockExpiresAt(null);
      }
    }
  };

  useEffect(() => {
    if (!otpExpiresAt && !lockExpiresAt) return;
    const interval = window.setInterval(updateTimers, 250);
    return () => window.clearInterval(interval);
  }, [otpExpiresAt, lockExpiresAt]);

  useEffect(() => {
    if (!otpRequested || otpVerified || otpExpiresAt !== null || otpExpiredToastShown) return;
    toast.error("OTP has expired. Request again or use fallback authentication.");
    setOtpExpiredToastShown(true);
  }, [otpRequested, otpVerified, otpExpiresAt, otpExpiredToastShown]);

  const verifyOtpCode = async (code?: string) => {
    if (!isPasswordVerified) return toast.error("Verify your password before verifying OTP.");
    if (isOtpLocked) return toast.error("OTP is locked. Please wait for the lock to expire.");
    if (!email || !password) return toast.error("Enter email and password before verifying OTP.");
    const cleanOtp = (code ?? otpCode ?? "").trim();
    if (!cleanOtp || cleanOtp.length !== 6) return toast.error("Enter the 6-digit OTP code.");
    try {
      const csrfToken = await fetchCsrfToken();
      await api.post(
        "/auth/verify-otp",
        { email: email.trim(), otpCode: cleanOtp },
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      setOtpVerified(true);
      setVerifiedOtpCode(cleanOtp);
      setValidatedFallbackPayload({ otpCode: cleanOtp });
      setValue("otpCode", cleanOtp);
      setFallbackVerified(false);
      setTotpInput("");
      setFailedOtpAttempts(0);
      setOtpExpiresAt(null);
      setShowFallback(false);
      toast.success("OTP code accepted. Click Sign in to complete sign in.");
    } catch (error) {
      const nextAttempts = failedOtpAttempts + 1;
      setFailedOtpAttempts(nextAttempts);
      const retryLeft = Math.max(0, 5 - nextAttempts);
      if (nextAttempts >= 5) {
        const nextLockPhase = Math.min(lockPhase + 1, 3);
        const lockMinutes = [5, 15, 30, 60][nextLockPhase] ?? 60;
        setLockPhase(nextLockPhase);
        setLockExpiresAt(Date.now() + lockMinutes * 60_000);
        setFailedOtpAttempts(0);
        setOtpExpiresAt(null);
        setShowFallback(true);
        setFallbackSelectionOpen(true);
        setFallbackAttemptFailed(false);
        setCurrentFallbackMethod(availableFallbackMethods[0]?.value ?? "totp");
        setAuthStage(availableFallbackMethods[0]?.value ?? "totp");
        toast.error(`OTP failed too many times. Your account is locked for ${lockMinutes} minutes. Use fallback methods once the lock expires.`);
      } else {
        toast.error(`OTP verification failed. ${retryLeft} retry${retryLeft === 1 ? "" : "ies"} left.`);
      }
    }
  };

  const verifyFallbackMethod = async () => {
    if (!isPasswordVerified) return toast.error("Verify your password before continuing.");
    if (!email || !password) return toast.error("Enter email and password before continuing.");

    const payload: Record<string, any> = {
      email: email.trim(),
      password,
      captchaToken: "login-captcha-token",
      acceptTerms: true,
    };

    if (authStage === "totp") {
      const code = totpInput.trim();
      if (!code || code.length !== 6) return toast.error("Enter the 6-digit authenticator code.");
      payload.totpCode = code;
    } else if (authStage === "backup") {
      const code = backupCodeInput.trim();
      if (!code) return toast.error("Enter a backup code to continue.");
      payload.backupCode = code;
    } else if (authStage === "recovery") {
      const code = recoveryCodeInput.trim();
      if (!code) return toast.error("Enter a recovery code to continue.");
      payload.recoveryCode = code;
    } else if (authStage === "security") {
      const answers = securityAnswers.map((answer) => answer.trim());
      if (answers.length !== securityAnswers.length || answers.some((answer) => answer.length < 2)) {
        return toast.error("Answer all security questions with at least 2 characters each.");
      }
      payload.securityAnswers = answers;
    } else {
      return toast.error("Select a fallback verification method.");
    }

    try {
      setIsVerifyingFallback(true);
      const csrfToken = await fetchCsrfToken();
      await api.post("/auth/login", payload, { headers: { "X-CSRF-Token": csrfToken } });
      setValidatedFallbackPayload({ ...payload });
      setFallbackVerified(true);
      setFallbackAttemptFailed(false);
      setFallbackSelectionOpen(false);
      toast.success("Fallback verified successfully. Signing in...");
      router.push(redirectTo);
    } catch (error) {
      setFallbackVerified(false);
      setFallbackAttemptFailed(true);
      toast.error(getToastMessage(error, "Fallback verification failed."));
    } finally {
      setIsVerifyingFallback(false);
    }
  };

  useEffect(() => {
    if (fallbackVerified) {
      setValue("otpCode", "");
    }
  }, [fallbackVerified, setValue]);

  const completeSignIn = async (values: z.infer<typeof loginSchema>) => {
    if (!hideOtpSection && !otpRequested && !fallbackVerified) return toast.error("Request an OTP before signing in or use a fallback method.");
    const otpValue = values.otpCode?.trim();
    if (!hideOtpSection && !otpVerified && !fallbackVerified && !otpValue) return toast.error("Verify the OTP or complete a fallback authentication method before signing in.");
    try {
      setIsLoggingIn(true);
      const csrfToken = await fetchCsrfToken();
      const loginPayload: Record<string, any> = {
        email: values.email.trim(),
        password: values.password,
        captchaToken: values.captchaToken || "login-captcha-token",
        acceptTerms: true,
      };

      if (otpVerified) {
        loginPayload.otpCode = verifiedOtpCode || otpValue;
      } else if (fallbackVerified) {
        if (validatedFallbackPayload) {
          Object.assign(loginPayload, validatedFallbackPayload);
        } else {
          if (authStage === "totp" && totpInput.trim().length === 6) {
            loginPayload.totpCode = totpInput.trim();
          }
          if (authStage === "backup" && backupCodeInput.trim()) {
            loginPayload.backupCode = backupCodeInput.trim();
          }
          if (authStage === "recovery" && recoveryCodeInput.trim()) {
            loginPayload.recoveryCode = recoveryCodeInput.trim();
          }
          if (authStage === "security") {
            const answers = securityAnswers.filter((answer) => answer.trim().length > 0);
            if (answers.length) {
              loginPayload.securityAnswers = answers;
            }
          }
        }
      } else if (otpValue) {
        loginPayload.otpCode = otpValue;
      }

      console.debug("completeSignIn payload", {
        loginPayload,
        otpVerified,
        fallbackVerified,
        authStage,
        validatedFallbackPayload,
      });

      await api.post(
        "/auth/login",
        loginPayload,
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      toast.success("Login successful");
      router.push(redirectTo);
    } catch (error) {
      console.error("completeSignIn error", error);
      if (typeof error === "object" && error !== null && "response" in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;
        console.error("completeSignIn error response", err.response?.data ?? err);
      }
      toast.error(getToastMessage(error, "Login failed. Please try again."));
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="w-full max-w-[780px] rounded-[28px] border border-white/80 bg-[#e6e7ee] p-7 shadow-[18px_18px_36px_#c8c9d1,-18px_-18px_36px_#ffffff] transition-all duration-300 sm:p-10">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#5c6d94]">Welcome back</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#273457] sm:text-5xl">{pageTitle}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#6d789e]">Secure super admin and platform admin access with modern OTP, authenticator, and fallback sign-in options in a soft neumorphic layout.</p>
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit(completeSignIn)}>
        <label className="space-y-3 text-sm text-[#415174]">
          <span className="font-medium">Email address</span>
          <div className={inputGroup}>
            <div className="flex items-center justify-center border-r border-[#d8dbe6] text-[#5c6d94]">
              <Mail className="h-5 w-5" />
            </div>
            <input placeholder="example@company.com" className={inputField} {...register("email")} />
          </div>
          <p className="min-h-[1rem] text-xs text-rose-500">{errors.email?.message as string}</p>
        </label>

        <label className="space-y-3 text-sm text-[#415174]">
          <div className="flex items-center justify-between">
            <span className="font-medium">Password</span>
            <span className="text-xs text-[#7d8aa7]">Validation on blur</span>
          </div>
          <div className={`${inputGroup} ${passwordStatus === "valid" ? "border-emerald-400" : passwordStatus === "invalid" ? "border-rose-400" : ""}`}>
            <div className="flex items-center justify-center border-r border-[#d8dbe6] text-[#5c6d94]">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type="password"
              placeholder="Create password"
              className={inputField}
              {...register("password")}
              onBlur={() => validatePassword(email, password)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            {passwordStatus === "valid" ? <CircleCheckBig className="h-4 w-4 text-emerald-600" /> : null}
            {passwordStatus === "invalid" ? <CircleAlert className="h-4 w-4 text-rose-500" /> : null}
            <span className={passwordStatus === "valid" ? "text-emerald-600" : passwordStatus === "invalid" ? "text-rose-500" : "text-[#7d8aa7]"}>
              {passwordValidationMessage || (errors.password?.message as string) || "Minimum 8 characters."}
            </span>
          </div>
        </label>

        <div className="flex flex-col gap-3 rounded-[20px] border border-white/80 bg-[#e6e7ee] p-5 shadow-[6px_6px_12px_#c8c9d1,-6px_-6px_12px_#ffffff] sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-[#415174]">
            <input type="checkbox" className="peer sr-only" {...register("rememberMe")} />
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#d7dae6] bg-[#e6e7ee] shadow-[6px_6px_12px_#c8c9d1,-6px_-6px_12px_#ffffff] peer-checked:shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff]">
              <span className={`h-2.5 w-2.5 rounded-full bg-[#4f73c8] transition ${rememberMe ? "scale-100" : "scale-0"}`} />
            </span>
            <span>Remember me</span>
          </label>
          <Link href="/reset-password" className="text-sm font-medium text-[#42557d] transition hover:text-[#243457]">Lost password?</Link>
        </div>

        <div className={sectionCard}>
{!hideOtpSection ? (
          <>
            <div className="flex items-center gap-3 text-sm font-semibold text-[#415174]">
              <ShieldCheck className="h-4 w-4" />
              <span>OTP delivery method</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["email", "phone"] as Array<"email" | "phone">).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setDeliveryMethod(method)}
                  className={`rounded-[18px] border px-4 py-3 text-sm font-medium text-[#273457] transition ${
                    deliveryMethod === method
                      ? "border-[#9fb0d1] shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff]"
                      : "border-white/80 shadow-[6px_6px_12px_#c8c9d1,-6px_-6px_12px_#ffffff] hover:-translate-y-0.5"
                  } bg-[#e6e7ee]`}
                >
                  OTP via {method}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {!hideOtpSection ? (
        <button type="button" className={primaryButton} onClick={requestOtp} disabled={isRequestingOtp || isOtpLocked}>
          {isOtpLocked ? "OTP locked" : otpRequested ? "Resend OTP" : "Request OTP"}
        </button>
      ) : null}

        {!showFallback && !hideOtpSection && (
          <div className={sectionCard}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#415174]">
                <ShieldCheck className="h-4 w-4" />
                <span>OTP verification</span>
              </div>
              <span className="text-xs text-[#7d8aa7]">6-digit secure code</span>
            </div>

            <div className="group grid gap-4 rounded-[20px] border border-[#d8dbe6] bg-[#e6e7ee] p-5 shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff] text-center">
              <div className="mx-auto max-w-[28rem]">
                <div className="mb-4 text-center">
                  <p className="text-sm font-semibold text-[#415174]">OTP verification</p>
                  <p className="mt-2 text-sm text-[#72809f]">Enter the 6-digit code from email or phone.</p>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className={otpBoxClass}
                  {...register("otpCode")}
                  placeholder="Enter 6-digit code"
                />
                <p className="min-h-[1rem] mt-2 text-xs text-rose-500">{errors.otpCode?.message as string}</p>
                {otpExpiresAt ? (
                  <p className={`mt-3 text-sm font-semibold ${otpTimerTextColor}`}>
                    OTP expires in {retryCountdown}s
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex justify-center">
                {!otpVerified && !fallbackVerified ? (
                  <button type="button" className={primaryButton} onClick={() => verifyOtpCode()} disabled={!otpRequested || isRequestingOtp}>
                    Verify OTP
                  </button>
                ) : (
                  <button type="submit" className={primaryButton} disabled={isLoggingIn}>
                    Sign in
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs text-[#72809f]">
              <p>{otpVerified ? "OTP confirmed. Tap Sign in to complete sign in." : fallbackVerified ? "Fallback verified. Tap Sign in to complete sign in." : "Verify the 6-digit OTP sent to your email or phone before signing in."}</p>
              {!isOtpLocked && failedOtpAttempts > 0 && !otpVerified ? (
                <p>{remainingAttempts} retry{remainingAttempts === 1 ? "" : "ies"} left before lockout.</p>
              ) : null}
              {isOtpLocked ? (
                <p>OTP requests locked for another <span className="font-semibold text-[#415174]">{lockRemaining}s</span>.</p>
              ) : null}
            </div>
          </div>
        )}

          {showFallback && (
            <div className="mt-5 rounded-[20px] border border-white/80 bg-[#e6e7ee] p-4 text-sm text-[#415174] shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff]">
              <p className="font-semibold text-[#415174]">Alternative verification methods available.</p>
              <p className="mt-2 text-[#72809f]">
                Use {currentFallbackLabel} now{allowFallbackSwitch ? ", or switch to another remaining method if verification fails." : "."}
              </p>
            </div>
        )}

{showFallback && fallbackSelectionOpen && (
          <div className={sectionCard}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#415174]">Choose a fallback method</p>
                <p className="mt-2 text-sm text-[#72809f]">Pick one alternative verification method to proceed.</p>
              </div>
              <button type="button" className={`${secondaryButton} w-full sm:w-auto`} onClick={() => setShowFallback(false)}>
                Hide fallback options
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <DropdownSelect
                value={selectedMethod}
                options={availableFallbackMethods.map((option, index) => ({
                  value: option.value,
                  label: `${index + 1}. ${option.label}`,
                }))}
                placeholder="Select fallback method"
                onChange={(value) => setSelectedMethod(value as "totp" | "backup" | "recovery" | "security")}
              />
              <button type="button" className={secondaryButton} onClick={chooseOtherMethod}>
                Use selected method
              </button>
            </div>
          </div>
        )}

        {(isOtpLocked || failedOtpAttempts >= 5) && !showFallback && (
          <div className="rounded-[20px] border border-amber-200 bg-[#f9f5ea] p-4 text-sm text-[#7a5a12] shadow-[inset_2px_2px_5px_rgba(200,201,209,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.65)]">
            <p className="font-semibold">OTP generation is temporarily limited.</p>
            <p className="mt-2">Email and phone OTP requests will resume later. Use Authenticator or fallback verification meanwhile.</p>
            <button type="button" className={`${secondaryButton} mt-4`} onClick={openFallbackMethods}>
              Check fallback methods
            </button>
          </div>
        )}

        {authStage === "totp" && showFallback && !fallbackSelectionOpen ? (
          <div className={sectionCard}>
            <p className="text-sm font-semibold text-[#273457]">Google Authenticator</p>
            <p className="mt-2 text-sm text-[#72809f]">Enter the 6-digit code from your existing Authenticator or Authy app.</p>
            <input
              value={totpInput}
              onChange={(event) => setTotpInput(event.target.value)}
              placeholder="123456"
              className="mt-4 w-full rounded-[18px] border border-[#d8dbe6] bg-[#e6e7ee] px-4 py-4 text-sm text-[#273457] shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff] outline-none"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" className={secondaryButton} onClick={verifyFallbackMethod} disabled={isVerifyingFallback}>
                Verify authenticator
              </button>
              {fallbackVerified ? (
                <button type="submit" className={primaryButton} disabled={isLoggingIn}>
                  Sign in
                </button>
              ) : fallbackAttemptFailed && availableFallbackMethods.length > 0 && allowFallbackSwitch ? (
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => {
                    setFallbackSelectionOpen(true);
                    setShowFallback(true);
                    setFallbackAttemptFailed(false);
                  }}
                >
                  Choose another method
                </button>
              ) : null}
            </div>

            <div className="mt-8 rounded-[18px] border border-[#d8dbe6] bg-[#f8fbff] p-4 shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#273457]">Google Authenticator Setup</p>
                  <p className="mt-1 text-sm text-[#72809f]">Scan the QR code to add this account to your Authenticator app.</p>
                </div>
                <button
                  type="button"
                  className={`${secondaryButton} w-full sm:w-auto ${isInitializingTotp ? "opacity-70 cursor-not-allowed" : ""}`}
                  onClick={initiateTotpSetup}
                  disabled={isInitializingTotp}
                >
                  {qrCodeDataUrl ? "Refresh QR code" : "Show QR scanner"}
                </button>
              </div>
              {qrCodeDataUrl ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="rounded-[18px] border border-[#d8dbe6] bg-white p-4 shadow-[inset_2px_2px_5px_#f0f3f9,inset_-2px_-2px_5px_#ffffff]">
                    <img src={qrCodeDataUrl} alt="Authenticator QR code" className="mx-auto max-w-full" />
                    {otpauthUrl ? (
                      <div className="mt-3 rounded-[16px] border border-[#e2e8f0] bg-[#f8fafc] p-3 text-xs text-[#475569]">
                        <p className="font-semibold">Manual setup URI</p>
                        <p className="mt-1 break-all">{otpauthUrl}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-3 rounded-[18px] border border-[#d8dbe6] bg-[#eef4ff] p-4 text-sm text-[#415174] shadow-[inset_2px_2px_5px_#e2e6f5,inset_-2px_-2px_5px_#ffffff]">
                    <p className="font-semibold text-[#273457]">How to use</p>
                    <ul className="list-inside list-disc space-y-2 text-[#50607d]">
                      <li>Open Google Authenticator or Authy on your phone.</li>
                      <li>Tap + and choose “Scan a QR code”.</li>
                      <li>Point your camera at the QR image above.</li>
                      <li>Enter the 6-digit code generated by the app.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#72809f]">If you don't have an authenticator code yet, generate a QR code and scan it with your app.</p>
              )}
            </div>
          </div>
        ) : null}

        {authStage === "security" && showFallback && !fallbackSelectionOpen ? (
          <div className={sectionCard}>
            <p className="text-sm font-semibold text-[#273457]">Security questions</p>
            <p className="mt-2 text-sm text-[#72809f]">Answer the registered security questions for fallback access.</p>
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
                className="mt-4 w-full rounded-[18px] border border-[#d8dbe6] bg-[#e6e7ee] px-4 py-4 text-sm text-[#273457] shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff] outline-none"
              />
            ))}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" className={secondaryButton} onClick={verifyFallbackMethod} disabled={isVerifyingFallback}>
                Verify answers
              </button>
              {fallbackVerified ? (
                <button type="submit" className={primaryButton} disabled={isLoggingIn}>
                  Sign in
                </button>
              ) : fallbackAttemptFailed && availableFallbackMethods.length > 0 && allowFallbackSwitch ? (
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => {
                    setFallbackSelectionOpen(true);
                    setShowFallback(true);
                    setFallbackAttemptFailed(false);
                  }}
                >
                  Choose another method
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {authStage === "backup" && showFallback && !fallbackSelectionOpen ? (
          <div className={sectionCard}>
            <p className="text-sm font-semibold text-[#273457]">Backup code</p>
            <p className="mt-2 text-sm text-[#72809f]">Enter a backup code generated at signup for fallback access.</p>
            <input
              value={backupCodeInput}
              onChange={(event) => setBackupCodeInput(event.target.value)}
              placeholder="Enter backup code"
              className="mt-4 w-full rounded-[18px] border border-[#d8dbe6] bg-[#e6e7ee] px-4 py-4 text-sm text-[#273457] shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff] outline-none"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" className={secondaryButton} onClick={verifyFallbackMethod} disabled={isVerifyingFallback}>
                Verify backup code
              </button>
              {fallbackVerified ? (
                <button type="submit" className={primaryButton} disabled={isLoggingIn}>
                  Sign in
                </button>
              ) : fallbackAttemptFailed && availableFallbackMethods.length > 0 && allowFallbackSwitch ? (
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => {
                    setFallbackSelectionOpen(true);
                    setShowFallback(true);
                    setFallbackAttemptFailed(false);
                  }}
                >
                  Choose another method
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {authStage === "recovery" && showFallback && !fallbackSelectionOpen ? (
          <div className={sectionCard}>
            <p className="text-sm font-semibold text-[#273457]">Recovery code</p>
            <p className="mt-2 text-sm text-[#72809f]">Enter one of your recovery codes to continue.</p>
            <input
              value={recoveryCodeInput}
              onChange={(event) => setRecoveryCodeInput(event.target.value)}
              placeholder="Enter recovery code"
              className="mt-4 w-full rounded-[18px] border border-[#d8dbe6] bg-[#e6e7ee] px-4 py-4 text-sm text-[#273457] shadow-[inset_2px_2px_5px_#c8c9d1,inset_-2px_-2px_5px_#ffffff] outline-none"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" className={secondaryButton} onClick={verifyFallbackMethod} disabled={isVerifyingFallback}>
                Verify recovery code
              </button>
              {fallbackVerified ? (
                <button type="submit" className={primaryButton} disabled={isLoggingIn}>
                  Sign in
                </button>
              ) : fallbackAttemptFailed && availableFallbackMethods.length > 0 && allowFallbackSwitch ? (
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => {
                    setFallbackSelectionOpen(true);
                    setShowFallback(true);
                    setFallbackAttemptFailed(false);
                  }}
                >
                  Choose another method
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}

