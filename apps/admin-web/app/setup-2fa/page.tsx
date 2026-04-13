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

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type SetupForm = z.infer<typeof setupSchema>;

export default function Setup2FaPage() {
  const [qrData, setQrData] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const { register, handleSubmit } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SetupForm) => {
    try {
      const response = await api.post("/auth/setup-2fa", values);
      setQrData(response.data.otpauthUrl);
      setBackupCodes(response.data.backupCodes || []);
      toast.success("2FA initialized. Scan the QR code with your authenticator app.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "2FA setup failed.");
    }
  };

  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827]">
      <div className="mx-auto max-w-3xl">
        <NeumorphicCard>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.35em] text-[#4b5563]">Authenticator setup</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#111827]">Enable TOTP for your Super Admin account</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
            <label className="space-y-2 text-sm text-[#334155]">
              <span>Official email</span>
              <input className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("email")} />
            </label>
            <label className="space-y-2 text-sm text-[#334155]">
              <span>Password</span>
              <input type="password" className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]" {...register("password")} />
            </label>
            <NeumorphicButton type="submit" className="w-full">Generate QR code</NeumorphicButton>
          </form>

          {qrData && (
            <div className="mt-8 rounded-3xl border border-white/80 bg-[#f0f4fb] p-6 shadow-[inset_8px_8px_16px_#c1c7d0,inset_-8px_-8px_16px_#ffffff]">
              <p className="mb-4 text-sm font-semibold text-[#1e293b]">Scan this QR code from your authenticator app</p>
              <div className="overflow-auto rounded-3xl border border-[#dbe0ea] bg-white p-4">
                <pre className="whitespace-pre-wrap break-words text-xs text-[#334155]">{qrData}</pre>
              </div>
              {backupCodes.length > 0 && (
                <div className="mt-5 rounded-3xl border border-[#e2e8f0] bg-[#e6ebf2] p-4 text-sm text-[#334155]">
                  <p className="mb-3 font-semibold text-[#111827]">Backup codes</p>
                  <ul className="grid gap-2">
                    {backupCodes.map((code) => (
                      <li key={code} className="rounded-2xl bg-white px-4 py-3 shadow-[inset_4px_4px_10px_#c1c7d0]">
                        {code}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </NeumorphicCard>
      </div>
      <ToasterClient />
    </main>
  );
}
