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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState("");
  const [verified, setVerified] = useState(false);
  const { register, handleSubmit, watch } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SetupForm) => {
    try {
      const response = await api.post("/auth/setup-2fa", values);
      setQrCodeDataUrl(response.data.qrCodeDataUrl || "");
      setOtpauthUrl(response.data.otpauthUrl || "");
      setBackupCodes(response.data.backupCodes || []);
      setVerified(false);
      toast.success("2FA setup initialized. Scan the QR code with your authenticator app.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "2FA setup failed.");
    }
  };

  const onVerify = async () => {
    try {
      const values = watch();
      await api.post("/auth/setup-2fa", { ...values, totpCode });
      setVerified(true);
      toast.success("Authenticator code verified successfully.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Authenticator verification failed.");
    }
  };

  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          <NeumorphicCard>
            <div className="mb-8 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Authenticator setup</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#111827] dark:text-[#f8fafc]">Enable TOTP for your Super Admin account</h1>
              <p className="mt-2 text-sm text-[#475569] dark:text-[#cbd5e1]">Secure your sign-in flow with Google Authenticator or any TOTP-compatible app.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Official email</span>
                <input
                  className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                  {...register("email")}
                />
              </label>

              <label className="space-y-2 text-sm text-[#334155] dark:text-[#cbd5e1]">
                <span>Password</span>
                <input
                  type="password"
                  className="neumorphic-input w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8ec9ff]"
                  {...register("password")}
                />
              </label>

              <NeumorphicButton type="submit" className="w-full">Generate QR code</NeumorphicButton>
            </form>

            {qrCodeDataUrl && (
              <section className="mt-8 space-y-6 rounded-3xl border border-white/80 bg-[#f0f4fb] p-6 shadow-[inset_8px_8px_16px_#c1c7d0,inset_-8px_-8px_16px_#ffffff] dark:border-slate-700 dark:bg-[#111827]">
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#1e293b] dark:text-[#cbd5e1]">Scan this QR code from your authenticator app</p>
                  <div className="rounded-3xl border border-[#dbe0ea] bg-white p-4 shadow-[inset_2px_2px_6px_#c1c7d0] dark:border-slate-700 dark:bg-[#0f172a]">
                    <img src={qrCodeDataUrl} alt="Authenticator QR code" className="mx-auto max-w-full" />
                  </div>
                </div>

                {otpauthUrl && (
                  <div className="rounded-3xl border border-[#dbe0ea] bg-[#f8fafc] p-4 text-xs text-[#334155] dark:border-slate-700 dark:bg-[#0f172a] dark:text-[#cbd5e1]">
                    <p className="font-semibold text-[#111827] dark:text-[#f8fafc]">Manual setup key</p>
                    <p className="mt-2 break-words">{otpauthUrl}</p>
                  </div>
                )}

                <div className="rounded-3xl border border-[#dbe0ea] bg-[#f8fafc] p-4 text-sm text-[#334155] dark:border-slate-700 dark:bg-[#0f172a] dark:text-[#cbd5e1]">
                  <p className="font-semibold text-[#111827] dark:text-[#f8fafc]">Next step</p>
                  <p className="mt-2">After scanning the QR code, enter the 6-digit code from your authenticator app to verify setup.</p>

                  <label className="mt-4 block space-y-2">
                    <span>Authenticator code</span>
                    <input
                      type="text"
                      value={totpCode}
                      onChange={(event) => setTotpCode(event.target.value)}
                      className="w-full rounded-3xl border border-white/90 bg-[#e6ebf2] px-4 py-3 text-sm text-[#111827] shadow-[inset_6px_6px_12px_#c1c7d0,inset_-6px_-6px_12px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#8ec9ff] dark:border-slate-600 dark:bg-[#1e293b] dark:text-[#f8fafc]"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </label>

                  <NeumorphicButton type="button" className="mt-4 w-full" onClick={onVerify}>
                    Verify code
                  </NeumorphicButton>

                  {verified && (
                    <div className="mt-4 rounded-3xl border border-[#22c55e] bg-[#ecfdf5] p-4 text-sm text-[#166534] dark:border-emerald-500 dark:bg-[#052e16] dark:text-[#bbf7d0]">
                      <p className="font-semibold">Authenticator code verified.</p>
                      <p className="mt-2">Two-factor authentication is enabled for your account.</p>
                    </div>
                  )}
                </div>

                {backupCodes.length > 0 && (
                  <div className="rounded-3xl border border-[#e2e8f0] bg-[#e6ebf2] p-4 text-sm text-[#334155] dark:border-slate-700 dark:bg-[#0f172a] dark:text-[#cbd5e1]">
                    <p className="mb-3 font-semibold text-[#111827] dark:text-[#f8fafc]">Backup codes</p>
                    <ul className="grid gap-2">
                      {backupCodes.map((code) => (
                        <li key={code} className="rounded-2xl bg-white px-4 py-3 shadow-[inset_4px_4px_10px_#c1c7d0] dark:bg-[#1e293b]">
                          {code}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </NeumorphicCard>
        </div>
      </div>
      <ToasterClient />
    </main>
  );
}
