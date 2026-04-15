"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import api from "../lib/api";
import { NeumorphicCard } from "../components/NeumorphicCard";
import { NeumorphicButton } from "../components/NeumorphicButton";
import { ToasterClient } from "../components/ToasterClient";

const verifySchema = z.object({
  email: z.string().email(),
  otpCode: z.string().min(6).max(6),
});

type VerifyForm = z.infer<typeof verifySchema>;

export default function VerifyOtpPage() {
  const { register, handleSubmit, formState } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: "", otpCode: "" },
  });

  const onSubmit = async (values: VerifyForm) => {
    try {
      await api.post("/auth/verify-otp", values);
      toast.success("OTP verified successfully. You may now login.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Verification failed.");
    }
  };

  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <NeumorphicCard>
            <div className="mb-6 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">OTP verification</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">Confirm your phone and email OTP</h1>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Official email</span>
                <input className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("email")} />
              </label>
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>OTP code</span>
                <input className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("otpCode")} />
              </label>
              <NeumorphicButton type="submit" className="w-full">Verify OTP</NeumorphicButton>
            </form>
          </NeumorphicCard>
        </div>
      </div>
      <ToasterClient />
    </main>
  );
}
