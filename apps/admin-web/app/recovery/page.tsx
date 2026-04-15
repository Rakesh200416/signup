"use client";

import { useState } from "react";
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
  method: z.enum(["securityQuestions", "backupCodes", "magicLink"]),
  backupCode: z.string().optional(),
  alternateEmail: z.string().email().optional(),
});

type RecoveryForm = z.infer<typeof recoverySchema>;

export default function RecoveryPage() {
  const [method, setMethod] = useState<"securityQuestions" | "backupCodes" | "magicLink">("securityQuestions");
  const { register, handleSubmit } = useForm<RecoveryForm>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: "", method: "securityQuestions", backupCode: "", alternateEmail: "" },
  });

  const onSubmit = async (values: RecoveryForm) => {
    try {
      const response = await api.post("/auth/recover", values);
      toast.success(response.data.message || "Recovery step accepted.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Recovery failed.");
    }
  };

  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]">
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
              <div className="grid gap-3 sm:grid-cols-3">
                {(["securityQuestions", "backupCodes", "magicLink"] as const).map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setMethod(option)}
                    className={`rounded-3xl border px-4 py-3 text-sm transition ${method === option ? "border-[#3549ff] bg-[#dfe8ff] text-[#1f2937] dark:bg-[#2b3a54] dark:text-[#f8fafc]" : "border-white/80 bg-[#e6ebf2] text-[#475569] dark:border-white/10 dark:bg-[#1f2937] dark:text-[#cbd5e1]"}`}
                  >
                    {option === "securityQuestions" ? "Questions" : option === "backupCodes" ? "Backup code" : "Magic link"}
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
              <NeumorphicButton type="submit" className="w-full">Start recovery</NeumorphicButton>
            </form>
          </NeumorphicCard>
        </div>
      </div>
      <ToasterClient />
    </main>
  );
}
