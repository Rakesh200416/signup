"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Mail, Lock, ChevronDown, CircleCheckBig, CircleAlert, ShieldCheck, Fingerprint, UserCog } from "lucide-react";
import { DropdownSelect } from "./DropdownSelect";
import api from "../lib/api";

type OtpMethod = "email" | "phone";
type AlternateMethod = "totp" | "backupCode" | "recoveryCode" | "security" | "googleId";

interface ModernSigninExperienceProps {
  roleLabel: string;
  heading: string;
  description: string;
  redirectTo: string;
  signupHref: string;
  initialEmail?: string;
}

const alternateMethodCopy: Record<AlternateMethod, { label: string; placeholder: string; helper: string }> = {
  totp: {
    label: "Google Authenticator code",
    placeholder: "Enter the 6-digit authenticator code",
    helper: "Use the current code from your authenticator app.",
  },
  backupCode: {
    label: "Backup code",
    placeholder: "Enter backup code from signup",
    helper: "Use a backup code generated when your account was created.",
  },
  recoveryCode: {
    label: "Recovery code",
    placeholder: "Enter one recovery code",
    helper: "Use a recovery code generated at signup.",
  },
  security: {
    label: "Security answers",
    placeholder: "Enter answers separated by commas",
    helper: "Example: first school, blue, rover",
  },
  googleId: {
    label: "Google ID",
    placeholder: "Enter the Google ID used during signup",
    helper: "This should match the Google ID stored for the account.",
  },
};

function getToastMessage(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return fallback;

  const err = error as {
    message?: string;
    response?: {
      data?: {
        message?: string | string[];
      };
    };
  };

  const message = err.response?.data?.message ?? err.message;
  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" ? message : fallback;
}

