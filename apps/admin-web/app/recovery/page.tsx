"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import api from "../lib/api";
import { NeumorphicCard } from "../components/NeumorphicCard";
import { NeumorphicButton } from "../components/NeumorphicButton";
import { ToasterClient } from "../components/ToasterClient";

const recoverySchema = z.object({
  email: z.string().email(),
  method: z.enum(["securityQuestions", "backupCodes", "magicLink", "govtId"]),
  backupCode: z.string().optional(),
  alternateEmail: z.string().email().optional(),
  govtIdType: z.string().optional(),
  govtIdNumber: z.string().optional(),
});

type RecoveryForm = z.infer<typeof recoverySchema>;

export default function RecoveryPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"securityQuestions" | "backupCodes" | "magicLink" | "govtId">("securityQuestions");
  const { register, handleSubmit } = useForm<RecoveryForm>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: "",
      method: "securityQuestions",
      backupCode: "",
      alternateEmail: "",
      govtIdType: "",
      govtIdNumber: "",
    },
  });

  const onSubmit = async (values: RecoveryForm) => {
    try {
      const response = await api.post("/auth/recover", values);
      toast.success(response.data.message || "Recovery step accepted.");

      if (values.method === "govtId" && response.data?.accessToken) {
        sessionStorage.setItem("lms.accessToken", response.data.accessToken);
        sessionStorage.setItem("lms.refreshToken", response.data.refreshToken ?? "");
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Recovery failed.");
    }
  };

  return (
    <main className="min-h-screen bg-[#e6e8ee] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <NeumorphicCard>
            <div className="mb-6 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Account recovery</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">Choose a secure recovery option</h1>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Email</span>
                <input className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("email")} />
              </label>
              <div className="grid gap-3 sm:grid-cols-4">
                {(["securityQuestions", "backupCodes", "magicLink", "govtId"] as const).map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setMethod(option)}
                    className={`rounded-3xl border px-4 py-3 text-sm transition ${method === option ? "border-[#3549ff] bg-[#dfe8ff] text-[#1f2937] dark:bg-[#2b3a54] dark:text-[#f8fafc]" : "border-white/80 bg-[#e6ebf2] text-[#475569] dark:border-white/10 dark:bg-[#1f2937] dark:text-[#cbd5e1]"}`}
                  >
                    {option === "securityQuestions"
                      ? "Questions"
                      : option === "backupCodes"
                      ? "Backup code"
                      : option === "magicLink"
                      ? "Magic link"
                      : "Govt ID"}
                  </button>
                ))}
              </div>
              <input type="hidden" value={method} {...register("method")} />
              {method === "backupCodes" && (
                <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                  <span>Recovery code</span>
                  <input className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("backupCode")} />
                </label>
              )}
              {method === "magicLink" && (
                <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                  <span>Alternate email</span>
                  <input className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("alternateEmail")} />
                </label>
              )}
              {method === "govtId" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                    <span>Government ID type</span>
                    <div className="relative">
                      <select
                        {...register("govtIdType")}
                        className="neumorphic-input w-full appearance-none rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 pr-10 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff] dark:border-slate-700 dark:bg-[#1f2937] dark:text-[#f8fafc]"
                      >
                        <option value="">Select ID type</option>
                        <option value="aadhaar">Aadhaar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                        <option value="voter_id">Voter ID</option>
                      </select>
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]">▾</span>
                    </div>
                  </label>
                  <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                    <span>ID number</span>
                    <input
                      className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                      {...register("govtIdNumber")}
                      placeholder="Enter your government ID number"
                    />
                  </label>
                </div>
              )}
              <NeumorphicButton type="submit" className="w-full">Start recovery</NeumorphicButton>
            </form>
          </NeumorphicCard>
        </div>
      </div>
      <ToasterClient />
    </main>
  );
}
