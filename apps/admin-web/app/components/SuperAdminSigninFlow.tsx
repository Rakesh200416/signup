"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  User, Lock, Mail, Phone, ShieldCheck, ArrowRight,
  CheckCircle2, XCircle, Timer, RefreshCw, Key,
  HelpCircle, CreditCard, Users, Send, Eye, EyeOff,
  AlertTriangle, QrCode,
} from "lucide-react";
import { NeumorphicButton } from "./NeumorphicButton";
import api from "../lib/api";

// ─── Style tokens ────────────────────────────────────────────────────────────

const inputGroup =
  "grid grid-cols-[52px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-[#d1d9e6] bg-[#e6e8ee] shadow-[inset_2px_2px_5px_#b8b9be,inset_-2px_-2px_5px_#ffffff] transition duration-300 focus-within:ring-2 focus-within:ring-[#8ec9ff]/40";

const inputField =
  "w-full bg-transparent px-4 py-4 text-base text-[#273457] outline-none placeholder:text-[#8e97b2]";

const card =
  "rounded-[22px] border border-[#d1d9e6] bg-[#e6e8ee] p-5 shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]";

const insetCard =
  "rounded-[18px] border border-[#d1d9e6] bg-[#e6e8ee] p-4 shadow-[inset_2px_2px_5px_#b8b9be,inset_-3px_-3px_7px_#ffffff]";

const methodCard = (active: boolean) =>
  `cursor-pointer rounded-[18px] border p-4 text-sm transition-all duration-200 ${
    active
      ? "border-[#9fb0d1] bg-[#e6e8ee] shadow-[inset_2px_2px_5px_#b8b9be,inset_-2px_-2px_5px_#ffffff] text-[#273457] font-semibold"
      : "border-[#d1d9e6] bg-[#e6e8ee] shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] text-[#44476a] hover:-translate-y-0.5"
  }`;

const otpInputCls =
  "w-full rounded-[14px] border-2 border-[#d1d9e6] bg-[#e6e8ee] px-4 py-4 text-center text-xl font-semibold text-[#273457] shadow-[inset_2px_2px_5px_#b8b9be,inset_-2px_-2px_5px_#ffffff] outline-none focus:border-[#6272ff] focus:ring-2 focus:ring-[#8ec9ff]/30 tracking-[0.35em]";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractErrorMsg(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const e = error as any;
  const msg = e?.response?.data?.message ?? e?.message ?? fallback;
  return typeof msg === "string" ? msg : fallback;
}

function isOtpTemporarilyLimited(error: unknown): boolean {
  const msg = extractErrorMsg(error, "").toLowerCase();
  return (
    msg.includes("temporarily limited") ||
    msg.includes("request again after 5 hours") ||
    msg.includes("reached its limit")
  );
}

async function fetchCsrf(): Promise<string> {
  const res = await api.get("/auth/csrf-token");
  return res.data?.csrfToken ?? res.data?.token ?? "";
}

function saveSession(data: { accessToken: string; refreshToken?: string; expiresAt?: string }) {
  sessionStorage.setItem("accessToken", data.accessToken);
  if (data.refreshToken) sessionStorage.setItem("refreshToken", data.refreshToken);
  if (data.expiresAt) sessionStorage.setItem("expiresAt", data.expiresAt);
}

// ─── OTP Timer ───────────────────────────────────────────────────────────────

