"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import api from "../lib/api";
import { NeumorphicButton } from "./NeumorphicButton";
import { NeumorphicCard } from "./NeumorphicCard";
import { StepProgress } from "./StepProgress";
import { ThemeToggle } from "./ThemeToggle";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otpCode: z.string().min(6).max(6),
  totpCode: z.string().optional(),
  captchaToken: z.string().min(1),
  acceptTerms: z.boolean(),
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

export function LoginForm() {
  const [otpRequested, setOtpRequested] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "phone">("email");
  const [captchaQuestion, setCaptchaQuestion] = useState({ question: "", answer: "" });
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    resetCaptcha();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      otpCode: "",
      totpCode: "",
      captchaToken: "",
      acceptTerms: false,
    },
  });

  const email = watch("email");
  const password = watch("password");
  const otpCode = watch("otpCode");
  const acceptTerms = watch("acceptTerms");

  const resetCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    setCaptchaQuestion({ question: `${a} + ${b} = ?`, answer: `${a + b}` });
    setCaptchaInput("");
    setCaptchaReady(true);
  };

  const fetchCsrfToken = async () => {
    const response = await api.get("/auth/csrf-token");
    return response.data?.csrfToken;
  };

  const requestOtp = async () => {
    if (!captchaReady) {
      toast.error("Please wait for the captcha to load.");
      return;
    }

    if (!email || !password) {
      toast.error("Enter email and password before requesting OTP.");
      return;
    }

    if (!acceptTerms) {
      toast.error("Accept the terms before requesting OTP.");
      return;
    }

    if (captchaInput.trim() !== captchaQuestion.answer) {
      toast.error("Captcha answer is incorrect.");
      resetCaptcha();
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
      toast.success(response.data.message || "OTP requested successfully.");
      setValue("captchaToken", "human-verified");
      setOtpRequested(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "OTP request failed.");
      resetCaptcha();
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (!otpRequested) {
      toast.error("Request an OTP before signing in.");
      return;
    }

    try {
      setIsLoggingIn(true);
      const csrfToken = await fetchCsrfToken();
      const response = await api.post(
        "/auth/login",
        values,
        { headers: { "X-CSRF-Token": csrfToken } },
      );
      toast.success("Login successful");
      console.log(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <NeumorphicCard className="max-w-xl w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#4b5563]">Super Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#111827]">Secure sign in</h1>
        </div>
        <ThemeToggle />
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="space-y-2 text-sm text-[#334155]">
          <span>Official email</span>
          <input className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("email")} />
          <span className="text-xs text-red-500">{errors.email?.message as string}</span>
        </label>
        <label className="space-y-2 text-sm text-[#334155]">
          <span>Password</span>
          <input type="password" className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("password")} />
          <span className="text-xs text-red-500">{errors.password?.message as string}</span>
        </label>
        <div className="rounded-3xl border border-white/90 bg-[#f0f4fb] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
          <p className="text-sm font-medium text-[#334155]">Step 1: Solve captcha</p>
          <p className="mt-2 text-lg text-[#111827]">
            {captchaReady ? captchaQuestion.question : "Loading captcha..."}
          </p>
          <input
            value={captchaInput}
            onChange={(event) => setCaptchaInput(event.target.value)}
            className="mt-3 w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
            placeholder="Enter the result"
          />
        </div>
        <fieldset className="rounded-3xl border border-white/90 bg-[#f0f4fb] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
          <legend className="text-sm font-medium text-[#334155]">Delivery method</legend>
          <div className="mt-3 flex flex-col gap-3">
            {(["email", "phone"] as Array<"email" | "phone">).map((method) => (
              <label key={method} className="flex items-center gap-3 text-sm text-[#334155]">
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
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <NeumorphicButton type="button" className="w-full" onClick={requestOtp} disabled={isRequestingOtp || !captchaReady}>
            {otpRequested ? "Resend OTP" : "Request OTP"}
          </NeumorphicButton>
          <NeumorphicButton type="submit" className="w-full" disabled={isLoggingIn || !otpRequested}>
            Sign in
          </NeumorphicButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-[#334155]">
            <span>OTP code</span>
            <input className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("otpCode")} />
            <span className="text-xs text-red-500">{errors.otpCode?.message as string}</span>
          </label>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>TOTP code (optional)</span>
            <input className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("totpCode")} />
          </label>
        </div>
        <input type="hidden" {...register("captchaToken")} />
        <label className="flex items-center gap-3 text-sm text-[#334155]">
          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#3549ff] focus:ring-[#3549ff]" {...register("acceptTerms")} />
          <span>Accept terms, conditions and CAPTCHA</span>
        </label>
      </form>
    </NeumorphicCard>
  );
}

const govtIdOptions = [
  { label: "Passport", value: "Passport" },
  { label: "Driver's License", value: "Driver's License" },
  { label: "National ID", value: "National ID" },
  { label: "Voter ID", value: "Voter ID" },
  { label: "Residence Permit", value: "Residence Permit" },
];

export function SignupWizard() {
  const steps = ["Basic info", "Contact verification", "Security", "Recovery", "2FA", "Review"];
  const [step, setStep] = useState(0);
  const [payload, setPayload] = useState<any>({ identity: {}, contact: {}, security: {}, advanced: {} });
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [govtIdFile, setGovtIdFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");

  const identityForm = useForm<z.infer<typeof identitySchema>>({
    resolver: zodResolver(identitySchema),
    defaultValues: { fullName: "", dob: "", govtIdType: "" },
  });
  const { register: registerIdentity, handleSubmit: handleIdentitySubmit, formState: { errors: identityErrors } } = identityForm;

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

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10).toUpperCase());
    setBackupCodes(codes);
    setBackupConfirmed(false);
    return codes;
  };

  const goNext = (section: string, data: any) => {
    const nextPayload = { ...data };
    if (section === "identity") {
      nextPayload.govtIdFile = govtIdFile;
      nextPayload.profilePhotoFile = photoFile;
    }
    setPayload((current: any) => ({ ...current, [section]: nextPayload }));
    setStep((current) => current + 1);
  };

const submitSignup = async () => {
  if (!captchaReady || captchaInput.trim() !== captchaAnswer) {
    toast.error("Please solve the CAPTCHA before submitting.");
    resetCaptcha();
    return;
  }

  const identity = payload.identity || {};
  const contact = payload.contact || {};
  const security = payload.security || {};
  const advanced = payload.advanced || {};

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
      backupCodes,
      ipWhitelist: advanced.ipWhitelist
        ? advanced.ipWhitelist.split(",").map((ip: string) => ip.trim()).filter(Boolean)
        : [],
    },
  };

  if (!acceptedTerms) {
    toast.error("Accept the terms to create an account.");
    return;
  }

  try {
    setIsSubmitting(true);

    // ✅ NO CSRF HERE
    const response = await api.post("/auth/signup", signupPayload);

    setSignupComplete(true);
    setCreatedEmail(contact.officialEmail || "");

    // ✅ Upload Govt ID (NO CSRF)
    if (govtIdFile) {
      const idForm = new FormData();
      idForm.append("email", contact.officialEmail);
      idForm.append("govtIdType", identity.govtIdType);
      idForm.append("govtIdFile", govtIdFile);

      await api.post("/auth/upload-id", idForm, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    // ✅ Upload Profile Photo (NO CSRF)
    if (photoFile) {
      const photoForm = new FormData();
      photoForm.append("email", contact.officialEmail);
      photoForm.append("profilePhotoFile", photoFile);

      await api.post("/auth/upload-profile-photo", photoForm, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    toast.success("Account created. Check your email for OTP.");
    setStep(5);

  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Signup failed.");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <NeumorphicCard className="max-w-3xl w-full">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#4b5563]">Super Admin onboarding</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#111827]">Secure multi-step signup</h2>
        </div>
        <ThemeToggle />
      </div>
      <StepProgress steps={steps} current={step} />

      {signupComplete ? (
        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/90 bg-[#f0f4fb] p-8 shadow-[inset_8px_8px_16px_#c1c7d0,inset_-8px_-8px_16px_#ffffff]">
            <h3 className="text-2xl font-semibold text-[#111827]">Account created successfully</h3>
            <p className="mt-3 text-sm text-[#475569]">
              Your account has been created for <strong>{createdEmail}</strong>. An OTP has been sent to your official email and phone if configured.
            </p>
            <p className="mt-4 text-sm text-[#334155]">
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
            <h3 className="text-2xl font-semibold text-[#111827]">Basic info</h3>
            <p className="mt-2 text-sm text-[#475569]">Start with your identity details before verification.</p>
          </div>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>Full name</span>
            <input
              type="text"
              {...registerIdentity("fullName")}
              className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{identityErrors.fullName?.message as string}</span>
          </label>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>Date of birth</span>
            <input
              type="date"
              {...registerIdentity("dob")}
              className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{identityErrors.dob?.message as string}</span>
          </label>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>Government ID type</span>
            <div className="relative">
              <select
                {...registerIdentity("govtIdType")}
                className="w-full appearance-none rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 pr-10 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                required
              >
                <option value="">Select an ID type</option>
                {govtIdOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]">▾</span>
            </div>
            <span className="text-xs text-red-500">{identityErrors.govtIdType?.message as string}</span>
          </label>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>Upload government ID</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setGovtIdFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
            />
            {govtIdFile && <p className="text-xs text-[#334155]">Selected file: {govtIdFile.name}</p>}
          </label>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>Upload profile photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
            />
            {photoFile && <p className="text-xs text-[#334155]">Selected file: {photoFile.name}</p>}
          </label>
          <div className="flex items-center justify-between gap-4">
            <button type="button" disabled className="cursor-not-allowed rounded-3xl bg-[#e6ebf2] px-6 py-3 text-sm text-[#94a3b8] shadow-[inset_4px_4px_10px_#c1c7d0]">Back</button>
            <NeumorphicButton type="submit" className="w-full">Continue</NeumorphicButton>
          </div>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={contactForm.handleSubmit((data) => goNext("contact", data))} className="grid gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#111827]">Contact verification</h3>
            <p className="mt-2 text-sm text-[#475569]">Enter email and phone details for mandatory OTP verification.</p>
          </div>
          {[
            { label: "Official email", name: "officialEmail", type: "email" },
            { label: "Personal email", name: "personalEmail", type: "email" },
            { label: "Primary phone", name: "primaryPhone", type: "tel" },
            { label: "Secondary phone", name: "secondaryPhone", type: "tel" },
          ].map((field) => (
            <label key={field.name} className="space-y-2 text-sm text-[#334155]">
              <span>{field.label}</span>
              <input
                type={field.type}
                {...registerContact(field.name as any)}
                className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                required={field.name !== "secondaryPhone"}
              />
              <span className="text-xs text-red-500">{(contactErrors as any)[field.name]?.message as string}</span>
            </label>
          ))}
          <div className="grid gap-4 rounded-3xl border border-white/90 bg-[#f0f4fb] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-medium text-[#334155]">Email OTP</p>
                <p className="mt-1 text-sm text-[#64748b]">OTP codes are generated automatically when the account is created. Verify them on the OTP confirmation page.</p>
              </div>
              <NeumorphicButton type="button" className="w-full cursor-not-allowed opacity-70" disabled>OTP after signup</NeumorphicButton>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-medium text-[#334155]">Phone OTP</p>
                <p className="mt-1 text-sm text-[#64748b]">A code is delivered to your primary phone after signup is complete.</p>
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
            <h3 className="text-2xl font-semibold text-[#111827]">Security</h3>
            <p className="mt-2 text-sm text-[#475569]">Use a strong password and recovery questions.</p>
          </div>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>Password</span>
            <input
              type="password"
              {...registerSecurity("password")}
              className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{securityErrors.password?.message as string}</span>
            <p className="text-xs text-[#64748b]">Minimum 12 chars, 1 uppercase, 1 number, 1 special character.</p>
          </label>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>Confirm password</span>
            <input
              type="password"
              {...registerSecurity("confirmPassword")}
              className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{securityErrors.confirmPassword?.message as string}</span>
          </label>
          {Array.from({ length: 3 }, (_, index) => {
            const questionKey = `question${index + 1}` as "question1" | "question2" | "question3";
            const answerKey = `answer${index + 1}` as "answer1" | "answer2" | "answer3";
            return (
              <div key={index} className="grid gap-3 rounded-3xl border border-white/90 bg-[#f0f4fb] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
                <p className="text-sm font-medium text-[#334155]">Security question {index + 1}</p>
                <label className="space-y-2 text-sm text-[#334155]">
                  <span>Question</span>
                  <input
                    type="text"
                    {...registerSecurity(questionKey)}
                    className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                    required
                  />
                  <span className="text-xs text-red-500">{(securityErrors as any)[questionKey]?.message as string}</span>
                </label>
                <label className="space-y-2 text-sm text-[#334155]">
                  <span>Answer</span>
                  <input
                    type="text"
                    {...registerSecurity(answerKey)}
                    className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                    required
                  />
                  <span className="text-xs text-red-500">{(securityErrors as any)[answerKey]?.message as string}</span>
                </label>
              </div>
            );
          })}
          <div className="rounded-3xl border border-white/90 bg-[#f0f4fb] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <p className="text-sm font-medium text-[#334155]">Simple CAPTCHA</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="rounded-3xl bg-white p-4 text-sm text-[#111827] shadow-[inset_4px_4px_10px_#c1c7d0]">{captchaQuestion}</div>
              <input
                type="text"
                value={captchaInput}
                onChange={(event) => setCaptchaInput(event.target.value)}
                placeholder="Enter result"
                className="rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              />
            </div>
            <p className="mt-3 text-xs text-[#64748b]">This quick math check keeps bots out.</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(1)}>Back</NeumorphicButton>
            <NeumorphicButton type="submit" className="w-full">Continue</NeumorphicButton>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={recoveryForm.handleSubmit((data) => {
          setPayload((current: any) => ({ ...current, advanced: { ...current.advanced, ...data } }));
          if (backupCodes.length === 0) {
            generateBackupCodes();
          }
          setStep(4);
        })} className="grid gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#111827]">Recovery setup</h3>
            <p className="mt-2 text-sm text-[#475569]">Capture alternate recovery channels and backup codes.</p>
          </div>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>Alternate email</span>
            <input
              type="email"
              {...registerRecovery("alternateEmail")}
              className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{recoveryErrors.alternateEmail?.message as string}</span>
          </label>
          <label className="space-y-2 text-sm text-[#334155]">
            <span>Alternate phone number</span>
            <input
              type="tel"
              {...registerRecovery("alternatePhone")}
              className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
              required
            />
            <span className="text-xs text-red-500">{recoveryErrors.alternatePhone?.message as string}</span>
          </label>
          <div className="rounded-3xl border border-white/90 bg-[#f0f4fb] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#111827]">Recovery codes</p>
              <button type="button" onClick={generateBackupCodes} className="rounded-3xl border border-[#cbd5e1] px-4 py-2 text-sm text-[#334155] transition hover:bg-[#e2e8f0]">Generate codes</button>
            </div>
            {backupCodes.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {backupCodes.map((code) => (
                  <div key={code} className="rounded-2xl bg-white px-4 py-3 text-sm text-[#111827] shadow-[inset_4px_4px_10px_#c1c7d0]">{code}</div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#64748b]">Generate 8 backup codes and store them securely. Each code is 8 characters long.</p>
            )}
            <label className="mt-4 flex items-center gap-3 text-sm text-[#334155]">
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
            <h3 className="text-2xl font-semibold text-[#111827]">Google Authenticator</h3>
            <p className="mt-2 text-sm text-[#475569]">Enable 2FA after signup for the strongest protection.</p>
          </div>
          <div className="rounded-3xl border border-white/90 bg-[#f0f4fb] p-6 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <p className="text-sm font-medium text-[#334155]">Step 1</p>
            <p className="mt-2 text-sm text-[#334155]">Install Google Authenticator or Authy on your device.</p>
            <div className="mt-4 rounded-3xl border border-[#dbe0ea] bg-white p-4 text-sm text-[#334155]">
              <p className="font-semibold text-[#111827]">Step 2</p>
              <p className="mt-2">After signup, scan the QR code in the authenticator setup page and verify your 6-digit code.</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(3)}>Back</NeumorphicButton>
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(5)}>Continue</NeumorphicButton>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="grid gap-6">
          <div>
            <h3 className="text-2xl font-semibold text-[#111827]">Review & submit</h3>
            <p className="mt-2 text-sm text-[#475569]">Confirm the information and accept terms before account creation.</p>
          </div>
          <div className="grid gap-4 rounded-3xl border border-white/90 bg-[#f0f4fb] p-6 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <SummaryItem title="Name" value={payload.identity.fullName || "-"} />
            <SummaryItem title="Official email" value={payload.contact.officialEmail || "-"} />
            <SummaryItem title="Primary phone" value={payload.contact.primaryPhone || "-"} />
            <SummaryItem title="Alternate email" value={payload.advanced.alternateEmail || "-"} />
            <SummaryItem title="Recovery codes" value={`${backupCodes.length} codes generated`} />
            <SummaryItem title="2FA" value="Google Authenticator after signup" />
          </div>
          <div className="rounded-3xl border border-white/90 bg-[#f0f4fb] p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
            <label className="flex items-center gap-3 text-sm text-[#334155]">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#3549ff] focus:ring-[#3549ff]" />
              <span>I agree to the Terms & Conditions and Privacy Policy.</span>
            </label>
          </div>
          <div className="flex items-center justify-between gap-4">
            <NeumorphicButton type="button" className="w-full" onClick={() => setStep(4)}>Back</NeumorphicButton>
            <NeumorphicButton type="button" className="w-full" onClick={submitSignup} disabled={isSubmitting || !acceptedTerms}>{isSubmitting ? "Creating account..." : "Create account"}</NeumorphicButton>
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
    <div className="rounded-3xl bg-white px-4 py-4 shadow-[inset_4px_4px_10px_#c1c7d0]">
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">{title}</p>
      <p className="mt-2 text-sm text-[#111827]">{value}</p>
    </div>
  );
}
