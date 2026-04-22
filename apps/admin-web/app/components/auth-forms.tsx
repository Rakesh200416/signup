"use client";

import Link from "next/link";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import api from "../lib/api";
import {
  Mail, Lock, Phone, User, ShieldCheck, Send, LogIn,
  ListFilter, QrCode, Smartphone, HelpCircle, Globe,
  ArrowLeft, ArrowRight, KeyRound, FileText, Clock,
  CheckCircle2, Upload, Camera, Eye, EyeOff, RefreshCw,
  AlertCircle, Copy, ClipboardCheck,
} from "lucide-react";
import { NeumorphicButton } from "./NeumorphicButton";
import { NeumorphicCard } from "./NeumorphicCard";
import { StepProgress } from "./StepProgress";
import { ThemeToggle } from "./ThemeToggle";
import { DatePicker } from "./DatePicker";
import { DropdownSelect } from "./DropdownSelect";
import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getToastMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string") return error;
  if (typeof error === "number" || typeof error === "boolean") return String(error);
  if (!error || typeof error !== "object") return fallback;
  const err = error as any;
  const message =
    err?.response?.data?.message ??
    err?.message ??
    err?.response?.data ??
    err?.response ??
    err;
  if (typeof message === "string") return message;
  try {
    return JSON.stringify(message);
  } catch {
    return fallback;
  }
};

const generateUserId = (fullName: string): string => {
  const firstLetter = fullName.trim()[0]?.toUpperCase() ?? "X";
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `PRGE${firstLetter}${digits}`;
};

const generateRecoveryCode = (): string => {
  const prefix = "PRGEEQ";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 25 - prefix.length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return prefix + suffix;
};

// kept for backward compat but not used for main recovery code
const generateRecoveryCodes = (count: number): string[] =>
  Array.from({ length: count }, () =>
    Math.random().toString(36).slice(2, 10).toUpperCase()
  );

const generateSecurityCodes = (count: number): string[] =>
  Array.from({ length: count }, () =>
    Math.random().toString(36).slice(2, 8).toUpperCase()
  );

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "Australia" },
  { code: "+971", country: "UAE" },
];

const COUNTRY_CODE_OPTIONS = COUNTRY_CODES.map((item) => ({
  value: item.code,
  label: `${item.code} ${item.country}`,
}));

const govtIdOptions = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "passport", label: "Passport" },
  { value: "driving_license", label: "Driving License" },
  { value: "voter_id", label: "Voter ID" },
];

const govtIdMinLength: Record<string, number> = {
  aadhaar: 12,
  pan: 10,
  voter_id: 10,
  passport: 8,
  driving_license: 10,
};

const govtIdPlaceholders: Record<string, string> = {
  aadhaar: "e.g. 1234 5678 9012",
  pan: "e.g. ABCDE1234F",
  passport: "e.g. K1234567",
  driving_license: "e.g. DL-0420110149646",
  voter_id: "e.g. ABC1234567",
};

const SECURITY_QUESTION_OPTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your elementary school?",
  "What is your oldest sibling's middle name?",
  "What was the make of your first car?",
  "What is your favorite movie?",
  "What street did you grow up on?",
];

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const identitySchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required.")
    .regex(
      /^[A-Za-z]+([ ][A-Za-z]+){1,4}$/,
      "Enter your full name as per legal document (2–5 words, letters only)."
    ),
  dob: z.string().min(1, "Date of birth is required."),
  govtIdType: z.string().min(1, "Please select a government ID type."),
});

const contactSchema = z.object({
  officialEmail: z.string().email("Enter a valid official email."),
  personalEmail: z.string().email("Enter a valid personal email."),
  primaryPhone: z.string().min(7, "Enter a valid phone number."),
  secondaryPhone: z.string().optional(),
});