function OtpTimer({ expiresAt, onExpire }: { expiresAt: number; onExpire: () => void }) {
  const [secs, setSecs] = useState(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
  const expired = useRef(false);

  useEffect(() => {
    expired.current = false;
    const tick = () => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecs(left);
      if (left === 0 && !expired.current) {
        expired.current = true;
        onExpire();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [expiresAt]);

  const color =
    secs > 20 ? "text-emerald-600" : secs > 10 ? "text-amber-500" : "text-rose-500";
  const bg =
    secs > 20 ? "bg-emerald-50 border-emerald-200" : secs > 10 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${color} ${bg}`}>
      <Timer className="h-3.5 w-3.5" />
      {secs}s
    </span>
  );
}

// ─── Stage headings ───────────────────────────────────────────────────────────

const STAGE_META: Record<string, { icon: React.ElementType; label: string; sub: string }> = {
  altOtp: { icon: Mail, label: "Alternate Contact OTP", sub: "Send OTP to your alternate email or phone." },
  totp: { icon: ShieldCheck, label: "Google Authenticator", sub: "Enter the 6-digit code from your authenticator app." },
  securityCodes: { icon: Key, label: "Security Codes", sub: "Enter any one of the 9 security codes you saved at signup." },
  recoveryCode: { icon: Key, label: "Recovery Code", sub: "Enter the recovery code you were given at signup." },
  securityQuestions: { icon: HelpCircle, label: "Security Questions", sub: "Answer the questions you set during signup." },
  govtId: { icon: CreditCard, label: "Government ID Verification", sub: "Enter your government ID number as registered." },
  approver: { icon: Users, label: "Secondary Approver — Last Resort", sub: "" },
};

// ─── Main component ───────────────────────────────────────────────────────────

type SigninStage =
  | "credentials"
  | "primaryOtp"
  | "altOtp"
  | "totp"
  | "securityCodes"
  | "recoveryCode"
  | "securityQuestions"
  | "govtId"
  | "approver"
  | "done";

const FALLBACK_ORDER: SigninStage[] = [
  "altOtp",
  "totp",
  "recoveryCode",
  "securityCodes",
  "securityQuestions",
  "govtId",
  "approver",
];

interface Props {
  redirectTo?: string;
}

export function SuperAdminSigninFlow({ redirectTo = "/dashboard" }: Props) {
  const router = useRouter();

  // ── Identifier / password ──────────────────────────────────────────────────
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [resolvedEmail, setResolvedEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [maskedAltEmail, setMaskedAltEmail] = useState("");
  const [maskedAltPhone, setMaskedAltPhone] = useState("");
  const [govtIdTypeHint, setGovtIdTypeHint] = useState("");

  // ── Stage & OTP ────────────────────────────────────────────────────────────
  const [stage, setStage] = useState<SigninStage>("credentials");
  const [remainingStages, setRemainingStages] = useState<SigninStage[]>([...FALLBACK_ORDER]);

  const [otpDelivery, setOtpDelivery] = useState<"email" | "phone">("email");
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpExpired, setOtpExpired] = useState(false);
  const [otpGenerations, setOtpGenerations] = useState(0); // primary
  const [altOtpDelivery, setAltOtpDelivery] = useState<"altEmail" | "altPhone">("altEmail");
  const [altOtpCode, setAltOtpCode] = useState("");
  const [altOtpExpiresAt, setAltOtpExpiresAt] = useState<number | null>(null);
  const [altOtpExpired, setAltOtpExpired] = useState(false);
  const [altOtpGenerations, setAltOtpGenerations] = useState(0);
  const [altOtpVerified, setAltOtpVerified] = useState(false);

  // ── Fallback inputs ────────────────────────────────────────────────────────
  const [totpCode, setTotpCode] = useState("");
  const [totpVerified, setTotpVerified] = useState(false);
  const [signinTotpToken, setSigninTotpToken] = useState("");
  const [totpQrCode, setTotpQrCode] = useState("");
  const [isLoadingTotpQr, setIsLoadingTotpQr] = useState(false);
  const [secCode, setSecCode] = useState("");
  const [secCodeAttempts, setSecCodeAttempts] = useState(0);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [secAnswers, setSecAnswers] = useState(["", "", ""]);
  const [securityQuestionAttempts, setSecurityQuestionAttempts] = useState(0);
  const [govtIdInput, setGovtIdInput] = useState("");
  const [approverRequestSent, setApproverRequestSent] = useState(false);
  const [approverCode, setApproverCode] = useState("");
  const [approverSentTo, setApproverSentTo] = useState("");
  const [approverDisplay, setApproverDisplay] = useState<{ name?: string; email?: string; phone?: string | null } | null>(null);

  // ── Loading flags ──────────────────────────────────────────────────────────
  const [isBusy, setIsBusy] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [pendingSession, setPendingSession] = useState<{ accessToken: string; refreshToken?: string; expiresAt?: string } | null>(null);
  const [pendingSignInLabel, setPendingSignInLabel] = useState("");
  const [rotatedRecoveryCode, setRotatedRecoveryCode] = useState("");
  const [allowAltNext, setAllowAltNext] = useState(false);
  const [allowTotpNext, setAllowTotpNext] = useState(false);
  const [allowRecoveryNext, setAllowRecoveryNext] = useState(false);
  const [allowGovtIdNext, setAllowGovtIdNext] = useState(false);

  const hasAltEmail = !!maskedAltEmail;
  const hasAltPhone = !!maskedAltPhone;
  const selectedAltUnavailable = (altOtpDelivery === "altEmail" && !hasAltEmail) || (altOtpDelivery === "altPhone" && !hasAltPhone);

  useEffect(() => {
    if (stage !== "altOtp") return;
    if (hasAltEmail) {
      setAltOtpDelivery("altEmail");
      return;
    }
    if (hasAltPhone) {
      setAltOtpDelivery("altPhone");
    }
  }, [stage, hasAltEmail, hasAltPhone]);

  // ── Advance to next fallback stage ────────────────────────────────────────
  const advanceStage = useCallback((failed?: SigninStage) => {
    setRemainingStages((prev) => {
      const next = failed ? prev.filter((s) => s !== failed) : prev;
      const nextStage = next[0];
      if (nextStage) {
        setStage(nextStage);
        setRemainingStages(next.slice(1));
      } else {
        toast.error("All authentication methods exhausted. Please contact support.");
      }
      return next.slice(1);
    });
  }, []);

  // ── Password validation ────────────────────────────────────────────────────
  const validatePassword = async () => {
    if (!identifier.trim() || password.length < 8) return;
    setPwdStatus("checking");
    try {
      const csrf = await fetchCsrf();
      const res = await api.post(
        "/auth/validate-password",
        { identifier: identifier.trim(), password },
        { headers: { "X-CSRF-Token": csrf } },
      );
      if (res.data?.valid) {
        setPwdStatus("valid");
        setResolvedEmail(res.data.resolvedEmail ?? "");
        setMaskedEmail(res.data.maskedEmail ?? "");
        setMaskedPhone(res.data.maskedPhone ?? "");
        setMaskedAltEmail(res.data.maskedAltEmail ?? "");
        setMaskedAltPhone(res.data.maskedAltPhone ?? "");
        setGovtIdTypeHint(res.data.govtIdType ?? "");
        toast.success("Password is correct. Choose how to receive your OTP.");
      } else {
        setPwdStatus("invalid");
        toast.error("Incorrect password. Please try again.");
      }
    } catch (err) {
      setPwdStatus("invalid");
      toast.error(extractErrorMsg(err, "Password validation failed."));
    }
  };

  // ── Request primary OTP ────────────────────────────────────────────────────
  const requestPrimaryOtp = async () => {
    if (otpGenerations >= 5) {
      toast.error("You have used all 5 OTP attempts. Switching to alternate methods now.");
      setStage("altOtp");
      return;
    }
    setIsBusy(true);
    try {
      const csrf = await fetchCsrf();
      const res = await api.post(
        "/auth/request-otp",
        { identifier: resolvedEmail || identifier.trim(), method: otpDelivery, channel: "primary" },
        { headers: { "X-CSRF-Token": csrf } },
      );
      const next = otpGenerations + 1;
      setOtpGenerations(next);
      setOtpCode(res.data?.devOtp ?? "");
      setOtpVerified(false);
      setOtpExpiresAt(Date.now() + 30_000);
      setOtpExpired(false);
      setStage("primaryOtp");

      if (res.data?.devOtp) {
        toast.success(`[DEV] OTP auto-filled: ${res.data.devOtp}`);
      }

      if (next < 5) {
        toast.success(
          res.data?.message ?? `OTP sent! ${5 - next} generation${5 - next === 1 ? "" : "s"} left.`,
        );
      } else {
        toast.success(res.data?.message ?? "OTP sent — this is your last generation.");
      }
    } catch (err) {
      const message = extractErrorMsg(err, "Failed to send OTP.");
      toast.error(message);
      if (isOtpTemporarilyLimited(err)) {
        setOtpGenerations(5);
        setStage("primaryOtp");
        toast.error("Primary OTP is blocked for 5 hours. Use alternate method when available.");
      }
    } finally {
      setIsBusy(false);
    }
  };

  // ── Verify primary OTP ─────────────────────────────────────────────────────
  const verifyPrimaryOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      toast.error("Enter the full 6-digit OTP code.");
      return;
    }
    setIsBusy(true);
    try {
      const csrf = await fetchCsrf();
      await api.post(
        "/auth/verify-otp",
        { email: resolvedEmail || identifier.trim(), otpCode: otpCode.trim() },
        { headers: { "X-CSRF-Token": csrf } },
      );
      setOtpVerified(true);
      setOtpExpiresAt(null);
      toast.success("OTP verified! You can now sign in.");
    } catch (err) {
      toast.error(extractErrorMsg(err, "Incorrect OTP. Please try again."));
    } finally {
      setIsBusy(false);
    }
  };

  // ── Request alt OTP ────────────────────────────────────────────────────────
  const requestAltOtp = async () => {
    if (selectedAltUnavailable) {
      toast.error("Selected alternate contact is unavailable. Please choose another method.");
      return;
    }

    if (altOtpGenerations >= 3) {
      toast.error("You have used all 3 alternate OTP attempts. Moving to next method.");
      advanceStage("altOtp");
      return;
    }
    setIsBusy(true);
    try {
      const csrf = await fetchCsrf();
      const method = altOtpDelivery === "altEmail" ? "email" : "phone";
      const res = await api.post(
        "/auth/request-otp",
        { identifier: resolvedEmail || identifier.trim(), method, channel: "alternate" },
        { headers: { "X-CSRF-Token": csrf } },
      );
      const next = altOtpGenerations + 1;
      setAltOtpGenerations(next);
      setAllowAltNext(false);
      setAltOtpCode(res.data?.devOtp ?? "");
      setAltOtpVerified(false);
      setAltOtpExpiresAt(Date.now() + 30_000);
      setAltOtpExpired(false);
      if (res.data?.devOtp) {
        toast.success(`[DEV] OTP auto-filled: ${res.data.devOtp}`);
      }
      toast.success(res.data?.message ?? `Alt OTP sent! ${3 - next} attempt${3 - next === 1 ? "" : "s"} left.`);
    } catch (err) {
      const message = extractErrorMsg(err, "Failed to send alternate OTP.");
      toast.error(message);
      if (isOtpTemporarilyLimited(err)) {
        setAltOtpGenerations(3);
        setAllowAltNext(true);
        toast.error("Alternate OTP is blocked for 5 hours. You can now move to next method.");
      }
    } finally {
      setIsBusy(false);
    }
  };

  // ── Verify alt OTP ─────────────────────────────────────────────────────────
  const verifyAltOtp = async () => {
    if (!altOtpCode.trim() || altOtpCode.trim().length !== 6) {
      toast.error("Enter the full 6-digit OTP code.");
      return;
    }
    setIsBusy(true);
    try {
      const csrf = await fetchCsrf();
      await api.post(
        "/auth/verify-otp",
        { email: resolvedEmail || identifier.trim(), otpCode: altOtpCode.trim() },
        { headers: { "X-CSRF-Token": csrf } },
      );
      setAltOtpVerified(true);
      setAltOtpExpiresAt(null);
      toast.success("Alternate OTP verified! You can now sign in.");
    } catch (err) {
      toast.error(extractErrorMsg(err, "Incorrect OTP. Please try again."));
      setAllowAltNext(true);
      if (altOtpGenerations >= 3) {
        toast.error("All alternate OTP attempts used. Moving to Google Authenticator.");
        advanceStage("altOtp");
      }
    } finally {
      setIsBusy(false);
    }
  };

  // ── Fallback login helper (calls /auth/login with a specific credential) ───
  const attemptFallbackLogin = async (
    extra: Record<string, unknown>,
    failedStage: SigninStage,
    successMsg: string,
    failMsg: string,
    options?: { autoAdvanceOnFail?: boolean; onFail?: () => void },
  ) => {
    setIsBusy(true);
    try {
      const csrf = await fetchCsrf();
      const res = await api.post(
        "/auth/login",
        {
          identifier: resolvedEmail || identifier.trim(),
          password,
          captchaToken: "login-captcha-token",
          acceptTerms: true,
          ...extra,
        },
        { headers: { "X-CSRF-Token": csrf } },
      );
      if (res.data?.accessToken) {
        setPendingSession({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          expiresAt: res.data.expiresAt,
        });
        setPendingSignInLabel(successMsg);
        toast.success(successMsg);
      } else {
        toast.error(failMsg);
        options?.onFail?.();
        if (options?.autoAdvanceOnFail !== false) {
          advanceStage(failedStage);
        }
      }
    } catch (err) {
      toast.error(extractErrorMsg(err, failMsg));
      options?.onFail?.();
      if (options?.autoAdvanceOnFail !== false) {
        advanceStage(failedStage);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const completePendingSignIn = () => {
    if (!pendingSession?.accessToken) {
      toast.error("No verified session found. Please verify a method first.");
      return;
    }
    saveSession(pendingSession);
    setStage("done");
    toast.success("Signed in successfully.");
    router.push(redirectTo);
  };

  const loadTotpQr = async () => {
    if (!password || !(resolvedEmail || identifier.trim())) {
      toast.error("Validate your credentials first.");
      return;
    }
    setIsLoadingTotpQr(true);
    try {
      const csrf = await fetchCsrf();
      const res = await api.post(
        "/auth/setup-2fa",
        { email: resolvedEmail || identifier.trim(), password },
        { headers: { "X-CSRF-Token": csrf } },
      );
      if (res.data?.qrCodeDataUrl) {
        setTotpQrCode(res.data.qrCodeDataUrl);
        toast.success("QR code generated. Scan it in Google Authenticator.");
      } else {
        toast.error("Could not generate QR code.");
      }
    } catch (err) {
      toast.error(extractErrorMsg(err, "Failed to load QR code."));
    } finally {
      setIsLoadingTotpQr(false);
    }
  };

  const verifyTotpForSignin = async () => {
    const code = totpCode.trim();
    if (code.length !== 6) {
      toast.error("Enter the 6-digit authenticator code.");
      return;
    }

    setIsBusy(true);
    try {
      const csrf = await fetchCsrf();
      const res = await api.post(
        "/auth/setup-2fa",
        {
          email: (resolvedEmail || identifier.trim()).trim().toLowerCase(),
          password,
          totpCode: code,
        },
        { headers: { "X-CSRF-Token": csrf } },
      );

      if (!res.data?.signinTotpToken) {
        throw new Error("Authenticator verification token was not returned.");
      }

      setRotatedRecoveryCode("");
      setSigninTotpToken(res.data.signinTotpToken as string);
      setTotpVerified(true);
      setAllowTotpNext(false);
      toast.success("Authenticator verified successfully.");
    } catch (err) {
      setSigninTotpToken("");
      setTotpVerified(false);
      toast.error(extractErrorMsg(err, "Authenticator code incorrect. Moving to Recovery Code."));
      advanceStage("totp");
    } finally {
      setIsBusy(false);
    }
  };

  const signInWithVerifiedTotp = async () => {
    if (!totpVerified) {
      toast.error("Verify your authenticator code first.");
      return;
    }

    if (!signinTotpToken) {
      toast.error("Authenticator verification expired. Verify the code again.");
      return;
    }

    setIsSigningIn(true);
    try {
      const csrf = await fetchCsrf();
      const res = await api.post(
        "/auth/login",
        {
          identifier: resolvedEmail || identifier.trim(),
          password,
          signinTotpToken,
          captchaToken: "login-captcha-token",
          acceptTerms: true,
        },
        { headers: { "X-CSRF-Token": csrf } },
      );

      if (res.data?.accessToken) {
        setRotatedRecoveryCode("");
        saveSession(res.data);
        toast.success("Welcome back! Signed in successfully.");
        router.push(redirectTo);
      } else {
        toast.error("Sign-in failed. Please try again.");
      }
    } catch (err) {
      toast.error(extractErrorMsg(err, "Sign-in failed. Please try again."));
    } finally {
      setIsSigningIn(false);
    }
  };

  // ── Final sign-in (after OTP verified) ────────────────────────────────────
  const completeSignIn = async () => {
    setIsSigningIn(true);
    try {
      const csrf = await fetchCsrf();
      const res = await api.post(
        "/auth/login",
        {
          identifier: resolvedEmail || identifier.trim(),
          password,
          otpCode: otpVerified ? otpCode : altOtpVerified ? altOtpCode : undefined,
          captchaToken: "login-captcha-token",
          acceptTerms: true,
        },
        { headers: { "X-CSRF-Token": csrf } },
      );
      if (res.data?.accessToken) {
        saveSession(res.data);
        toast.success("Welcome back! Signed in successfully.");
        router.push(redirectTo);
      } else {
        toast.error("Sign-in failed. Please try a different method.");
      }
    } catch (err) {
      toast.error(extractErrorMsg(err, "Sign-in failed. Please try again."));
    } finally {
      setIsSigningIn(false);
    }
  };

  // ── Request approver ───────────────────────────────────────────────────────
  const requestApprover = async () => {
    setIsBusy(true);
    try {
      const csrf = await fetchCsrf();
      const res = await api.post(
        "/auth/request-approver",
        { identifier: resolvedEmail || identifier.trim() },
        { headers: { "X-CSRF-Token": csrf } },
      );
      setApproverRequestSent(true);
      setApproverSentTo(res.data?.sentTo ?? "approver");
      setApproverDisplay({
        name: res.data?.approverName,
        email: res.data?.approverEmail,
        phone: res.data?.approverPhone,
      });
      toast.success(`Approval request sent to ${res.data?.sentTo ?? "your approver"}.`);
      const devCode = res.data?.devOtp ?? res.data?.devCode;
      if (devCode) {
        setApproverCode(devCode);
        toast.success(`[DEV] Approval code auto-filled: ${devCode}`);
      }
    } catch (err) {
      toast.error(extractErrorMsg(err, "Failed to send approval request."));
    } finally {
      setIsBusy(false);
    }
  };

  const verifyApproverCode = async () => {
    if (!approverCode.trim()) {
      toast.error("Enter the approval code sent to your approver.");
      return;
    }
    setIsBusy(true);
    try {
      const csrf = await fetchCsrf();
      const res = await api.post(
        "/auth/login",
        {
          identifier: resolvedEmail || identifier.trim(),
          password,
          recoveryCode: approverCode.trim(),
          captchaToken: "login-captcha-token",
          acceptTerms: true,
        },
        { headers: { "X-CSRF-Token": csrf } },
      );
      if (res.data?.accessToken) {
        saveSession(res.data);
        toast.success("Approval verified. Welcome back!");
        router.push(redirectTo);
      } else {
        toast.error("Incorrect approval code. Your account has been temporarily blocked.");
        // 5 hour block notice  
        toast.error("Account locked for 5 hours. Please try again later.");
      }
    } catch (err) {
      const msg = extractErrorMsg(err, "Approval code verification failed.");
      toast.error(msg);
      toast.error("Account locked for 5 hours due to wrong approval code. Please try again later.");
    } finally {
      setIsBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Stage 1: Credentials ───────────────────────────────────────────── */}
      {(stage === "credentials" || stage === "primaryOtp") && (
        <>
          {/* Identifier */}
          <label className="block space-y-2 text-sm font-medium text-[#415174]">
            Email, Username, or Phone
            <div className={`mt-2 ${inputGroup}`}>
              <div className="flex items-center justify-center border-r border-[#d1d9e6] text-[#5c6d94]">
                <User className="h-5 w-5" />
              </div>
              <input
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setPwdStatus("idle"); }}
                placeholder="admin@example.com · PRGEX123456 · +919876543210"
                className={inputField}
                autoComplete="username"
              />
            </div>
          </label>

          {/* Password */}
          <label className="block space-y-2 text-sm font-medium text-[#415174]">
            Password
            <div className={`mt-2 ${inputGroup} ${pwdStatus === "valid" ? "ring-2 ring-emerald-400/40" : pwdStatus === "invalid" ? "ring-2 ring-rose-400/40" : ""}`}>
              <div className="flex items-center justify-center border-r border-[#d1d9e6] text-[#5c6d94]">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwdStatus("idle"); }}
                onBlur={validatePassword}
                placeholder="Enter your password"
                className={inputField}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="flex items-center justify-center px-4 text-[#5c6d94]"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Password status indicator */}
            {pwdStatus !== "idle" && (
              <div className={`flex items-center gap-2 text-xs mt-1 ${pwdStatus === "valid" ? "text-emerald-600" : pwdStatus === "invalid" ? "text-rose-500" : "text-[#8e97b2]"}`}>
                {pwdStatus === "checking" && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {pwdStatus === "valid" && <CheckCircle2 className="h-3.5 w-3.5" />}
                {pwdStatus === "invalid" && <XCircle className="h-3.5 w-3.5" />}
                <span>
                  {pwdStatus === "checking" ? "Checking password…" :
                   pwdStatus === "valid" ? "Password is correct." :
                   "Password does not match. Please try again."}
                </span>
              </div>
            )}
          </label>

          {/* OTP Delivery — shown only when password is valid */}
          {pwdStatus === "valid" && (
            <div className={card}>
              <p className="mb-3 text-sm font-semibold text-[#415174] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Choose OTP delivery
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Email box */}
                <button
                  type="button"
                  onClick={() => setOtpDelivery("email")}
                  className={methodCard(otpDelivery === "email")}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email OTP</span>
                  </div>
                  <p className="text-[#5c6d94] font-normal text-xs mt-0.5 break-all">{maskedEmail || "Email on file"}</p>
                </button>

                {/* Phone box */}
                <button
                  type="button"
                  onClick={() => setOtpDelivery("phone")}
                  className={methodCard(otpDelivery === "phone")}
                  disabled={!maskedPhone}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">SMS OTP</span>
                  </div>
                  <p className="text-[#5c6d94] font-normal text-xs mt-0.5">{maskedPhone || "No phone on file"}</p>
                </button>
              </div>

              <NeumorphicButton
                type="button"
                className="mt-4 w-full"
                onClick={requestPrimaryOtp}
                disabled={isBusy || otpGenerations >= 5}
                iconLeft={<Send className="h-4 w-4" />}
              >
                {isBusy ? "Sending…" : otpGenerations === 0 ? "Send OTP" : `Resend OTP (${5 - otpGenerations} left)`}
              </NeumorphicButton>
            </div>
          )}
        </>
      )}

      {/* ── Stage 2: Enter Primary OTP ─────────────────────────────────────── */}
      {stage === "primaryOtp" && !otpVerified && (
        <div className={card}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#415174] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Enter OTP
            </p>
            {otpExpiresAt && !otpExpired && (
              <OtpTimer expiresAt={otpExpiresAt} onExpire={() => setOtpExpired(true)} />
            )}
            {otpExpired && (
              <span className="text-xs font-semibold text-rose-500">OTP expired — resend above</span>
            )}
          </div>
          <div className={insetCard}>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              className={otpInputCls}
              autoComplete="one-time-code"
            />
          </div>
          <NeumorphicButton
            type="button"
            className="mt-4 w-full"
            onClick={verifyPrimaryOtp}
            disabled={isBusy || otpCode.length !== 6 || otpExpired}
            iconLeft={<CheckCircle2 className="h-4 w-4" />}
          >
            {isBusy ? "Verifying…" : "Verify OTP"}
          </NeumorphicButton>
        </div>
      )}

      {/* ── OTP Verified — Sign In button ──────────────────────────────────── */}
      {(otpVerified || altOtpVerified) && stage !== "done" && (
        <div className={`${card} flex flex-col items-center gap-3 text-center`}>
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-700">OTP Verified Successfully!</p>
          <NeumorphicButton
            type="button"
            className="mt-2 w-full"
            onClick={completeSignIn}
            disabled={isSigningIn}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            {isSigningIn ? "Signing In…" : "Sign In"}
          </NeumorphicButton>
        </div>
      )}

      {pendingSession?.accessToken && stage !== "done" && (
        <div className={`${card} flex flex-col items-center gap-3 text-center`}>
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-700">{pendingSignInLabel || "Verification successful."}</p>
          {rotatedRecoveryCode && (
            <div className="w-full rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-xs text-emerald-800">
              <p className="font-semibold">Store this new recovery code safely:</p>
              <p className="mt-1 break-all font-mono">{rotatedRecoveryCode}</p>
            </div>
          )}
          <NeumorphicButton
            type="button"
            className="mt-2 w-full"
            onClick={completePendingSignIn}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </NeumorphicButton>
        </div>
      )}

      {/* ── After 5 OTP generations — prompt switch ────────────────────────── */}
      {stage === "primaryOtp" && otpGenerations >= 5 && !otpVerified && (
        <div className={`${card} text-center`}>
          <AlertTriangle className="h-7 w-7 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#415174]">All 5 OTP attempts used</p>
          <p className="text-xs text-[#5c6d94] mt-1 mb-3">
            Don't worry — you haven't lost anything! Switch to your alternate contact to continue.
          </p>
          <NeumorphicButton
            type="button"
            className="w-full"
            onClick={() => { setStage("altOtp"); setRemainingStages(FALLBACK_ORDER.slice(1)); }}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            Use Alternate Contact
          </NeumorphicButton>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Fallback: Alternate Contact OTP ─────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {stage === "altOtp" && (
        <div className={card}>
          <StageBadge icon={Mail} label="Alternate Contact OTP" sub="Send OTP to your alternate email or phone (3 attempts)." />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setAltOtpDelivery("altEmail")} className={methodCard(altOtpDelivery === "altEmail")} disabled={!maskedAltEmail}>
              <div className="flex items-center gap-2 mb-1"><Mail className="h-4 w-4" /><span className="font-medium">Alt Email</span></div>
              <p className="text-xs text-[#5c6d94]">{maskedAltEmail || "No alt email on file"}</p>
            </button>
            <button type="button" onClick={() => setAltOtpDelivery("altPhone")} className={methodCard(altOtpDelivery === "altPhone")} disabled={!maskedAltPhone}>
              <div className="flex items-center gap-2 mb-1"><Phone className="h-4 w-4" /><span className="font-medium">Alt Phone</span></div>
              <p className="text-xs text-[#5c6d94]">{maskedAltPhone || "No alt phone on file"}</p>
            </button>
          </div>

          <NeumorphicButton
            type="button"
            className="mt-4 w-full"
            onClick={requestAltOtp}
            disabled={isBusy || altOtpGenerations >= 3 || selectedAltUnavailable}
            iconLeft={<Send className="h-4 w-4" />}
          >
            {isBusy ? "Sending…" : altOtpGenerations === 0 ? "Send Alternate OTP" : `Resend (${3 - altOtpGenerations} left)`}
          </NeumorphicButton>

          {altOtpGenerations > 0 && !altOtpVerified && (
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#415174]">Enter Alternate OTP</span>
                {altOtpExpiresAt && !altOtpExpired && (
                  <OtpTimer expiresAt={altOtpExpiresAt} onExpire={() => setAltOtpExpired(true)} />
                )}
                {altOtpExpired && <span className="text-xs text-rose-500">Expired — resend above</span>}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={altOtpCode}
                onChange={(e) => setAltOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code"
                className={otpInputCls}
              />
              <NeumorphicButton
                type="button"
                className="mt-3 w-full"
                onClick={verifyAltOtp}
                disabled={isBusy || altOtpCode.length !== 6 || altOtpExpired}
                iconLeft={<CheckCircle2 className="h-4 w-4" />}
              >
                Verify Alternate OTP
              </NeumorphicButton>
            </div>
          )}

          {(allowAltNext || altOtpGenerations >= 3) && (
            <SkipToNext label="Move to Google Authenticator" onSkip={() => advanceStage("altOtp")} />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Fallback: Google Authenticator TOTP ─────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {stage === "totp" && (
        <div className={card}>
          <StageBadge icon={ShieldCheck} label="Google Authenticator" sub="Scan QR code in Google Authenticator, then enter 6-digit code." />
          {!totpQrCode && (
            <NeumorphicButton
              type="button"
              className="mt-4 w-full"
              onClick={loadTotpQr}
              disabled={isLoadingTotpQr}
              iconLeft={<QrCode className="h-4 w-4" />}
            >
              {isLoadingTotpQr ? "Generating QR..." : "Generate QR Code"}
            </NeumorphicButton>
          )}
          {totpQrCode && (
            <div className="mt-4 rounded-[18px] border border-[#d1d9e6] bg-[#e6e8ee] p-4 text-center shadow-[inset_2px_2px_5px_#b8b9be,inset_-3px_-3px_7px_#ffffff]">
              <img src={totpQrCode} alt="TOTP QR" className="mx-auto h-44 w-44 rounded-lg border border-[#d1d9e6] bg-white p-2" />
              <p className="mt-2 text-xs text-[#5c6d94]">Scan this code in Google Authenticator.</p>
            </div>
          )}
          <div className="mt-4">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                setTotpCode(e.target.value.replace(/\D/g, ""));
                setTotpVerified(false);
                setSigninTotpToken("");
              }}
              placeholder="Enter 6-digit code"
              className={`${otpInputCls} mt-2`}
            />
          </div>
          <NeumorphicButton
            type="button"
            className="mt-4 w-full"
            onClick={verifyTotpForSignin}
            disabled={isBusy || totpCode.length !== 6}
            iconLeft={<ShieldCheck className="h-4 w-4" />}
          >
            {isBusy ? "Verifying…" : "Verify Authenticator Code"}
          </NeumorphicButton>
          {totpVerified && (
            <NeumorphicButton
              type="button"
              className="mt-3 w-full"
              onClick={signInWithVerifiedTotp}
              disabled={isSigningIn}
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              {isSigningIn ? "Signing In…" : "Sign In"}
            </NeumorphicButton>
          )}
          {allowTotpNext && (
            <SkipToNext label="Move to Recovery Code" onSkip={() => advanceStage("totp")} />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Fallback: Security Codes (9 codes from signup) ──────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {stage === "securityCodes" && (
        <div className={card}>
          <StageBadge
            icon={Key}
            label="Security Codes"
            sub={`You saved 9 security codes at signup. Enter any one. (${9 - secCodeAttempts} of 9 tries remaining)`}
          />
          <div className="mt-4">
            <input
              type="text"
              value={secCode}
              onChange={(e) => setSecCode(e.target.value.toUpperCase())}
              placeholder="Enter one of your 9 security codes"
              className={`${otpInputCls} text-base tracking-normal`}
            />
          </div>
          <NeumorphicButton
            type="button"
            className="mt-4 w-full"
            onClick={async () => {
              const next = secCodeAttempts + 1;
              setSecCodeAttempts(next);
              setIsBusy(true);
              try {
                const csrf = await fetchCsrf();
                const res = await api.post(
                  "/auth/login",
                  {
                    identifier: resolvedEmail || identifier.trim(),
                    password,
                    backupCode: secCode.trim(),
                    captchaToken: "login-captcha-token",
                    acceptTerms: true,
                  },
                  { headers: { "X-CSRF-Token": csrf } },
                );

                if (res.data?.accessToken) {
                  setRotatedRecoveryCode("");
                  setPendingSession({
                    accessToken: res.data.accessToken,
                    refreshToken: res.data.refreshToken,
                    expiresAt: res.data.expiresAt,
                  });
                  setPendingSignInLabel("Security code matched. Click Sign In.");
                  toast.success("Security code matched. Click Sign In.");
                } else {
                  throw new Error("Invalid security code");
                }
              } catch {
                toast.error("Security code incorrect. Moving to Security Questions.");
                advanceStage("securityCodes");
              } finally {
                setIsBusy(false);
              }
            }}
            disabled={isBusy || !secCode.trim()}
            iconLeft={<Key className="h-4 w-4" />}
          >
            {isBusy ? "Verifying…" : "Verify Security Code"}
          </NeumorphicButton>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Fallback: Recovery Code ──────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {stage === "recoveryCode" && (
        <div className={card}>
          <StageBadge icon={Key} label="Recovery Code" sub="Enter the master recovery code you received at signup." />
          <div className="mt-4">
            <input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="Enter your recovery code"
              className={`${otpInputCls} text-base tracking-normal`}
            />
          </div>
          <NeumorphicButton
            type="button"
            className="mt-4 w-full"
            onClick={async () => {
              setIsBusy(true);
              try {
                const csrf = await fetchCsrf();
                const res = await api.post(
                  "/auth/login",
                  {
                    identifier: resolvedEmail || identifier.trim(),
                    password,
                    recoveryCode: recoveryCode.trim(),
                    captchaToken: "login-captcha-token",
                    acceptTerms: true,
                  },
                  { headers: { "X-CSRF-Token": csrf } },
                );

                if (res.data?.accessToken) {
                  setPendingSession({
                    accessToken: res.data.accessToken,
                    refreshToken: res.data.refreshToken,
                    expiresAt: res.data.expiresAt,
                  });
                  setRotatedRecoveryCode((res.data?.rotatedRecoveryCode as string) || "");
                  setPendingSignInLabel("Recovery code verified. New recovery code generated. Click Sign In.");
                  toast.success("Recovery code verified.");
                } else {
                  throw new Error("Invalid recovery code");
                }
              } catch {
                toast.error("Recovery code incorrect. Moving to Security Codes.");
                advanceStage("recoveryCode");
              } finally {
                setIsBusy(false);
              }
            }}
            disabled={isBusy || !recoveryCode.trim()}
            iconLeft={<Key className="h-4 w-4" />}
          >
            {isBusy ? "Verifying…" : "Verify Recovery Code"}
          </NeumorphicButton>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Fallback: Security Questions ────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {stage === "securityQuestions" && (
        <div className={card}>
          <StageBadge
            icon={HelpCircle}
            label="Security Questions"
            sub="Answer the 3 security questions you set during signup. Hint: think about personal memories (pet, school, city…)."
          />
          <div className="mt-4 grid gap-3">
            {secAnswers.map((ans, i) => (
              <div key={i} className={insetCard}>
                <label className="block text-xs font-semibold text-[#415174] mb-2">Answer {i + 1}</label>
                <input
                  type="text"
                  value={ans}
                  onChange={(e) => {
                    const next = [...secAnswers];
                    next[i] = e.target.value;
                    setSecAnswers(next);
                  }}
                  placeholder={["Your first pet's name", "Your mother's maiden name", "City you were born in"][i] ?? "Your answer"}
                  className="w-full bg-transparent outline-none text-sm text-[#273457] placeholder:text-[#8e97b2]"
                />
              </div>
            ))}
          </div>
          <NeumorphicButton
            type="button"
            className="mt-4 w-full"
            onClick={async () => {
              const next = securityQuestionAttempts + 1;
              setSecurityQuestionAttempts(next);
              setIsBusy(true);
              try {
                const csrf = await fetchCsrf();
                const res = await api.post(
                  "/auth/login",
                  {
                    identifier: resolvedEmail || identifier.trim(),
                    password,
                    securityAnswers: secAnswers.map((a) => a.trim()),
                    captchaToken: "login-captcha-token",
                    acceptTerms: true,
                  },
                  { headers: { "X-CSRF-Token": csrf } },
                );

                if (res.data?.accessToken) {
                  setPendingSession({
                    accessToken: res.data.accessToken,
                    refreshToken: res.data.refreshToken,
                    expiresAt: res.data.expiresAt,
                  });
                  setPendingSignInLabel("Security answers matched. Click Sign In.");
                  toast.success("Security answers matched. Click Sign In.");
                } else {
                  throw new Error("Invalid answers");
                }
              } catch {
                if (next >= 2) {
                  toast.error("Security answers still incorrect. Moving to Government ID verification.");
                  advanceStage("securityQuestions");
                } else {
                  toast.error("Security answers incorrect. You have one more try.");
                }
              } finally {
                setIsBusy(false);
              }
            }}
            disabled={isBusy || secAnswers.some((a) => a.trim().length < 2)}
            iconLeft={<HelpCircle className="h-4 w-4" />}
          >
            {isBusy ? "Verifying…" : "Verify Answers"}
          </NeumorphicButton>
          {securityQuestionAttempts > 0 && (
            <SkipToNext label="Move to Government ID" onSkip={() => advanceStage("securityQuestions")} />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Fallback: Government ID ──────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {stage === "govtId" && (
        <div className={card}>
          <StageBadge
            icon={CreditCard}
            label="Government ID Verification"
            sub={`Enter the ${govtIdTypeHint ? `${govtIdTypeHint.toUpperCase()} number` : "government ID number"} you provided at signup.${govtIdTypeHint ? ` Hint: your ID type is ${govtIdTypeHint}.` : ""}`}
          />
          <div className="mt-4">
            <input
              type="text"
              value={govtIdInput}
              onChange={(e) => setGovtIdInput(e.target.value)}
              placeholder={`Enter your ${govtIdTypeHint || "government"} ID number`}
              className={`${otpInputCls} text-base tracking-normal`}
            />
          </div>
          <NeumorphicButton
            type="button"
            className="mt-4 w-full"
            onClick={async () => {
              setIsBusy(true);
              try {
                const csrf = await fetchCsrf();
                const res = await api.post(
                  "/auth/recover",
                  {
                    email: resolvedEmail || identifier.trim(),
                    method: "govtId",
                    govtIdType: govtIdTypeHint,
                    govtIdNumber: govtIdInput.trim(),
                  },
                  { headers: { "X-CSRF-Token": csrf } },
                );
                if (res.data?.accessToken) {
                  setPendingSession({
                    accessToken: res.data.accessToken,
                    refreshToken: res.data.refreshToken,
                    expiresAt: res.data.expiresAt,
                  });
                  setPendingSignInLabel("Government ID matched. Click Sign In.");
                  toast.success("Government ID matched. Click Sign In.");
                  setAllowGovtIdNext(false);
                } else {
                  toast.error("Government ID did not match.");
                  setAllowGovtIdNext(true);
                }
              } catch (err) {
                toast.error(extractErrorMsg(err, "Government ID did not match."));
                setAllowGovtIdNext(true);
              } finally {
                setIsBusy(false);
              }
            }}
            disabled={isBusy || !govtIdInput.trim()}
            iconLeft={<CreditCard className="h-4 w-4" />}
          >
            {isBusy ? "Verifying…" : "Verify Government ID"}
          </NeumorphicButton>
          {allowGovtIdNext && (
            <SkipToNext label="Move to Secondary Approver" onSkip={() => advanceStage("govtId")} />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── Fallback: Secondary Approver (LAST RESORT) ──────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {stage === "approver" && (
        <div className={card}>
          <div className="mb-4 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="text-base font-bold text-amber-800">This is the last verification method available.</p>
            <p className="text-xs text-amber-700 mt-0.5">
              All other methods have been exhausted. You can request approval from your registered secondary approver.
            </p>
          </div>

          <StageBadge
            icon={Users}
            label="Secondary Approver Approval"
            sub="Your secondary approver will receive an approval code by email. Share that code with them and enter it below."
          />

          {!approverRequestSent ? (
            <NeumorphicButton
              type="button"
              className="mt-4 w-full"
              onClick={requestApprover}
              disabled={isBusy}
              iconLeft={<Send className="h-4 w-4" />}
            >
              {isBusy ? "Sending…" : "Send Approval Request to Approver"}
            </NeumorphicButton>
          ) : (
            <div className="mt-4 space-y-3">
              <div className={`${insetCard} text-sm text-[#415174]`}>
                <p className="font-semibold">Approval request sent to <span className="text-[#273457]">{approverSentTo}</span></p>
                {approverDisplay?.name && (
                  <p className="mt-1 text-xs text-[#5c6d94]">Approver: {approverDisplay.name}</p>
                )}
                {approverDisplay?.email && (
                  <p className="text-xs text-[#5c6d94]">Email: {approverDisplay.email}</p>
                )}
                {approverDisplay?.phone && (
                  <p className="text-xs text-[#5c6d94]">Phone: {approverDisplay.phone}</p>
                )}
                <p className="mt-1 text-xs text-[#5c6d94]">
                  Ask your approver to check their email and share the one-time approval code with you.
                </p>
              </div>
              <input
                type="text"
                value={approverCode}
                onChange={(e) => setApproverCode(e.target.value.toUpperCase())}
                placeholder="Enter approval code from approver"
                className={`${otpInputCls} text-base tracking-normal`}
              />
              <NeumorphicButton
                type="button"
                className="w-full"
                onClick={verifyApproverCode}
                disabled={isBusy || !approverCode.trim()}
                iconLeft={<CheckCircle2 className="h-4 w-4" />}
              >
                {isBusy ? "Verifying…" : "Verify Approval Code"}
              </NeumorphicButton>
            </div>
          )}
        </div>
      )}

      {/* ── Forgot password + sign up links ───────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/reset-password"
          className="btn btn-soft btn-sm animate-up-1 w-full text-[#2d4cc8]"
        >
          Lost password?
        </Link>
        <Link
          href="/signup"
          className="btn btn-soft btn-sm animate-up-1 w-full text-[#2d4cc8]"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StageBadge({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d1d9e6] bg-[#e6e8ee] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff]">
        <Icon className="h-5 w-5 text-[#44476a]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#273457]">{label}</p>
        {sub && <p className="text-xs text-[#5c6d94] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SkipToNext({ label, onSkip }: { label: string; onSkip: () => void }) {
  return (
    <NeumorphicButton
      type="button"
      onClick={onSkip}
      variant="soft"
      size="sm"
      block
      className="mt-4 text-[#2d4cc8]"
      iconRight={<ArrowRight className="h-4 w-4" />}
    >
      {label}
    </NeumorphicButton>
  );
}
