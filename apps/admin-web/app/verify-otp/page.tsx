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
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827]">
      <div className="mx-auto max-w-3xl">
        <NeumorphicCard>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.35em] text-[#4b5563]">OTP verification</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#111827]">Confirm your phone and email OTP</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
            <label className="space-y-2 text-sm text-[#334155]">
              <span>Official email</span>
              <input className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("email")} />
            </label>
            <label className="space-y-2 text-sm text-[#334155]">
              <span>OTP code</span>
              <input className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("otpCode")} />
            </label>
            <NeumorphicButton type="submit" className="w-full">Verify OTP</NeumorphicButton>
          </form>
        </NeumorphicCard>
      </div>
      <ToasterClient />
    </main>
  );
}