const securitySchema = z
  .object({
    password: z
      .string()
      .min(12, "Password must be at least 12 characters.")
      .regex(/[A-Z]/, "Must contain an uppercase letter.")
      .regex(/[a-z]/, "Must contain a lowercase letter.")
      .regex(/\d/, "Must contain a digit.")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character."),
    confirmPassword: z.string(),
    question1: z.string().min(1, "Select a question."),
    answer1: z.string().min(1, "Provide an answer."),
    question2: z.string().min(1, "Select a question."),
    answer2: z.string().min(1, "Provide an answer."),
    question3: z.string().min(1, "Select a question."),
    answer3: z.string().min(1, "Provide an answer."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const recoverySchema = z.object({
  alternateEmail: z.string().email("Enter a valid alternate email."),
  alternatePhone: z.string().min(7, "Enter a valid alternate phone."),
  ipWhitelist: z.string().optional(),
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#d1d5db] py-2 last:border-0">
      <span className="text-sm text-[#64748b]">{title}</span>
      <span className="text-sm font-medium text-[#111827] dark:text-[#f8fafc] text-right">
        {value}
      </span>
    </div>
  );
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const rules = [
    { label: "At least 12 characters", isValid: password.length >= 12 },
    { label: "At least 1 uppercase letter", isValid: /[A-Z]/.test(password) },
    { label: "At least 1 lowercase letter", isValid: /[a-z]/.test(password) },
    { label: "At least 1 numeric digit", isValid: /\d/.test(password) },
    { label: "At least 1 special character", isValid: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <div className="grid gap-2">
      {rules.map((rule, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
            rule.isValid
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          <span>{rule.isValid ? "✔" : "✗"}</span>
          <span>{rule.label}</span>
        </div>
      ))}
    </div>
  );
}

interface OtpVerifyFieldProps {
  label: string;
  contactValue: string;
  type: "email" | "phone";
  onVerified: () => void;
  sendOtp: (value: string) => Promise<{ devOtp?: string } | void>;
  verifyOtp: (value: string, code: string) => Promise<boolean>;
  disabled?: boolean;
}

function OtpVerifyField({
  label,
  contactValue,
  type,
  onVerified,
  sendOtp,
  verifyOtp,
  disabled,
}: OtpVerifyFieldProps) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    setCountdown(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const inputCls =
    "w-full rounded-[18px] border border-[#d1d9e6] bg-[#e6e8ee] px-4 py-3 text-sm text-[#44476a] shadow-[inset_2px_2px_5px_#b8b9be,inset_-3px_-3px_7px_#ffffff] transition focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]/40";

  const handleSend = async () => {
    try {
      const result = await sendOtp(contactValue);
      setSent(true);
      setError("");
      startCountdown();
      if (result && result.devOtp) {
        setCode(result.devOtp);
        toast.success(`[DEV] OTP auto-filled: ${result.devOtp}`);
      } else {
        toast.success(`OTP sent to ${label}.`);
      }
    } catch (error) {
      setError(getToastMessage(error, "Failed to send OTP. Try again."));
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError("");
    try {
      const ok = await verifyOtp(contactValue, code);
      if (ok) {
        setVerified(true);
        onVerified();
        toast.success(`${label} verified ✓`);
      } else {
        const msg = "Invalid OTP. Please try again.";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = getToastMessage(err, "Invalid OTP. Please try again.");
      setError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const timerColor =
    countdown > 15 ? "text-green-600" : countdown > 7 ? "text-orange-500" : "text-red-500";

  if (verified || disabled) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        {label} verified ✓
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!sent ? (
        <NeumorphicButton type="button" size="sm" pill onClick={handleSend} iconLeft={<Send className="h-3.5 w-3.5" />}>
          Send OTP to {label}
        </NeumorphicButton>
      ) : (
        <div className="grid gap-2">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit OTP"
            className={inputCls}
          />
          <div className="flex items-center gap-2">
            <NeumorphicButton
              type="button"
              size="sm"
              pill
              onClick={handleVerify}
              disabled={verifying || code.length < 4}
              iconLeft={<ShieldCheck className="h-3.5 w-3.5" />}
            >
              {verifying ? "Verifying…" : `Verify ${label}`}
            </NeumorphicButton>
            {countdown > 0 ? (
              <span className={`text-xs font-semibold tabular-nums ${timerColor}`}>
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                className="text-xs text-blue-500 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PolicyModalProps {
  title: string;
  body: string;
  onFullyRead: () => void;
  onClose: () => void;
}

function PolicyModal({ title, body, onFullyRead, onClose }: PolicyModalProps) {
  const [fullyRead, setFullyRead] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If content is short enough that no scrolling is needed, mark as read immediately
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight) {
      setFullyRead(true);
      onFullyRead();
    }
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setFullyRead(true);
      onFullyRead();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#f0f4fb] shadow-xl p-6 grid gap-4">
        <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-64 overflow-y-auto rounded-2xl bg-white p-4 text-sm text-[#334155] leading-relaxed shadow-inner"
        >
          {body}
        </div>
        {!fullyRead && (
          <p className="text-xs text-amber-600">↓ Scroll to the bottom to confirm you have read this document.</p>
        )}
        <div className="flex justify-end gap-3">
          <NeumorphicButton type="button" size="sm" onClick={onClose}>
            Close
          </NeumorphicButton>
        </div>
      </div>
    </div>
  );
}

interface SelfieCaptureProps {
  onCapture: (dataUrl: string) => void;
}

function SelfieCapture({ onCapture }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  // Attach stream to video element once it is rendered
  useEffect(() => {
    if (streaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [streaming]);

  const startCamera = async () => {
    setError("");
    setCaptured(null);
    setConfirmed(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setStreaming(true);
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? "Camera permission denied. Please allow camera access in your browser settings."
        : err?.name === "NotFoundError"
        ? "No camera found on this device."
        : "Could not open camera: " + (err?.message ?? "unknown error");
      setError(msg);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCaptured(dataUrl);
    stopCamera();
  };

  const confirmPhoto = () => {
    if (captured) {
      onCapture(captured);
      setConfirmed(true);
    }
  };

  const retake = () => {
    setCaptured(null);
    setConfirmed(false);
    startCamera();
  };

  return (
    <div className="grid gap-3">
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
        </p>
      )}

      {/* ── Confirmed photo ── */}
      {confirmed && captured && (
        <div className="grid gap-2">
          <img
            src={captured}
            alt="Selfie"
            className="w-full max-w-xs rounded-2xl border-2 border-green-400 shadow"
          />
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Photo saved successfully.
          </p>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline w-fit"
            onClick={retake}
          >
            Retake photo
          </button>
        </div>
      )}

      {/* ── Review step: show captured photo, ask OK or Retake ── */}
      {!confirmed && captured && (
        <div className="grid gap-3">
          <p className="text-sm font-medium text-[#111827]">Does this look good?</p>
          <img
            src={captured}
            alt="Preview"
            className="w-full max-w-xs rounded-2xl border shadow"
          />
          <div className="flex gap-3">
            <NeumorphicButton
              type="button"
              size="sm"
              pill
              onClick={confirmPhoto}
              iconLeft={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Looks good — Use this photo
            </NeumorphicButton>
            <NeumorphicButton
              type="button"
              size="sm"
              pill
              onClick={retake}
              iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Retake
            </NeumorphicButton>
          </div>
        </div>
      )}

      {/* ── Live camera stream ── */}
      {!confirmed && !captured && streaming && (
        <div className="grid gap-2">
          <video
            ref={videoRef}
            className="w-full max-w-xs rounded-2xl border bg-black"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-3">
            <NeumorphicButton
              type="button"
              size="sm"
              pill
              onClick={capture}
              iconLeft={<Camera className="h-3.5 w-3.5" />}
            >
              Capture Photo
            </NeumorphicButton>
            <button
              type="button"
              className="text-xs text-gray-500 hover:underline"
              onClick={stopCamera}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Open camera button ── */}
      {!confirmed && !captured && !streaming && (
        <NeumorphicButton
          type="button"
          size="sm"
          pill
          onClick={startCamera}
          iconLeft={<Camera className="h-3.5 w-3.5" />}
        >
          Open Camera
        </NeumorphicButton>
      )}
    </div>
  );
}

// ─── SignupWizard ─────────────────────────────────────────────────────────────

export function SignupWizard() {
  const router = useRouter();

  const steps = [
    "Basic Info",
    "Primary Contact",
    "User ID",
    "Alternate Contact",
    "Password",
    "2FA Setup",
    "Recovery Codes",
    "Security Codes",
    "Govt ID",
    "Selfie",
    "Security Q's",
    "Approver",
    "Policies",
    "Register",
  ];

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  // ── Step 0: Basic Info ──────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [dob, setDob] = useState("");

  const validateFullName = (name: string) => {
    if (!name.trim()) return "Full name is required.";
    if (!/^[A-Za-z]+([ ][A-Za-z]+){1,4}$/.test(name.trim()))
      return "Enter your full name as per legal document (2–5 words, letters only).";
    return "";
  };

  // ── Step 1: Primary Contact ─────────────────────────────────────────────────
  const [officialEmail, setOfficialEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [primaryCountryCode, setPrimaryCountryCode] = useState("+91");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // ── Step 2: User ID ─────────────────────────────────────────────────────────
  const [userId, setUserId] = useState("");

  // ── Step 3: Alternate Contact ───────────────────────────────────────────────
  const [altEmail, setAltEmail] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [altCountryCode, setAltCountryCode] = useState("+91");
  const [altEmailVerified, setAltEmailVerified] = useState(false);
  const [altPhoneVerified, setAltPhoneVerified] = useState(false);

  // ── Step 4: Password ────────────────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Step 5: 2FA ─────────────────────────────────────────────────────────────
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [qrProgress, setQrProgress] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpVerified, setTotpVerified] = useState(false);
  const [totpError, setTotpError] = useState("");
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);

  // ── Step 6: Recovery Codes ──────────────────────────────────────────────────
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryCodesConfirmed, setRecoveryCodesConfirmed] = useState(false);

  // ── Step 7: Security Codes ──────────────────────────────────────────────────
  const [securityCodes, setSecurityCodes] = useState<string[]>([]);
  const [securityCodesConfirmed, setSecurityCodesConfirmed] = useState(false);

  // ── Step 8: Govt ID ─────────────────────────────────────────────────────────
  const [govtIdType, setGovtIdType] = useState("");
  const [govtIdNumber, setGovtIdNumber] = useState("");
  const [govtIdVerified, setGovtIdVerified] = useState(false);

  // ── Step 9: Selfie ──────────────────────────────────────────────────────────
  const [selfieDataUrl, setSelfieDataUrl] = useState("");

  // ── Step 10: Security Questions ─────────────────────────────────────────────
  const [secQEnabled, setSecQEnabled] = useState(false);
  const [secQA, setSecQA] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  // ── Step 11: Approver ───────────────────────────────────────────────────────
  const [approverName, setApproverName] = useState("");
  const [approverRole, setApproverRole] = useState("");
  const [approverEmail, setApproverEmail] = useState("");
  const [approverPhone, setApproverPhone] = useState("");
  const [approverEmailVerified, setApproverEmailVerified] = useState(false);
  const [approverPhoneVerified, setApproverPhoneVerified] = useState(false);

  // ── Step 12: Policies ───────────────────────────────────────────────────────
  const policyDocs = [
    {
      id: "recovery",
      title: "Recovery Policy",
      body: "This Recovery Policy outlines the procedures for account recovery. In the event of loss of access to your account, you may use registered backup codes, alternate contact information, or secondary approver verification to regain access. All recovery requests are logged and audited. Unauthorized recovery attempts will result in account suspension. You must notify the platform administrator within 24 hours of any suspected unauthorized access. The platform reserves the right to request additional verification at any point during the recovery process. Recovery codes are single-use and must be regenerated after each use. You are responsible for the safekeeping of your recovery codes. The platform cannot be held liable for loss of access due to misplaced recovery credentials.",
    },
    {
      id: "terms",
      title: "Terms & Conditions",
      body: "By registering as a Super Admin on this platform, you agree to abide by all terms and conditions set forth herein. You acknowledge that you are authorized personnel with permission to access administrative functions. You agree not to share your credentials with any third party. You accept responsibility for all actions taken under your account. The platform reserves the right to revoke access at any time for violation of these terms. You agree to maintain the confidentiality of all data you access. Misuse of administrative privileges may result in legal action. You agree to report any security vulnerabilities discovered during your use of the platform. These terms are subject to change with prior notice.",
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      body: "This Privacy Policy describes how we collect, store, and process your personal data. We collect information necessary for account creation and security verification. Your data is encrypted at rest and in transit. We do not sell or share your data with third parties except as required by law. You have the right to request deletion of your data subject to legal retention requirements. Data collected includes name, email, phone, government ID references, and biometric data for selfie verification. Biometric data is stored in encrypted form and used solely for identity verification. You may request a copy of your data at any time by contacting the platform administrator.",
    },
    {
      id: "consent",
      title: "Consent for ID Processing",
      body: `Consent for Government-Issued Identity Document Processing

Effective Date: January 1, 2025

1. PURPOSE OF COLLECTION
By proceeding with registration, you explicitly consent to the collection, storage, and processing of your government-issued identity documents (such as Aadhaar, Passport, Driver's License, Voter ID, or equivalent national identification) for the sole purpose of verifying your identity as a Super Administrator on this Learning Management System platform.

2. WHAT WE COLLECT
We collect the following information from your identity document:
  - Full legal name as printed on the document
  - Date of birth
  - Document type and identification number
  - A scanned image or photograph of the document (front and/or back)
  - Any biometric data visible on the document (photograph)

3. HOW WE USE YOUR DATA
Your identity document data is used exclusively for:
  - Initial identity verification at the time of Super Admin account creation
  - Periodic re-verification as required by platform security policies
  - Compliance with applicable legal and regulatory obligations
  - Fraud prevention and account security investigations

4. DATA STORAGE AND SECURITY
  - All document images and associated data are encrypted using AES-256 encryption at rest.
  - Data is transmitted exclusively over TLS 1.3 encrypted channels.
  - Document images are stored in access-controlled, audited storage systems.
  - Only authorized personnel with a verified need-to-know basis may access stored documents.
  - Access logs are maintained and reviewed regularly.

5. DATA RETENTION
  - Identity documents will be retained for the duration of your active Super Admin role plus a mandatory retention period of 7 years in compliance with applicable laws.
  - Upon account termination and expiry of the retention period, document data will be securely deleted using certified data destruction methods.

6. YOUR RIGHTS
You have the following rights with respect to your personal data:
  - Right to access: You may request a copy of the data we hold about you.
  - Right to rectification: You may request correction of inaccurate data.
  - Right to erasure: Subject to legal retention requirements, you may request deletion of your data.
  - Right to restriction: You may request that we restrict processing of your data in certain circumstances.
  - Right to withdraw consent: You may withdraw your consent at any time. Withdrawal of consent will result in the inability to maintain your Super Admin role, as identity verification is a mandatory security requirement.

7. THIRD-PARTY SHARING
We do not sell, rent, or share your identity document data with any third parties except:
  - As required by applicable law, regulation, or court order
  - With our cloud infrastructure provider, subject to strict data processing agreements and security obligations
  - In the event of a merger, acquisition, or corporate restructuring, subject to equivalent protections

8. INTERNATIONAL TRANSFERS
If your data is transferred outside your country of residence, we ensure appropriate safeguards are in place, including Standard Contractual Clauses or equivalent mechanisms approved by the relevant data protection authority.

9. CONTACT
For questions or to exercise your rights, contact the Data Protection Officer at: dpo@lmsplatform.example.com

By checking the acknowledgement box, you confirm that:
  - You have read and understood this Consent for ID Processing in full.
  - You voluntarily and freely provide consent to the collection and processing of your government-issued identity document as described above.
  - You understand that withdrawal of consent may affect your ability to hold the Super Admin role.`,
    },
    {
      id: "security",
      title: "Security Responsibility",
      body: "As a Super Admin, you bear significant security responsibilities. You must keep your credentials, recovery codes, and security codes strictly confidential. You must enable two-factor authentication and maintain access to your authenticator app. You must not access the platform from unsecured networks without a VPN. You are responsible for immediately reporting any suspected breach or unauthorized access. You agree to comply with all security policies and procedures established by the organization. Failure to adhere to security responsibilities may result in account suspension and disciplinary action.",
    },
  ];
  const [policyAgreed, setPolicyAgreed] = useState<Record<string, boolean>>({});
  const [openPolicyId, setOpenPolicyId] = useState<string | null>(null);

  // ─── API helpers ────────────────────────────────────────────────────────────

  const fetchCsrfToken = async (): Promise<string> => {
    const response = await api.get("/auth/csrf-token");
    return response.data?.csrfToken;
  };

  const sendOtpToEmail = async (email: string) => {
    const res = await api.post("/auth/signup-otp/send", { channel: "email", target: email });
    return res.data as { devOtp?: string };
  };

  const sendOtpToPhone = async (phone: string) => {
    const res = await api.post("/auth/signup-otp/send", { channel: "phone", target: phone });
    return res.data as { devOtp?: string };
  };

  const verifyEmailOtp = async (email: string, code: string): Promise<boolean> => {
    const res = await api.post("/auth/signup-otp/verify", { channel: "email", target: email, code });
    return res.data?.verified === true;
  };

  const verifyPhoneOtp = async (phone: string, code: string): Promise<boolean> => {
    const res = await api.post("/auth/signup-otp/verify", { channel: "phone", target: phone, code });
    return res.data?.verified === true;
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (step === 2 && fullName) {
      setUserId(generateUserId(fullName));
    }
  }, [step, fullName]);

  useEffect(() => {
    if (step === 6 && recoveryCodes.length === 0) {
      setRecoveryCodes([generateRecoveryCode()]);
    }
  }, [step]);

  useEffect(() => {
    if (step === 7 && securityCodes.length === 0) {
      setSecurityCodes(generateSecurityCodes(9));
    }
  }, [step]);

  // ─── QR & TOTP ───────────────────────────────────────────────────────────────

  const generateQrCode = async () => {
    const progressSteps = ["Loading…", "10% done", "50% done", "75% done", "90% done"];
    for (const msg of progressSteps) {
      setQrProgress(msg);
      await new Promise((r) => setTimeout(r, 500));
    }
    try {
      const csrfToken = await fetchCsrfToken();
      const normalizedEmail = officialEmail.trim().toLowerCase();
      const res = await api.post(
        "/auth/setup-2fa",
        { email: normalizedEmail, password },
        { headers: { "X-CSRF-Token": csrfToken } }
      );
      setQrCodeDataUrl(res.data.qrCodeDataUrl || "");
      setOtpauthUrl(res.data.otpauthUrl || "");
      setQrProgress("Here is your QR Code");
    } catch (err: any) {
      setQrProgress(null);
      toast.error(getToastMessage(err, "Failed to generate QR code."));
    }
  };

  const verifyTotp = async () => {
    const normalizedTotp = totpCode.replace(/\s+/g, "").trim();
    if (normalizedTotp.length !== 6) {
      setTotpError("Enter the 6-digit code.");
      return;
    }
    setIsVerifyingTotp(true);
    setTotpError("");
    try {
      const csrfToken = await fetchCsrfToken();
      const normalizedEmail = officialEmail.trim().toLowerCase();
      await api.post(
        "/auth/setup-2fa",
        { email: normalizedEmail, password, totpCode: normalizedTotp },
        { headers: { "X-CSRF-Token": csrfToken } }
      );
      setTotpVerified(true);
      toast.success("Code verified ✓");
    } catch (err: any) {
      setTotpError(getToastMessage(err, "Failed, try again."));
    } finally {
      setIsVerifyingTotp(false);
    }
  };

  // ─── Final Submission ─────────────────────────────────────────────────────────

  const handleFinalRegister = async () => {
    setIsSubmitting(true);
    try {
      const csrfToken = await fetchCsrfToken();
      await api.post(
        "/auth/signup",
        {
          identity: { fullName, dob, govtIdType, govtIdNumber },
          contact: {
            officialEmail,
            primaryPhone: `${primaryCountryCode}${primaryPhone}`,
            alternateEmail: altEmail,
            alternatePhone: `${altCountryCode}${altPhone}`,
          },
          security: {
            password,
            confirmPassword,
            securityQuestions: secQA.map((qa) => ({
              question: qa.question,
              answer: qa.answer,
            })),
          },
          advanced: {
            userId,
            totpEnabled: true,
            backupCodes: recoveryCodes,
            securityCodes,
          },
          approver: {
            name: approverName,
            role: approverRole,
            email: approverEmail,
            phone: approverPhone,
          },
        },
        { headers: { "X-CSRF-Token": csrfToken } }
      );

      setSignupComplete(true);
      toast.success("Registration successful!");
    } catch (err: any) {
      toast.error(getToastMessage(err, "Registration failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Validation gates ─────────────────────────────────────────────────────────

  const canProceedStep0 =
    fullName.trim().length > 0 && !validateFullName(fullName) && dob.trim().length > 0;
  const canProceedStep1 = emailVerified && phoneVerified;
  const canProceedStep3 = altEmailVerified && altPhoneVerified;
  const canProceedStep4 = (() => {
    const p = password;
    return (
      p.length >= 12 &&
      /[A-Z]/.test(p) &&
      /[a-z]/.test(p) &&
      /\d/.test(p) &&
      /[^A-Za-z0-9]/.test(p) &&
      p === confirmPassword
    );
  })();
  const canProceedStep5 = totpVerified;
  const canProceedStep6 = recoveryCodesConfirmed;
  const canProceedStep7 = securityCodesConfirmed;
  const canProceedStep8 = govtIdVerified;
  const canProceedStep9 = selfieDataUrl.length > 0;
  const canProceedStep10 =
    !secQEnabled || secQA.every((qa) => qa.question && qa.answer.length >= 3);
  const canProceedStep11 =
    approverName.trim() &&
    approverRole.trim() &&
    approverEmailVerified &&
    approverPhoneVerified;
  const canProceedStep12 = policyDocs.every((p) => policyAgreed[p.id]);
  const govtIdNumberPlaceholder =
    govtIdPlaceholders[govtIdType] ?? "Enter ID number as per selected document";

  const verifyGovtIdStep = () => {
    const normalized = govtIdNumber.replace(/[^A-Za-z0-9]/g, "");
    const requiredLength = govtIdMinLength[govtIdType] ?? 0;
    const selectedGovtId = govtIdOptions.find((opt) => opt.value === govtIdType)?.label ?? "ID";

    if (!govtIdType) {
      toast.error("Please select a government ID type.");
      return;
    }

    if (!normalized) {
      toast.error("Please enter your government ID number.");
      return;
    }

    if (requiredLength > 0 && normalized.length < requiredLength) {
      toast.error(
        `${selectedGovtId} number seems incomplete. Please enter the full ID number (minimum ${requiredLength} characters).`
      );
      return;
    }

    setGovtIdVerified(true);
    toast.success("Government ID verified successfully!");
  };

  // ─── Shared styles ────────────────────────────────────────────────────────────

  const inputCls =
    "w-full rounded-[18px] border border-[#d1d9e6] bg-[#e6e8ee] px-4 py-3 text-sm text-[#44476a] shadow-[inset_2px_2px_5px_#b8b9be,inset_-3px_-3px_7px_#ffffff] transition focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]/40";

  const selectCls =
    "rounded-[18px] border border-[#d1d9e6] bg-[#e6e8ee] px-3 py-3 text-sm text-[#44476a] shadow-[inset_2px_2px_5px_#b8b9be,inset_-3px_-3px_7px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]/40";

  const sectionCard =
    "rounded-[22px] border border-[#d1d9e6] bg-[#e6e8ee] p-5 shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]";

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (signupComplete) {
    return (
      <NeumorphicCard className="max-w-3xl w-full force-white-text rounded-[28px]">
        <div className="grid gap-6 p-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-400 bg-green-50 shadow-[0_0_24px_rgba(74,222,128,0.4)]">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-semibold text-[#111827] dark:text-[#f8fafc]">
            Registration Successful.
          </h2>
          <p className="text-sm text-[#475569] dark:text-[#94a3b8]">
            Please login with your credentials to access the admin workspace.
          </p>
          <div className="mx-auto grid w-full max-w-xs gap-3">
            <NeumorphicButton
              type="button"
              className="w-full"
              iconLeft={<LogIn className="h-4 w-4" />}
              onClick={() => router.push("/signin")}
            >
              Go to Sign In
            </NeumorphicButton>
          </div>
        </div>
      </NeumorphicCard>
    );
  }

  return (
    <>
      {openPolicyId &&
        (() => {
          const doc = policyDocs.find((p) => p.id === openPolicyId)!;
          return (
            <PolicyModal
              title={doc.title}
              body={doc.body}
              onFullyRead={() =>
                setPolicyAgreed((prev) => ({ ...prev, [openPolicyId]: true }))
              }
              onClose={() => setOpenPolicyId(null)}
            />
          );
        })()}

      <NeumorphicCard className="max-w-3xl w-full force-white-text rounded-[28px] bg-[#e6ebf2] shadow-[6px_6px_12px_rgba(200,201,209,0.35),-6px_-6px_12px_rgba(255,255,255,0.95)]">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#4b5563]">
              Super Admin onboarding
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">
              Secure multi-step signup
            </h2>
          </div>
          <ThemeToggle />
        </div>
        <StepProgress steps={steps} current={step} />

        {/* ── Step 0: Basic Info ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Basic Info
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Start with your identity details.
              </p>
            </div>

            <label className="grid gap-1.5 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span className="font-medium">
                Full Name{" "}
                <span className="font-normal text-[#64748b]">
                  (as per legal document)
                </span>
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFullNameError(validateFullName(e.target.value));
                }}
                onBlur={() => setFullNameError(validateFullName(fullName))}
                placeholder="e.g. Rajesh Kumar Sharma"
                className={inputCls}
              />
              {fullNameError && (
                <span className="text-xs text-red-500">{fullNameError}</span>
              )}
              <span className="text-xs text-[#64748b]">
                Enter 2–5 words, letters only, as it appears on your official ID.
              </span>
            </label>

            <label className="grid gap-1.5 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span className="font-medium">Date of Birth</span>
              <DatePicker
                value={dob}
                onChange={setDob}
                placeholder="Choose birth date"
                className="w-full"
              />
            </label>

            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-3xl bg-[#e6ebf2] px-6 py-3 text-sm text-[#94a3b8] shadow-[inset_4px_4px_10px_#c1c7d0]"
              >
                Back
              </button>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep0}
                onClick={() => setStep(1)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 1: Primary Contact ───────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Primary Contact Verification
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Verify your official email and primary phone via OTP.
              </p>
            </div>

            <div className={sectionCard}>
              <p className="mb-3 text-sm font-semibold text-[#111827]">Official Email</p>
              <input
                type="email"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                placeholder="admin@example.com"
                className={inputCls}
                disabled={emailVerified}
              />
              {officialEmail.trim() && (
                <div className="mt-3">
                  <OtpVerifyField
                    label="Email"
                    contactValue={officialEmail}
                    type="email"
                    onVerified={() => setEmailVerified(true)}
                    sendOtp={sendOtpToEmail}
                    verifyOtp={verifyEmailOtp}
                    disabled={emailVerified}
                  />
                </div>
              )}
            </div>

            <div className={sectionCard}>
              <p className="mb-3 text-sm font-semibold text-[#111827]">Primary Phone</p>
              <div className="flex gap-2">
                <DropdownSelect
                  value={primaryCountryCode}
                  options={COUNTRY_CODE_OPTIONS}
                  onChange={setPrimaryCountryCode}
                  disabled={phoneVerified}
                  className="max-w-[150px]"
                  buttonClassName={selectCls}
                />
                <input
                  type="tel"
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  placeholder="9876543210"
                  className={`${inputCls} flex-1`}
                  disabled={phoneVerified}
                />
              </div>
              {primaryPhone.trim() && (
                <div className="mt-3">
                  <OtpVerifyField
                    label="Phone"
                    contactValue={`${primaryCountryCode}${primaryPhone}`}
                    type="phone"
                    onVerified={() => setPhoneVerified(true)}
                    sendOtp={sendOtpToPhone}
                    verifyOtp={verifyPhoneOtp}
                    disabled={phoneVerified}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(0)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 2: User ID ───────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Your User ID
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                This ID is generated from your name and a unique number.
              </p>
            </div>
            <div className={sectionCard}>
              <p className="text-xs uppercase tracking-widest text-[#64748b] mb-2">
                Generated User ID
              </p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold tracking-widest text-[#111827] dark:text-[#f8fafc] font-mono">
                  {userId}
                </span>
                <button
                  type="button"
                  onClick={() => setUserId(generateUserId(fullName))}
                  className="rounded-full p-2 hover:bg-[#d1d5db] transition"
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4 text-[#64748b]" />
                </button>
              </div>
              <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                ⚠️ This is your User ID.{" "}
                <strong>Please remember it for login.</strong>
              </p>
              <p className="mt-2 text-xs text-[#64748b]">
                Format: PRGE + First letter of name + 6-digit unique number
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(1)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(3)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 3: Alternate Contact ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Alternate Contact Verification
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Verify your alternate email and phone for recovery.
              </p>
            </div>

            <div className={sectionCard}>
              <p className="mb-3 text-sm font-semibold text-[#111827]">Alternate Email</p>
              <input
                type="email"
                value={altEmail}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.trim().toLowerCase() === officialEmail.trim().toLowerCase()) {
                    toast.error("Alternate email must be different from your primary email.");
                    return;
                  }
                  setAltEmail(val);
                  setAltEmailVerified(false);
                }}
                placeholder="personal@example.com"
                className={inputCls}
                disabled={altEmailVerified}
              />
              {altEmail.trim() && altEmail.trim().toLowerCase() !== officialEmail.trim().toLowerCase() && (
                <div className="mt-3">
                  <OtpVerifyField
                    label="Alt Email"
                    contactValue={altEmail}
                    type="email"
                    onVerified={() => setAltEmailVerified(true)}
                    sendOtp={sendOtpToEmail}
                    verifyOtp={verifyEmailOtp}
                    disabled={altEmailVerified}
                  />
                </div>
              )}
            </div>

            <div className={sectionCard}>
              <p className="mb-3 text-sm font-semibold text-[#111827]">Alternate Phone</p>
              <div className="flex gap-2">
                <DropdownSelect
                  value={altCountryCode}
                  options={COUNTRY_CODE_OPTIONS}
                  onChange={setAltCountryCode}
                  disabled={altPhoneVerified}
                  className="max-w-[150px]"
                  buttonClassName={selectCls}
                />
                <input
                  type="tel"
                  value={altPhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    const fullAlt = `${altCountryCode}${val}`;
                    const fullPrimary = `${primaryCountryCode}${primaryPhone}`;
                    if (val.trim() && fullAlt === fullPrimary) {
                      toast.error("Alternate phone must be different from your primary phone.");
                      return;
                    }
                    setAltPhone(val);
                    setAltPhoneVerified(false);
                  }}
                  placeholder="9876543210"
                  className={`${inputCls} flex-1`}
                  disabled={altPhoneVerified}
                />
              </div>
              {altPhone.trim() && `${altCountryCode}${altPhone}` !== `${primaryCountryCode}${primaryPhone}` && (
                <div className="mt-3">
                  <OtpVerifyField
                    label="Alt Phone"
                    contactValue={`${altCountryCode}${altPhone}`}
                    type="phone"
                    onVerified={() => setAltPhoneVerified(true)}
                    sendOtp={sendOtpToPhone}
                    verifyOtp={verifyPhoneOtp}
                    disabled={altPhoneVerified}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(2)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep3}
                onClick={() => setStep(4)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 4: Password ──────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Set Password
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Create a strong password meeting all requirements.
              </p>
            </div>

            <label className="grid gap-1.5 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span className="font-medium">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            {password.length > 0 && (
              <div className={sectionCard}>
                <p className="text-xs font-semibold text-[#334155] mb-3 uppercase tracking-wider">
                  Password requirements
                </p>
                <PasswordStrengthIndicator password={password} />
              </div>
            )}

            <label className="grid gap-1.5 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span className="font-medium">Confirm Password</span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="text-xs text-red-500">Passwords do not match.</span>
              )}
              {confirmPassword && password === confirmPassword && password.length >= 12 && (
                <span className="text-xs text-green-600">Passwords match ✓</span>
              )}
            </label>

            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(3)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep4}
                onClick={() => setStep(5)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 5: Google Authenticator ──────────────────────────────────── */}
        {step === 5 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Google Authenticator Setup
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Scan the QR code with your authenticator app and verify the code.
              </p>
            </div>

            {!qrCodeDataUrl && (
              <div className={sectionCard}>
                {qrProgress ? (
                  <div className="grid gap-2 text-sm text-[#334155]">
                    {[
                      "Loading…",
                      "10% done",
                      "50% done",
                      "75% done",
                      "90% done",
                      "Here is your QR Code",
                    ].map((msg) => (
                      <div
                        key={msg}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-300 ${
                          qrProgress === msg
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : [
                                "Loading…",
                                "10% done",
                                "50% done",
                                "75% done",
                                "90% done",
                                "Here is your QR Code",
                              ].indexOf(msg) <
                              [
                                "Loading…",
                                "10% done",
                                "50% done",
                                "75% done",
                                "90% done",
                                "Here is your QR Code",
                              ].indexOf(qrProgress)
                            ? "text-green-600 line-through opacity-60"
                            : "text-[#94a3b8]"
                        }`}
                      >
                        <span>{msg}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <NeumorphicButton
                    type="button"
                    className="w-full"
                    onClick={generateQrCode}
                    iconLeft={<QrCode className="h-4 w-4" />}
                  >
                    Generate QR Code
                  </NeumorphicButton>
                )}
              </div>
            )}

            {qrCodeDataUrl && (
              <div className={sectionCard}>
                <p className="text-sm font-semibold text-green-700 mb-3">
                  Here is your QR Code
                </p>
                <div className="rounded-2xl border border-[#dbe0ea] bg-white p-4 text-center">
                  <img
                    src={qrCodeDataUrl}
                    alt="Authenticator QR"
                    className="mx-auto max-w-[220px]"
                  />
                </div>
                {otpauthUrl && (
                  <p className="mt-3 break-all text-xs text-[#64748b] bg-[#f8fafc] rounded-xl p-3">
                    {otpauthUrl}
                  </p>
                )}
                <label className="mt-4 grid gap-1.5 text-sm text-[#334155]">
                  <span className="font-medium">
                    Enter 6-digit code from your app
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="123456"
                    className={inputCls}
                    disabled={totpVerified}
                  />
                </label>
                {totpError && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {totpError}
                  </p>
                )}
                {!totpVerified ? (
                  <NeumorphicButton
                    type="button"
                    className="mt-4 w-full"
                    onClick={verifyTotp}
                    disabled={isVerifyingTotp}
                    iconLeft={<Smartphone className="h-4 w-4" />}
                  >
                    {isVerifyingTotp ? "Verifying…" : "Verify Code"}
                  </NeumorphicButton>
                ) : (
                  <div className="mt-4 rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Code verified ✓
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(4)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep5}
                onClick={() => setStep(6)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 6: Recovery Codes ────────────────────────────────────────── */}
        {step === 6 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Recovery Code
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                This is your single master recovery code. It can be used to regain access to your account if you lose all other credentials.
              </p>
            </div>
            <div className={sectionCard}>
              <p className="text-sm font-semibold text-[#111827] mb-3">Your Recovery Code</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-2xl bg-white dark:bg-[#0f172a] px-5 py-4 font-mono text-lg tracking-widest text-[#111827] dark:text-[#f8fafc] shadow-[inset_3px_3px_8px_#c1c7d0] select-all break-all">
                  {recoveryCodes[0]}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryCodes[0] ?? "");
                    toast.success("Recovery code copied to clipboard!");
                  }}
                  className="flex-shrink-0 rounded-full p-3 bg-[#e6ebf2] shadow-[4px_4px_8px_#c1c7d0,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#c1c7d0,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_5px_#c1c7d0] transition"
                  title="Copy to clipboard"
                >
                  <Copy className="h-5 w-5 text-[#3549ff]" />
                </button>
              </div>
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                ⚠️ <strong>Copy and store this code somewhere safe</strong> — in a password manager, printed paper, or secure note. This code will <strong>not be shown again</strong> after you proceed. It is used in the recovery process to verify your identity.
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <input
                  type="checkbox"
                  checked={recoveryCodesConfirmed}
                  onChange={(e) => setRecoveryCodesConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#3549ff] focus:ring-[#3549ff]"
                />
                <span>I have copied and securely stored this recovery code.</span>
              </label>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(5)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep6}
                onClick={() => setStep(7)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 7: Security Codes ────────────────────────────────────────── */}
        {step === 7 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Security Codes
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                These are your 9 security codes. During account recovery, any one of these codes can be used to verify your identity.
              </p>
            </div>
            <div className={sectionCard}>
              <p className="text-sm font-semibold text-[#111827] mb-1">Your 9 Security Codes</p>
              <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                ⚠️ <strong>Store all 9 codes securely.</strong> During recovery, any one matching code from this list will grant access. These codes are fixed and will not change — treat them like passwords.
              </div>
              <div className="grid grid-cols-3 gap-2">
                {securityCodes.map((code, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white dark:bg-[#0f172a] px-3 py-2 font-mono text-sm text-[#111827] dark:text-[#f8fafc] shadow-[inset_3px_3px_8px_#c1c7d0] text-center"
                  >
                    {i + 1}. {code}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(securityCodes.join("\n"));
                  toast.success("All 9 security codes copied to clipboard!");
                }}
                className="mt-3 flex items-center gap-2 text-xs text-blue-600 hover:underline"
              >
                <Copy className="h-3.5 w-3.5" /> Copy all codes
              </button>
              <label className="mt-4 flex items-center gap-3 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <input
                  type="checkbox"
                  checked={securityCodesConfirmed}
                  onChange={(e) => setSecurityCodesConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#3549ff] focus:ring-[#3549ff]"
                />
                <span>I have stored all 9 security codes safely.</span>
              </label>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(6)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep7}
                onClick={() => setStep(8)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 8: Government ID ─────────────────────────────────────────── */}
        {step === 8 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Government ID Verification
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Provide your government ID type and number for secure
                verification.
              </p>
            </div>

            {!govtIdVerified ? (
              <div className={sectionCard}>
                <label className="grid gap-1.5 text-sm text-[#334155] mb-3">
                  <span className="font-medium">ID Type</span>
                  <DropdownSelect
                    value={govtIdType}
                    options={govtIdOptions}
                    placeholder="Select ID type"
                    onChange={(value) => {
                      setGovtIdType(value);
                      setGovtIdVerified(false);
                    }}
                    buttonClassName={inputCls}
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-[#334155] mb-3">
                  <span className="font-medium">ID Number</span>
                  <input
                    type="text"
                    value={govtIdNumber}
                    onChange={(e) => {
                      setGovtIdNumber(e.target.value);
                      setGovtIdVerified(false);
                    }}
                    placeholder={govtIdNumberPlaceholder}
                    className={inputCls}
                  />
                </label>
                <NeumorphicButton
                  type="button"
                  className="mt-4 w-full"
                  disabled={!govtIdType || !govtIdNumber.trim()}
                  onClick={verifyGovtIdStep}
                  iconLeft={<ShieldCheck className="h-4 w-4" />}
                >
                  Verify Government ID
                </NeumorphicButton>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-green-300 bg-green-50 px-5 py-4 text-sm text-green-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Government ID Verified ✓</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Your ID number has been captured securely.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(7)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep8}
                onClick={() => setStep(9)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 9: Selfie ────────────────────────────────────────────────── */}
        {step === 9 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Selfie Verification
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Take a live photo to verify your identity. Your image is stored
                securely.
              </p>
            </div>
            <div className={sectionCard}>
              <SelfieCapture onCapture={(dataUrl) => setSelfieDataUrl(dataUrl)} />
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(8)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep9}
                onClick={() => setStep(10)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 10: Security Questions ───────────────────────────────────── */}
        {step === 10 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Security Questions
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Choose questions and answers you will remember long-term. These
                are used for account recovery.
              </p>
            </div>
            <label className="flex items-center gap-3 text-sm text-[#334155]">
              <input
                type="checkbox"
                checked={secQEnabled}
                onChange={(e) => setSecQEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#3549ff] focus:ring-[#3549ff]"
              />
              <span>I understand and want to set security questions</span>
            </label>
            {secQEnabled && (
              <div className="grid gap-4">
                {secQA.map((qa, i) => (
                  <div key={i} className={sectionCard}>
                    <p className="text-sm font-medium text-[#111827] mb-3">
                      Question {i + 1}
                    </p>
                    <label className="grid gap-1.5 text-sm text-[#334155] mb-3">
                      <span>Question</span>
                      <DropdownSelect
                        value={qa.question}
                        options={SECURITY_QUESTION_OPTIONS.map((q) => ({ value: q, label: q }))}
                        placeholder="Select a question"
                        onChange={(value) => {
                          const next = [...secQA];
                          next[i] = { ...next[i], question: value };
                          setSecQA(next);
                        }}
                        buttonClassName={inputCls}
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm text-[#334155]">
                      <span>Answer</span>
                      <input
                        type="text"
                        value={qa.answer}
                        onChange={(e) => {
                          const next = [...secQA];
                          next[i] = { ...next[i], answer: e.target.value };
                          setSecQA(next);
                        }}
                        placeholder="Your answer"
                        className={inputCls}
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(9)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep10}
                onClick={() => setStep(11)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 11: Approver ─────────────────────────────────────────────── */}
        {step === 11 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Secondary Approver Details
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Provide details of a secondary approver who can authorize critical
                actions.
              </p>
            </div>

            <label className="grid gap-1.5 text-sm text-[#334155]">
              <span className="font-medium">Approver Name</span>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="Full name"
                className={inputCls}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-[#334155]">
              <span className="font-medium">Role / Designation</span>
              <input
                type="text"
                value={approverRole}
                onChange={(e) => setApproverRole(e.target.value)}
                placeholder="e.g. IT Head, Co-founder"
                className={inputCls}
              />
            </label>

            <div className={sectionCard}>
              <p className="mb-2 text-sm font-semibold text-[#111827]">
                Official Email
              </p>
              <input
                type="email"
                value={approverEmail}
                onChange={(e) => setApproverEmail(e.target.value)}
                placeholder="approver@example.com"
                className={inputCls}
                disabled={approverEmailVerified}
              />
              {approverEmail.trim() && (
                <div className="mt-3">
                  <OtpVerifyField
                    label="Approver Email"
                    contactValue={approverEmail}
                    type="email"
                    onVerified={() => setApproverEmailVerified(true)}
                    sendOtp={sendOtpToEmail}
                    verifyOtp={verifyEmailOtp}
                    disabled={approverEmailVerified}
                  />
                </div>
              )}
            </div>

            <div className={sectionCard}>
              <p className="mb-2 text-sm font-semibold text-[#111827]">
                Contact Number
              </p>
              <input
                type="tel"
                value={approverPhone}
                onChange={(e) => setApproverPhone(e.target.value)}
                placeholder="Approver phone"
               className={inputCls}
                disabled={approverPhoneVerified}
              />
              {approverPhone.trim() && (
                <div className="mt-3">
                  <OtpVerifyField
                    label="Approver Phone"
                    contactValue={approverPhone}
                    type="phone"
                    onVerified={() => setApproverPhoneVerified(true)}
                    sendOtp={sendOtpToPhone}
                    verifyOtp={verifyPhoneOtp}
                    disabled={approverPhoneVerified}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(10)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep11}
                onClick={() => setStep(12)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 12: Policies ─────────────────────────────────────────────── */}
        {step === 12 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Policy Agreements
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Please open and read each document in full before checking the
                box.
              </p>
            </div>
            <div className="grid gap-3">
              {policyDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`${sectionCard} flex items-center justify-between gap-4`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!policyAgreed[doc.id]}
                      onChange={() => {}}
                      disabled={!policyAgreed[doc.id]}
                      className="h-4 w-4 rounded border-gray-300 text-[#3549ff] focus:ring-[#3549ff]"
                    />
                    <span className="text-sm text-[#334155] font-medium">
                      {doc.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenPolicyId(doc.id)}
                    className="shrink-0 text-xs text-blue-600 hover:underline"
                  >
                    {policyAgreed[doc.id] ? "Read ✓" : "Open & Read"}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#64748b]">
              Checkboxes are enabled only after you have scrolled through the full
              document.
            </p>
            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(11)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={!canProceedStep12}
                onClick={() => setStep(13)}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </NeumorphicButton>
            </div>
          </div>
        )}

        {/* ── Step 13: Review & Register ────────────────────────────────────── */}
        {step === 13 && (
          <div className="grid gap-5 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-[#111827] dark:text-[#f8fafc]">
                Review & Register
              </h3>
              <p className="mt-1 text-sm text-[#475569]">
                Review your information and complete registration.
              </p>
            </div>
            <div className="grid gap-3 rounded-3xl border border-white/90 dark:border-slate-700 bg-[#f0f4fb] dark:bg-[#111827] p-5 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
              <SummaryItem title="Full Name" value={fullName} />
              <SummaryItem title="User ID" value={userId} />
              <SummaryItem title="Official Email" value={officialEmail} />
              <SummaryItem
                title="Primary Phone"
                value={`${primaryCountryCode} ${primaryPhone}`}
              />
              <SummaryItem title="Alternate Email" value={altEmail || "—"} />
              <SummaryItem
                title="Alternate Phone"
                value={altPhone ? `${altCountryCode} ${altPhone}` : "—"}
              />
              <SummaryItem
                title="Government ID"
                value={`${
                  govtIdOptions.find((o) => o.value === govtIdType)?.label ??
                  govtIdType
                } — ${govtIdNumber}`}
              />
              <SummaryItem
                title="2FA"
                value={totpVerified ? "Google Authenticator ✓" : "—"}
              />
              <SummaryItem
                title="Recovery Codes"
                value={`${recoveryCodes.length} codes generated`}
              />
              <SummaryItem
                title="Security Codes"
                value={`${securityCodes.length} codes generated`}
              />
              <SummaryItem
                title="Approver"
                value={
                  approverName ? `${approverName} (${approverRole})` : "—"
                }
              />
              <SummaryItem
                title="Policies"
                value={`${
                  Object.values(policyAgreed).filter(Boolean).length
                }/${policyDocs.length} agreed`}
              />
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setStep(12)}
                iconLeft={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </NeumorphicButton>
              <NeumorphicButton
                type="button"
                className="w-full max-w-xs"
                disabled={isSubmitting}
                onClick={handleFinalRegister}
                iconLeft={<CheckCircle2 className="h-4 w-4" />}
              >
                {isSubmitting ? "Registering…" : "Register"}
              </NeumorphicButton>
            </div>
          </div>
        )}
      </NeumorphicCard>
    </>
  );
}