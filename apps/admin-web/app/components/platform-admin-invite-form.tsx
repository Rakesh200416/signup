"use client";

import { ChangeEvent, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { z } from "zod";
import api from "../lib/api";
import { NeumorphicButton } from "./NeumorphicButton";
import { NeumorphicCard } from "./NeumorphicCard";
import { DatePicker } from "./DatePicker";

const platformAdminInviteSchema = z
  .object({
    fullName: z.string().min(3, "Full name is required."),
    dob: z.string().min(8, "Date of birth is required."),
    govtIdType: z.string().min(2, "Government ID type is required."),
    profilePhotoUrl: z.string().url("Enter a valid profile photo URL.").optional().or(z.literal("")),
    officialEmail: z.string().email("A valid official email is required."),
    personalEmail: z.string().email("Enter a valid personal email.").optional().or(z.literal("")),
    primaryPhone: z.string().min(8, "Primary phone is required."),
    secondaryPhone: z.string().min(8, "Secondary phone must be at least 8 digits.").optional().or(z.literal("")),
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
  password: string;
  confirmPassword: string;
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
    ipWhitelist: [],
  },
});

const formatUploadedRow = (row: Record<string, unknown>): ParsedInviteRow => ({
  fullName: findRowValue(row, ["fullName", "Full Name", "name"]),
  dob: findRowValue(row, ["dob", "DOB", "dateOfBirth", "date of birth"]),
  govtIdType: findRowValue(row, ["govtIdType", "GovtIdType", "ID Type", "governmentIdType"]),
  govtIdUrl: findRowValue(row, ["govtIdUrl", "GovtIdUrl", "govtId", "governmentIdUrl"]),
  profilePhotoUrl: findRowValue(row, ["profilePhotoUrl", "ProfilePhotoUrl", "photoUrl", "profilePhoto"]),
  officialEmail: findRowValue(row, ["officialEmail", "OfficialEmail", "email", "official email"]),
  personalEmail: findRowValue(row, ["personalEmail", "PersonalEmail", "personal email"]),
  primaryPhone: findRowValue(row, ["primaryPhone", "PrimaryPhone", "phone", "primary phone"]),
  secondaryPhone: findRowValue(row, ["secondaryPhone", "SecondaryPhone", "secondary phone"]),
  password: findRowValue(row, ["password", "Password"]),
  confirmPassword: findRowValue(row, ["confirmPassword", "ConfirmPassword", "confirm password"]),
  question1: findRowValue(row, ["question1", "securityQuestion1", "question 1"]),
  answer1: findRowValue(row, ["answer1", "securityAnswer1", "answer 1"]),
  question2: findRowValue(row, ["question2", "securityQuestion2", "question 2"]),
  answer2: findRowValue(row, ["answer2", "securityAnswer2", "answer 2"]),
  question3: findRowValue(row, ["question3", "securityQuestion3", "question 3"]),
  answer3: findRowValue(row, ["answer3", "securityAnswer3", "answer 3"]),
  magicLinkEmail: findRowValue(row, ["magicLinkEmail", "MagicLinkEmail", "magic link email"]),
  ipWhitelist: findRowValue(row, ["ipWhitelist", "ipWhitelist", "ip whitelist"]),
});

const parseInviteFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
  return rawRows.map(formatUploadedRow);
};

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
  const [uploadedRows, setUploadedRows] = useState<ParsedInviteRow[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const [govtIdFile, setGovtIdFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
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
      question1: "",
      answer1: "",
      question2: "",
      answer2: "",
      question3: "",
      answer3: "",
    },
  });

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
    const message = firstError?.message || "Please fix the highlighted form fields.";
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
      toast.success("Platform admin invite sent successfully.");
      setStatusMessage(`Invite sent to ${result.email}. Magic link: ${result.magicLink}`);
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setUploadResults([]);

    try {
      const rows = await parseInviteFile(file);
      setUploadedRows(rows);
      toast.success(`${rows.length} rows parsed from the uploaded file.`);
    } catch (error: any) {
      toast.error(getToastMessage(error, "Unable to parse the uploaded file."));
    } finally {
      setIsParsing(false);
    }
  };

  const sendBulkInvites = async () => {
    if (uploadedRows.length === 0) {
      toast.error("Upload a CSV or Excel file first.");
      return;
    }

    setIsSending(true);
    setUploadResults([]);

    try {
      const csrfToken = await fetchCsrfToken();
      const results: UploadResult[] = [];

      for (const row of uploadedRows) {
        const missingFields = [row.fullName, row.officialEmail, row.primaryPhone, row.password, row.confirmPassword, row.question1, row.answer1, row.question2, row.answer2, row.question3, row.answer3].filter((value) => !value);
        if (missingFields.length > 0) {
          results.push({ email: row.officialEmail || "unknown", success: false, message: "Missing required fields in row." });
          continue;
        }

        try {
          await api.post(
            "/auth/invite-platform-admin",
            buildSignupPayload({
              ...row,
              officialEmail: row.officialEmail,
              primaryPhone: row.primaryPhone,
              password: row.password,
              confirmPassword: row.confirmPassword,
              question1: row.question1,
              answer1: row.answer1,
              question2: row.question2,
              answer2: row.answer2,
              question3: row.question3,
              answer3: row.answer3,
            }),
            { headers: { "X-CSRF-Token": csrfToken } },
          );
          results.push({ email: row.officialEmail, success: true, message: "Invited successfully." });
        } catch (error: any) {
          results.push({ email: row.officialEmail || "unknown", success: false, message: getToastMessage(error, "Invite failed.") });
        }
      }

      setUploadResults(results);
      toast.success("Bulk invite processing completed.");
    } catch (error: any) {
      toast.error(getToastMessage(error, "Bulk invite failed."));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid gap-6">
      <NeumorphicCard className="max-w-4xl w-full">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Platform admin signup</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">Invite a new platform admin</h1>
          <p className="mt-3 text-sm text-[#475569] dark:text-[#94a3b8]">
            Create a platform admin with full onboarding details or upload several users at once using CSV/Excel.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={submitInviteForm}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Full name</span>
              <input type="text" {...register("fullName")} className="neumorphic-input w-full px-4 py-3 text-sm" />
              <span className="text-xs text-red-500">{errors.fullName?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Date of birth</span>
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
            <span className="text-xs text-red-500">{errors.dob?.message as string}</span>
          </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Government ID type</span>
              <div className="relative">
                <select
                  {...register("govtIdType")}
                  className="neumorphic-input w-full appearance-none rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 pr-10 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff] dark:border-slate-700 dark:bg-[#1f2937] dark:text-[#f8fafc]"
                >
                  <option value="">Select ID type</option>
                  {govtIdOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]">▾</span>
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
                  className="neumorphic-input w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 pr-16 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff] dark:border-slate-700 dark:bg-[#1f2937] dark:text-[#f8fafc]"
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
              <input type="email" {...register("officialEmail")} className="neumorphic-input w-full px-4 py-3 text-sm" />
              <span className="text-xs text-red-500">{errors.officialEmail?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Personal email</span>
              <input type="email" {...register("personalEmail")} className="neumorphic-input w-full px-4 py-3 text-sm" />
              <span className="text-xs text-red-500">{errors.personalEmail?.message as string}</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Primary phone</span>
              <input type="tel" {...register("primaryPhone")} className="neumorphic-input w-full px-4 py-3 text-sm" />
              <span className="text-xs text-red-500">{errors.primaryPhone?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Secondary phone</span>
              <input type="tel" {...register("secondaryPhone")} className="neumorphic-input w-full px-4 py-3 text-sm" />
              <span className="text-xs text-red-500">{errors.secondaryPhone?.message as string}</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Password</span>
              <input type="password" {...register("password")} className="neumorphic-input w-full px-4 py-3 text-sm" />
              <span className="text-xs text-red-500">{errors.password?.message as string}</span>
            </label>
            <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
              <span>Confirm password</span>
              <input type="password" {...register("confirmPassword")} className="neumorphic-input w-full px-4 py-3 text-sm" />
              <span className="text-xs text-red-500">{errors.confirmPassword?.message as string}</span>
            </label>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Security question 1</span>
                <input type="text" {...register("question1")} className="neumorphic-input w-full px-4 py-3 text-sm" />
                <span className="text-xs text-red-500">{errors.question1?.message as string}</span>
              </label>
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Answer 1</span>
                <input type="text" {...register("answer1")} className="neumorphic-input w-full px-4 py-3 text-sm" />
                <span className="text-xs text-red-500">{errors.answer1?.message as string}</span>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Security question 2</span>
                <input type="text" {...register("question2")} className="neumorphic-input w-full px-4 py-3 text-sm" />
                <span className="text-xs text-red-500">{errors.question2?.message as string}</span>
              </label>
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Answer 2</span>
                <input type="text" {...register("answer2")} className="neumorphic-input w-full px-4 py-3 text-sm" />
                <span className="text-xs text-red-500">{errors.answer2?.message as string}</span>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Security question 3</span>
                <input type="text" {...register("question3")} className="neumorphic-input w-full px-4 py-3 text-sm" />
                <span className="text-xs text-red-500">{errors.question3?.message as string}</span>
              </label>
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Answer 3</span>
                <input type="text" {...register("answer3")} className="neumorphic-input w-full px-4 py-3 text-sm" />
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
              {isSending ? "Sending invite..." : "Send platform admin invite"}
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
        </form>
      </NeumorphicCard>

      <NeumorphicCard className="max-w-4xl w-full">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Bulk upload</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">Upload CSV / Excel file</h2>
          <p className="mt-3 text-sm text-[#475569] dark:text-[#94a3b8]">
            Upload multiple platform admin invitations at once. The file should include headers for required columns such as fullName, officialEmail, primaryPhone, password, securityQuestion1, securityAnswer1, etc.
          </p>
        </div>

        <div className="grid gap-4">
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            className="neumorphic-input w-full cursor-pointer rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
          />
          <NeumorphicButton type="button" className="w-full" onClick={sendBulkInvites} disabled={isSending || isParsing || uploadedRows.length === 0}>
            {isSending ? "Sending bulk invites..." : "Process uploaded file"}
          </NeumorphicButton>
          {isParsing && <p className="text-sm text-[#475569] dark:text-[#94a3b8]">Parsing file... please wait.</p>}

          {uploadedRows.length > 0 && (
            <div className="rounded-3xl border border-white/90 bg-[#f0f4fb] p-4 shadow-[inset_4px_4px_10px_#c1c7d0] dark:border-slate-700 dark:bg-[#111827]">
              <p className="text-sm font-semibold text-[#111827] dark:text-[#f8fafc]">Preview rows</p>
              <p className="mt-2 text-xs text-[#64748b] dark:text-[#94a3b8]">Showing first 5 parsed rows from the upload.</p>
              <div className="mt-4 grid gap-3">
                {uploadedRows.slice(0, 5).map((row, index) => (
                  <div key={index} className="rounded-3xl bg-white p-4 text-sm text-[#0f172a] shadow-[inset_4px_4px_10px_#c1c7d0] dark:bg-[#0f172a] dark:text-[#f8fafc]">
                    <div className="grid gap-1 sm:grid-cols-2">
                      <span className="font-semibold">{row.fullName || "Missing name"}</span>
                      <span>{row.officialEmail || "Missing email"}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#475569] dark:text-[#94a3b8]">Primary phone: {row.primaryPhone || "Missing"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadResults.length > 0 && (
            <div className="rounded-3xl border border-white/90 bg-[#f0f4fb] p-4 shadow-[inset_4px_4px_10px_#c1c7d0] dark:border-slate-700 dark:bg-[#111827]">
              <p className="text-sm font-semibold text-[#111827] dark:text-[#f8fafc]">Upload results</p>
              <div className="mt-3 grid gap-2">
                {uploadResults.map((result) => (
                  <div key={`${result.email}-${result.message}`} className={`rounded-3xl p-3 text-sm ${result.success ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
                    <div className="font-semibold">{result.email || "Unknown email"}</div>
                    <div>{result.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </NeumorphicCard>
    </div>
  );
}
