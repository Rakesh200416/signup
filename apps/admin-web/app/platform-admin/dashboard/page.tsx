"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NeumorphicButton } from "../../components/NeumorphicButton";

export default function PlatformAdminDashboardPage() {
  const router = useRouter();
  const [resetPasswordClicked, setResetPasswordClicked] = useState(false);

  useEffect(() => {
    setResetPasswordClicked(sessionStorage.getItem("resetPasswordClicked") === "true");
  }, []);

  const handleResetPasswordClick = () => {
    sessionStorage.setItem("resetPasswordClicked", "true");
    setResetPasswordClicked(true);
    router.push("/reset-password");
  };

  return (
    <main className="min-h-screen bg-[#ecf4ff] px-6 py-10 text-[#0f172a] dark:bg-[#091524] dark:text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl space-y-8">
          <div className="rounded-[2rem] border border-white/80 bg-[#f8fbff] p-10 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#0f172a] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Platform admin</p>
                <h1 className="mt-2 text-4xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Platform Admin Dashboard</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#475569] dark:text-[#cbd5e1]">
                  This dashboard is reserved for platform admin workflows. It includes onboarding status, active tenant health, and quick action shortcuts.
                </p>
              </div>
              <div className="flex flex-col items-end gap-3 sm:items-end sm:gap-3">
                <button
                  type="button"
                  onClick={handleResetPasswordClick}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    resetPasswordClicked
                      ? "border-[#cbd5e1] bg-[#f8fbff] text-[#0f172a] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc]"
                      : "border-red-200 bg-red-50 text-red-700 shadow-[inset_2px_2px_6px_rgba(248,113,113,0.15)] hover:bg-red-100 dark:border-red-500/30 dark:bg-[#3b1820] dark:text-red-300"
                  }`}
                >
                  Reset password
                </button>
                <NeumorphicButton type="button" className="w-full sm:w-auto" onClick={() => router.push("/")}>Return to login</NeumorphicButton>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-white/80 bg-[#eef6ff] p-8 shadow-[20px_20px_40px_rgba(166,184,220,0.16),-20px_-20px_40px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[20px_20px_40px_rgba(0,0,0,0.3),-20px_-20px_40px_rgba(255,255,255,0.06)]">
              <h2 className="text-2xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Active tenant overview</h2>
              <p className="mt-3 text-sm text-[#475569] dark:text-[#cbd5e1]">Monitor tenant onboarding, platform usage, and alerts in a compact window.</p>
              <div className="mt-6 grid gap-4">
                <div className="rounded-[1.5rem] bg-white p-6 shadow-[inset_4px_4px_10px_#c1c7d0] dark:bg-[#17202c]">
                  <p className="text-sm uppercase tracking-[0.3em] text-[#64748b] dark:text-[#94a3b8]">Tenants</p>
                  <p className="mt-3 text-3xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">48 active</p>
                </div>
                <div className="rounded-[1.5rem] bg-white p-6 shadow-[inset_4px_4px_10px_#c1c7d0] dark:bg-[#17202c]">
                  <p className="text-sm uppercase tracking-[0.3em] text-[#64748b] dark:text-[#94a3b8]">Pending approvals</p>
                  <p className="mt-3 text-3xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">3</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/reset-password")}
                  className="rounded-[1.5rem] bg-[#eff6ff] px-6 py-5 text-left text-sm font-semibold text-[#0f172a] shadow-[inset_4px_4px_10px_#c1c7d0] dark:bg-[#17202c] dark:text-[#f8fafc] hover:-translate-y-0.5 transition"
                >
                  Reset your password
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-[#eef6ff] p-8 shadow-[20px_20px_40px_rgba(166,184,220,0.16),-20px_-20px_40px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[20px_20px_40px_rgba(0,0,0,0.3),-20px_-20px_40px_rgba(255,255,255,0.06)]">
              <h2 className="text-2xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Quick actions</h2>
              <ul className="mt-6 space-y-4 text-sm text-[#475569] dark:text-[#cbd5e1]">
                <li className="rounded-3xl bg-white p-4 shadow-[inset_4px_4px_10px_#c1c7d0] dark:bg-[#17202c]">Review platform alerts and incident reports.</li>
                <li className="rounded-3xl bg-white p-4 shadow-[inset_4px_4px_10px_#c1c7d0] dark:bg-[#17202c]">Approve new tenant access requests.</li>
                <li className="rounded-3xl bg-white p-4 shadow-[inset_4px_4px_10px_#c1c7d0] dark:bg-[#17202c]">Monitor sign-in security and OTP usage.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
