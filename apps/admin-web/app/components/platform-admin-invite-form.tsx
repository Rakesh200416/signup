"use client";

import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Mail, Lock, Phone, ShieldCheck, User } from "lucide-react";
import { z } from "zod";
import api from "../lib/api";
import { NeumorphicButton } from "./NeumorphicButton";
import { NeumorphicCard } from "./NeumorphicCard";
import { DatePicker } from "./DatePicker";
import { DropdownSelect } from "./DropdownSelect";

const platformAdminInviteSchema = z
  .object({
    fullName: z.string().min(3, "Name cannot be empty."),
    dob: z.string().min(8, "Date of birth is required."),
    govtIdType: z.string().min(2, "Government ID type is required."),
    profilePhotoUrl: z.string().url("Enter a valid profile photo URL.").optional().or(z.literal("")),
    officialEmail: z.string().email("This email does not look valid."),
    personalEmail: z.string().email("This email does not look valid.").optional().or(z.literal("")),
    primaryPhone: z.string().min(8, "Use at least 8 characters."),
    secondaryPhone: z.string().min(8, "Secondary phone must be at least 8 digits.").optional().or(z.literal("")),
    googleId: z.string().min(3, "Google ID must be at least 3 characters.").optional().or(z.literal("")),
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .regex(/(?=.*[a-z])/, "Add letters, numbers and symbols for a stronger password.")
      .regex(/(?=.*[A-Z])/, "Add letters, numbers and symbols for a stronger password.")
      .regex(/(?=.*\d)/, "Add letters, numbers and symbols for a stronger password.")
      .regex(/(?=.*[^A-Za-z0-9])/, "Add letters, numbers and symbols for a stronger password."),
    confirmPassword: z.string().min(12, "Please confirm your password."),
    recoveryCode: z
      .string()
      .min(8, "Recovery code must be at least 8 characters.")
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, "Recovery code must be letters and numbers only."),
    question1: z.string().min(10, "Security question 1 is required."),
    answer1: z.string().min(3, "Please answer security question 1."),
    question2: z.string().min(10, "Security question 2 is required."),
    answer2: z.string().min(3, "Please answer security question 2."),
    question3: z.string().min(10, "Security question 3 is required."),
    answer3: z.string().min(3, "Please answer security question 3."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

type PlatformAdminInviteFormValues = z.infer<typeof platformAdminInviteSchema>;

type ParsedInviteRow = {
  fullName: string;
  dob: string;
  govtIdType: string;
  govtIdUrl?: string;
  profilePhotoUrl?: string;
  officialEmail: string;
  personalEmail?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  googleId?: string;
  password: string;
  confirmPassword: string;
  recoveryCode: string;
  question1: string;
  answer1: string;
  question2: string;
  answer2: string;
  question3: string;
  answer3: string;
  magicLinkEmail?: string;
  ipWhitelist?: string;
};

type UploadResult = {
  email: string;
  success: boolean;
  message: string;
};

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

const normalizeCellValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const findRowValue = (row: Record<string, unknown>, candidates: string[]) => {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const raw = normalizeCellValue(row[key]);
      if (raw) return raw;
    }
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const entryKey of Object.keys(row)) {
      if (entryKey.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedKey) {
        const raw = normalizeCellValue(row[entryKey]);
        if (raw) return raw;
      }
    }
  }
  return "";
};

const govtIdOptions = [
  { value: "aadhar", label: "Aadhar" },
  { value: "pan", label: "PAN" },
  { value: "passport", label: "Passport" },
  { value: "driving_license", label: "Driving Licence" },
];

const buildSignupPayload = (values: PlatformAdminInviteFormValues) => ({
  identity: {
    fullName: values.fullName,
    dob: values.dob,
    govtIdType: values.govtIdType,
    profilePhotoUrl: values.profilePhotoUrl || undefined,
  },
  contact: {
    officialEmail: values.officialEmail,
    personalEmail: values.personalEmail || undefined,
    primaryPhone: values.primaryPhone,
    secondaryPhone: values.secondaryPhone || undefined,
  },
  security: {
    password: values.password,
    confirmPassword: values.confirmPassword,
    securityQuestions: [
      { question: values.question1, answer: values.answer1 },
      { question: values.question2, answer: values.answer2 },
      { question: values.question3, answer: values.answer3 },
    ],
  },
  advanced: {
    googleId: values.googleId || undefined,
    recoveryCode: values.recoveryCode || undefined,
    ipWhitelist: [],
  },
});

