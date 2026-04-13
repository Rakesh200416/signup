"use client";

import { useEffect, useState } from "react";
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

export function SignupWizard() {
  const steps = ["Identity", "Contact", "Security", "Advanced", "Approval"];
  const [step, setStep] = useState(0);
  const [payload, setPayload] = useState<any>({ identity: {}, contact: {}, security: {}, advanced: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepFields = [
    [
      { name: "fullName", label: "Full name", placeholder: "Jane government" },
      { name: "dob", label: "Date of birth", placeholder: "1990-12-31" },
      { name: "govtIdType", label: "ID type", placeholder: "Passport" },
      { name: "govtIdUrl", label: "Govt ID URL", placeholder: "https://..." },
      { name: "profilePhotoUrl", label: "Profile photo URL", placeholder: "https://..." },
    ],
  ];

  async function handleSubmitForm(values: any) {
    const nextPayload = { ...payload, [step === 0 ? "identity" : step === 1 ? "contact" : step === 2 ? "security" : "advanced"]: values };
    setPayload(nextPayload);
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/auth/signup", nextPayload);
      toast.success("Signup request created. Verify OTP to continue.");
      setStep(step + 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
      <div className="grid gap-6">
        {step === 0 && (
          <SignupStep
            title="Identity"
            fields={[
              { label: "Full name", name: "fullName", type: "text" },
              { label: "Date of birth", name: "dob", type: "date" },
              { label: "Government ID type", name: "govtIdType", type: "text" },
              { label: "Government ID URL", name: "govtIdUrl", type: "url" },
              { label: "Profile photo URL", name: "profilePhotoUrl", type: "url" },
            ]}
            onNext={handleSubmitForm}
          />
        )}
        {step === 1 && (
          <SignupStep
            title="Contact verification"
            fields={[
              { label: "Official email", name: "officialEmail", type: "email" },
              { label: "Personal email", name: "personalEmail", type: "email" },
              { label: "Primary phone", name: "primaryPhone", type: "tel" },
              { label: "Secondary phone", name: "secondaryPhone", type: "tel" },
            ]}
            onNext={handleSubmitForm}
          />
        )}
        {step === 2 && (
          <SignupStep
            title="Password & security"
            fields={[
              { label: "Password", name: "password", type: "password" },
              { label: "Confirm password", name: "confirmPassword", type: "password" },
            ]}
            extra={<p className="text-sm text-[#475569]">Secure password with at least 8 characters, uppercase, lowercase, digit and special character.</p>}
            onNext={handleSubmitForm}
          />
        )}
        {step === 3 && (
          <SignupStep
            title="Advanced security"
            fields={[
              { label: "Alternate email", name: "alternateEmail", type: "email" },
              { label: "IP whitelist (comma separated)", name: "ipWhitelist", type: "text" },
            ]}
            extra={<p className="text-sm text-[#475569]">This screen prepares backup channels, auth app, and whitelist rules.</p>}
            onNext={handleSubmitForm}
          />
        )}
        {step === 4 && (
          <div className="space-y-5">
            <p className="text-lg font-semibold text-[#111827]">Final approval pending</p>
            <p className="text-sm leading-7 text-[#475569]">A Super Admin account has been requested. Admin approval and OTP confirmation are required before activation.</p>
            <NeumorphicButton type="button" className="w-full">Finish signup</NeumorphicButton>
          </div>
        )}
      </div>
    </NeumorphicCard>
  );
}

function SignupStep({ title, fields, extra, onNext }: { title: string; fields: Array<{ label: string; name: string; type: string }>; extra?: React.ReactNode; onNext: (data: any) => Promise<void> }) {
  const { register, handleSubmit } = useForm<any>({ defaultValues: {} });
  return (
    <form onSubmit={handleSubmit(onNext)} className="grid gap-4">
      <div>
        <h3 className="text-2xl font-semibold text-[#111827]">{title}</h3>
        {extra && <p className="mt-2 text-sm text-[#475569]">{extra}</p>}
      </div>
      {fields.map((field) => (
        <label key={field.name} className="space-y-2 text-sm text-[#334155]">
          <span>{field.label}</span>
          <input
            type={field.type}
            {...register(field.name as any)}
            className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
          />
        </label>
      ))}
      <NeumorphicButton type="submit" className="w-full">Continue</NeumorphicButton>
    </form>
  );
}