export function ModernSigninExperience({
  roleLabel,
  heading,
  description,
  redirectTo,
  signupHref,
  initialEmail = "",
}: ModernSigninExperienceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [otpMethod, setOtpMethod] = useState<OtpMethod>("email");
  const [otpCode, setOtpCode] = useState("");
  const [alternateMethod, setAlternateMethod] = useState<AlternateMethod>("totp");
  const [alternateValue, setAlternateValue] = useState("");
  const [passwordState, setPasswordState] = useState<"idle" | "valid" | "invalid">("idle");
  const [passwordHint, setPasswordHint] = useState("Password status will appear here.");
  const [otpRequested, setOtpRequested] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const selectedMethodContent = useMemo(() => alternateMethodCopy[alternateMethod], [alternateMethod]);

  const fetchCsrfToken = async () => {
    const response = await api.get("/auth/csrf-token");
    return response.data?.csrfToken;
  };

  const validatePassword = async () => {
    if (!email.trim() || !password.trim()) {
      setPasswordState("idle");
      setPasswordHint("Enter email and password to validate.");
      return;
    }

    if (password.trim().length < 8) {
      setPasswordState("invalid");
      setPasswordHint("Password must be at least 8 characters.");
      toast.error("Password must be at least 8 characters.");
      return;
    }

    try {
      setIsCheckingPassword(true);
      const csrfToken = await fetchCsrfToken();
      const response = await api.post(
        "/auth/validate-password",
        { email: email.trim(), password: password.trim() },
        { headers: { "X-CSRF-Token": csrfToken } },
      );

      if (response.data?.valid) {
        setPasswordState("valid");
        setPasswordHint("Correct password detected.");
        toast.success("Password is correct.");
      } else {
        setPasswordState("invalid");
        setPasswordHint("Incorrect password for this account.");
        toast.error("Incorrect password.");
      }
    } catch (error) {
      setPasswordState("invalid");
      setPasswordHint(getToastMessage(error, "Password validation failed."));
      toast.error(getToastMessage(error, "Password validation failed."));
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const requestOtp = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first.");
      return;
    }

    try {
      setIsRequestingOtp(true);
      const csrfToken = await fetchCsrfToken();
      const response = await api.post(
        "/auth/request-otp",
        { email: email.trim(), method: otpMethod, purpose: "signin" },
        { headers: { "X-CSRF-Token": csrfToken } },
      );

      setOtpRequested(true);
      toast.success(response.data?.message || `OTP sent by ${otpMethod}.`);
    } catch (error) {
      toast.error(getToastMessage(error, "Unable to send OTP."));
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const submitSignin = async () => {
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!password.trim()) {
      toast.error("Password is required.");
      return;
    }

    if (!otpCode.trim() && !alternateValue.trim()) {
      toast.error("Enter an OTP or use another sign-in method.");
      return;
    }

    const payload: {
      email: string;
      password: string;
      captchaToken: string;
      acceptTerms: boolean;
      otpCode?: string;
      totpCode?: string;
      backupCode?: string;
      recoveryCode?: string;
      securityAnswers?: string[];
      googleId?: string;
    } = {
      email: email.trim(),
      password: password.trim(),
      captchaToken: "signin-captcha-token",
      acceptTerms: rememberMe,
    };

    if (otpCode.trim()) {
      payload.otpCode = otpCode.trim();
    }

    if (alternateValue.trim()) {
      if (alternateMethod === "totp") {
        payload.totpCode = alternateValue.trim();
      } else if (alternateMethod === "backupCode") {
        payload.backupCode = alternateValue.trim();
      } else if (alternateMethod === "recoveryCode") {
        payload.recoveryCode = alternateValue.trim();
      } else if (alternateMethod === "security") {
        payload.securityAnswers = alternateValue
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
      }
    }

    try {
      setIsSubmitting(true);
      const csrfToken = await fetchCsrfToken();
      await api.post("/auth/login", payload, { headers: { "X-CSRF-Token": csrfToken } });
      toast.success(`${roleLabel} sign in successful.`);
      startTransition(() => {
        router.push(redirectTo);
      });
    } catch (error) {
      toast.error(getToastMessage(error, `${roleLabel} sign in failed.`));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e6e8ee] px-4 py-10 text-[#1f2f53]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(230,231,238,0.86)_38%,_rgba(215,219,232,0.98)_100%)]" />
      <div className="pointer-events-none absolute left-[-4rem] top-12 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-2rem] h-72 w-72 rounded-full bg-[#d2d7e6] blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <section className="neumorphic-panel w-full max-w-2xl px-6 py-8 sm:px-10 sm:py-10">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#68789a] shadow-[8px_8px_16px_rgba(163,177,198,0.38),-8px_-8px_16px_rgba(255,255,255,0.95)]">
              <UserCog className="h-4 w-4" />
              {roleLabel}
            </div>
            <h1 className="mt-6 text-4xl font-medium tracking-[-0.03em] text-[#273457] sm:text-[3rem]">
              {heading}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#6e7f9f] sm:text-base">{description}</p>
          </div>

          <div className="mt-10 grid gap-5">
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#44557a]">Your email</span>
              <div className="neumorphic-field-group">
                <div className="neumorphic-icon-box">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={roleLabel === "Platform Admin" ? "platform.admin@company.com" : "super.admin@company.com"}
                  className="neumorphic-field-input"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#44557a]">Password</span>
                <span className="text-xs text-[#7d8aa8]">{isCheckingPassword ? "Checking..." : "Blur to validate password"}</span>
              </div>
              <div className={`neumorphic-field-group ${passwordState === "valid" ? "neumorphic-valid" : ""} ${passwordState === "invalid" ? "neumorphic-invalid" : ""}`}>
                <div className="neumorphic-icon-box">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={validatePassword}
                  placeholder="Password"
                  className="neumorphic-field-input"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                {passwordState === "valid" ? <CircleCheckBig className="h-4 w-4 text-emerald-600" /> : null}
                {passwordState === "invalid" ? <CircleAlert className="h-4 w-4 text-rose-600" /> : null}
                <span
                  className={
                    passwordState === "valid"
                      ? "text-emerald-600"
                      : passwordState === "invalid"
                        ? "text-rose-600"
                        : "text-[#7d8aa8]"
                  }
                >
                  {passwordHint}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1 text-sm text-[#415174]">
              <label className="flex items-center gap-3">
                <button
                  type="button"
                  aria-pressed={rememberMe}
                  onClick={() => setRememberMe((current) => !current)}
                  className={`neumorphic-check ${rememberMe ? "neumorphic-check-active" : ""}`}
                >
                  <span className="sr-only">Toggle remember me</span>
                </button>
                <span>Remember me</span>
              </label>
              <Link href="/reset-password" className="transition hover:text-[#223255]">
                Lost password?
              </Link>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#44557a]">Sign in method</span>
              <div className="grid gap-4 rounded-[1.75rem] border border-white/75 bg-[#e9edf3] p-4 shadow-[inset_8px_8px_16px_rgba(170,180,197,0.32),inset_-8px_-8px_16px_rgba(255,255,255,0.96)]">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="neumorphic-select-wrap">
                    <select
                      value={otpMethod}
                      onChange={(event) => setOtpMethod(event.target.value as OtpMethod)}
                      className="neumorphic-select"
                    >
                      <option value="email">OTP by email</option>
                      <option value="phone">OTP by phone</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7e99]" />
                  </div>
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={isRequestingOtp}
                    className="neumorphic-button min-w-[160px] px-6 py-4 text-sm font-semibold text-[#233247] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isRequestingOtp ? "Sending..." : otpRequested ? "Resend OTP" : "Request OTP"}
                  </button>
                </div>

                <div className="neumorphic-field-group">
                  <div className="neumorphic-icon-box">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <input
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    placeholder="Enter the 6-digit OTP"
                    className="neumorphic-field-input"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={submitSignin}
              disabled={isSubmitting || isPending}
              className="neumorphic-button w-full px-6 py-4 text-base font-semibold text-[#233247] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting || isPending ? "Signing in..." : `Sign in as ${roleLabel}`}
            </button>

            <div className="pt-1 text-center text-[1.05rem] text-[#4d5f82]">or sign in with another method</div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-[#44557a]">Other sign-in methods</span>
              <div className="grid gap-4 rounded-[1.75rem] border border-white/75 bg-[#e9edf3] p-4 shadow-[inset_8px_8px_16px_rgba(170,180,197,0.32),inset_-8px_-8px_16px_rgba(255,255,255,0.96)]">
                <DropdownSelect
                  value={alternateMethod}
                  options={[
                    { value: "totp", label: "1. Google Authenticator" },
                    { value: "backupCode", label: "2. Backup code (generated at signup)" },
                    { value: "recoveryCode", label: "3. Recovery codes (generated at signup)" },
                    { value: "security", label: "4. Security questions" },
                    { value: "googleId", label: "5. Google ID" },
                  ]}
                  placeholder="Select alternative sign-in method"
                  onChange={(value) => setAlternateMethod(value as AlternateMethod)}
                />

                <div className="neumorphic-field-group">
                  <div className="neumorphic-icon-box">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <input
                    value={alternateValue}
                    onChange={(event) => setAlternateValue(event.target.value)}
                    placeholder={selectedMethodContent.placeholder}
                    className="neumorphic-field-input"
                  />
                </div>

                <p className="text-xs leading-6 text-[#7785a0]">{selectedMethodContent.helper}</p>
              </div>
            </div>

            <div className="text-center text-base text-[#52637f]">
              Not registered?{" "}
              <Link href={signupHref} className="font-semibold text-[#243457] transition hover:text-[#1b2740]">
                Create account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