const fetchCsrfToken = async () => {
  try {
    const response = await api.get("/auth/csrf-token");
    return response.data?.csrfToken || null;
  } catch (error) {
    console.error("CSRF token fetch failed:", error);
    return null;
  }
};

export function PlatformAdminInviteForm() {
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const [govtIdFile, setGovtIdFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlatformAdminInviteFormValues>({
    resolver: zodResolver(platformAdminInviteSchema),
    defaultValues: {
      fullName: "",
      dob: "",
      govtIdType: "",
      profilePhotoUrl: "",
      officialEmail: "",
      personalEmail: "",
      primaryPhone: "",
      secondaryPhone: "",
      password: "",
      confirmPassword: "",
      recoveryCode: "",
      question1: "",
      answer1: "",
      question2: "",
      answer2: "",
      question3: "",
      answer3: "",
    },
  });
  const passwordValue = watch("password") || "";
  const passwordPolicyRules = [
    { id: "length", label: "At least 12 characters", isValid: passwordValue.length >= 12 },
    { id: "uppercase", label: "At least 1 uppercase letter", isValid: /[A-Z]/.test(passwordValue) },
    { id: "lowercase", label: "At least 1 lowercase letter", isValid: /[a-z]/.test(passwordValue) },
    { id: "digit", label: "At least 1 numeric digit", isValid: /\d/.test(passwordValue) },
    { id: "special", label: "At least 1 special character", isValid: /[^A-Za-z0-9]/.test(passwordValue) },
  ];
  const passwordValidCount = passwordPolicyRules.filter((rule) => rule.isValid).length;
  const passwordStrength =
    passwordValidCount === 5
      ? { label: "Strong", emoji: "🟢", tone: "bg-[#e6f6e6] text-[#2f6f35] border-[#bceab3]" }
      : passwordValidCount >= 3
      ? { label: "Medium", emoji: "🟡", tone: "bg-[#fff7df] text-[#a8791f] border-[#f4dd8d]" }
      : { label: "Weak", emoji: "🔴", tone: "bg-[#fbeaea] text-[#9b3e42] border-[#e9c3c5]" };

  const inviteAdmin = async (payload: PlatformAdminInviteFormValues) => {
    const csrfToken = await fetchCsrfToken();
    const config = csrfToken
      ? { headers: { "X-CSRF-Token": csrfToken } }
      : undefined;

    const response = await api.post("/auth/invite-platform-admin", buildSignupPayload(payload), config);
    return response.data;
  };

  const onSubmitError = (errors: Record<string, unknown>) => {
    const firstError = Object.values(errors)[0] as any;
    const message = firstError?.message || "Please correct the highlighted fields before sending the invite.";
    setStatusMessage(message);
    toast.error(message);
    setIsSending(false);
  };

  const onSubmit = async (values: PlatformAdminInviteFormValues) => {
    try {
      setIsSending(true);
      setStatusMessage("Sending invite... Please wait.");
      const result = await inviteAdmin(values);
      if (govtIdFile) {
        const csrfToken = await fetchCsrfToken();
        const idForm = new FormData();
        idForm.append("email", values.officialEmail);
        idForm.append("govtIdType", values.govtIdType);
        idForm.append("govtIdFile", govtIdFile);
        await api.post(
          "/auth/upload-id",
          idForm,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
            },
          },
        );
      }
      toast.success("Invitation sent. Check your inbox.");
      setStatusMessage(`Invite link sent to ${result.email}.`);
      reset();
      setGovtIdFile(null);
    } catch (error: any) {
      const message = getToastMessage(error, "Could not send invite.");
      toast.error(message);
      setStatusMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const submitInviteForm = handleSubmit(onSubmit, onSubmitError);

  return (
    <div className="grid gap-6">
      <NeumorphicCard className="max-w-4xl w-full">
        <div className="mb-6 text-center sm:text-left">
          <p className="text-sm uppercase tracking-[0.35em] text-[#5c6d94]">Platform Admin Signup</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">Create your account to access the admin workspace</h1>
          <p className="mt-3 text-sm text-[#475569] dark:text-[#94a3b8]">
            Invite a platform admin with onboarding details and send the access link directly to the official email inbox.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={submitInviteForm}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Full name</span>
              <div className="neumorphic-field-group">
                <span className="neumorphic-icon-box">
                  <User className="h-4 w-4" />
                </span>
                <input type="text" {...register("fullName")} className="neumorphic-field-input" placeholder="Enter full name" />
              </div>
              <span className="text-xs text-red-500">{errors.fullName?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Date of birth</span>
              <div className="neumorphic-field-group">
                <span className="neumorphic-icon-box">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <Controller
                  control={control}
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
              </div>
              <span className="text-xs text-red-500">{errors.dob?.message as string}</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Government ID type</span>
              <div className="neumorphic-field-group">
                <span className="neumorphic-icon-box">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <DropdownSelect
                  value={watch("govtIdType")}
                  options={govtIdOptions}
                  placeholder="Select ID type"
                  onChange={(value) => setValue("govtIdType", value)}
                />
              </div>
              <span className="text-xs text-red-500">{errors.govtIdType?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Government ID upload</span>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) => setGovtIdFile(event.target.files?.[0] ?? null)}
                  className="neumorphic-input w-full cursor-pointer px-4 py-3 text-sm"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-[#e2e8f0] px-3 py-1 text-xs text-[#334155] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.08)] dark:bg-[#1f2937] dark:text-[#cbd5e1]">
                  📎 Browse
                </span>
              </div>
              {govtIdFile && <p className="text-xs text-[#334155] dark:text-[#cbd5e1]">Selected file: {govtIdFile.name}</p>}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Official email</span>
              <div className="neumorphic-field-group">
                <span className="neumorphic-icon-box">
                  <Mail className="h-4 w-4" />
                </span>
                <input type="email" {...register("officialEmail")} className="neumorphic-field-input" placeholder="admin@company.com" />
              </div>
              <span className="text-xs text-[#64748b]">Invitation link will be sent to this email inbox.</span>
              <span className="text-xs text-red-500">{errors.officialEmail?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Personal email</span>
<input type="email" {...register("personalEmail")} className="neumorphic-input w-full px-4 py-3 text-sm" placeholder="Enter personal email (optional)" />
              <span className="text-xs text-red-500">{errors.personalEmail?.message as string}</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Primary phone</span>
              <div className="neumorphic-field-group">
                <span className="neumorphic-icon-box">
                  <Phone className="h-4 w-4" />
                </span>
                <input type="tel" {...register("primaryPhone")} className="neumorphic-field-input" placeholder="+1 234 567 890" />
              </div>
              <span className="text-xs text-red-500">{errors.primaryPhone?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Secondary phone</span>
              <input type="tel" {...register("secondaryPhone")} className="neumorphic-input w-full px-4 py-3 text-sm" placeholder="Optional secondary phone" />
              <span className="text-xs text-red-500">{errors.secondaryPhone?.message as string}</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Google ID</span>
              <div className="neumorphic-field-group">
                <span className="neumorphic-icon-box">
                  <Mail className="h-4 w-4" />
                </span>
                <input type="text" {...register("googleId")} className="neumorphic-field-input" placeholder="your.google.id@gmail.com" />
              </div>
              <span className="text-xs text-red-500">{errors.googleId?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Recovery code</span>
              <div className="neumorphic-field-group">
                <span className="neumorphic-icon-box">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <input type="text" {...register("recoveryCode")} className="neumorphic-field-input" placeholder="Enter recovery code" />
              </div>
              <span className="text-xs text-[#64748b]">Letters and numbers only, at least 8 characters.</span>
              <span className="text-xs text-red-500">{errors.recoveryCode?.message as string}</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Password</span>
              <div className="neumorphic-field-group">
                <span className="neumorphic-icon-box">
                  <Lock className="h-4 w-4" />
                </span>
                <input type="password" {...register("password")} className="neumorphic-field-input" placeholder="Create a strong password" />
              </div>
              <span className="text-xs text-red-500">{errors.password?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Confirm password</span>
              <div className="neumorphic-field-group">
                <span className="neumorphic-icon-box">
                  <Lock className="h-4 w-4" />
                </span>
                <input type="password" {...register("confirmPassword")} className="neumorphic-field-input" placeholder="Re-enter password" />
              </div>
              <span className="text-xs text-red-500">{errors.confirmPassword?.message as string}</span>
            </label>
          </div>

          <div className="rounded-[24px] bg-[#e6e8ee] p-4 shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]">
            <p className="mb-3 text-sm font-medium text-[#334155]">Password policy</p>
            <div className="grid gap-2">
              {passwordPolicyRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-3 rounded-[18px] px-3 py-2 transition ${rule.isValid ? "bg-[#eef8ef] text-[#2f6f35]" : "bg-[#faf0f2] text-[#8d3f4f]"}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition ${rule.isValid ? "bg-[#d9f3d9] text-[#2f6f35]" : "bg-[#fcedef] text-[#a45a68]"}`}
                  >
                    {rule.isValid ? "✔" : "●"}
                  </span>
                  <span className="text-sm">{rule.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[18px] bg-[#e6e8ee] px-4 py-3 text-sm font-medium text-[#334155] shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>{passwordValidCount === 5 ? "🟢" : passwordValidCount >= 3 ? "🟡" : "🔴"}</span>
                  <span>{passwordValidCount === 5 ? "Strong" : passwordValidCount >= 3 ? "Medium" : "Weak"}</span>
                </span>
                <span className="text-xs text-[#556785]">Strength</span>
              </div>
              <div className="mt-3 neomorphic-progress-track">
                <div
                  className={`neumorphic-progress-fill ${
                    passwordValidCount === 5
                      ? "bg-[#22c55e]"
                      : passwordValidCount >= 3
                      ? "bg-[#f59e0b]"
                      : "bg-[#ef4444]"
                  }`}
                  style={{ width: `${(passwordValidCount / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Security question 1</span>
                <input type="text" {...register("question1")} className="neumorphic-input w-full px-4 py-3 text-sm" placeholder="Enter security question 1" />
                <span className="text-xs text-red-500">{errors.question1?.message as string}</span>
              </label>
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Answer 1</span>
                <input type="text" {...register("answer1")} className="neumorphic-input w-full px-4 py-3 text-sm" placeholder="Answer for question 1" />
                <span className="text-xs text-red-500">{errors.answer1?.message as string}</span>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Security question 2</span>
                <input type="text" {...register("question2")} className="neumorphic-input w-full px-4 py-3 text-sm" placeholder="Enter security question 2" />
                <span className="text-xs text-red-500">{errors.question2?.message as string}</span>
              </label>
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Answer 2</span>
                <input type="text" {...register("answer2")} className="neumorphic-input w-full px-4 py-3 text-sm" placeholder="Answer for question 2" />
                <span className="text-xs text-red-500">{errors.answer2?.message as string}</span>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Security question 3</span>
                <input type="text" {...register("question3")} className="neumorphic-input w-full px-4 py-3 text-sm" placeholder="Enter security question 3" />
                <span className="text-xs text-red-500">{errors.question3?.message as string}</span>
              </label>
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Answer 3</span>
                <input type="text" {...register("answer3")} className="neumorphic-input w-full px-4 py-3 text-sm" placeholder="Answer for question 3" />
                <span className="text-xs text-red-500">{errors.answer3?.message as string}</span>
              </label>
            </div>
          </div>


          <div className="grid gap-4 sm:grid-cols-2">
            <NeumorphicButton
              type="submit"
              className="w-full"
              onClick={() => setStatusMessage("Sending invite... Please wait.")}
              disabled={isSending}
            >
              {isSending ? "Sending invite..." : "Send invitation"}
            </NeumorphicButton>
            <NeumorphicButton type="button" className="w-full" onClick={() => {
              reset();
              setStatusMessage("");
            }}>
              Reset form
            </NeumorphicButton>
          </div>
          {statusMessage && (
            <p className="mt-3 rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 break-words">
              {statusMessage}
            </p>
          )}
          <div className="mt-6 text-center text-sm text-[#5c6d94]">
            Already have an account?{' '}
            <Link href="/platform-admin/signin" className="font-semibold text-[#243457] transition duration-200 hover:text-[#1b2740]">
              Sign in
            </Link>
          </div>
        </form>
      </NeumorphicCard>

    </div>
  );
}
