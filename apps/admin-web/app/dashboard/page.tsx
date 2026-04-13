"use client";

import { useEffect, useState } from "react";
import { NeumorphicCard } from "../components/NeumorphicCard";

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setUser({ name: "Super Admin", email: "admin@lms.example" });
  }, []);

  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827]">
      <div className="mx-auto max-w-5xl">
        <NeumorphicCard>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#4b5563]">Dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold text-[#111827]">Secure admin control center</h1>
            </div>
            <div className="rounded-3xl bg-[#e6ebf2] px-5 py-3 text-sm text-[#475569] shadow-[inset_5px_5px_12px_#c1c7d0,inset_-5px_-5px_12px_#ffffff]">
              Status: Active
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/80 bg-[#f8fbff] p-6 shadow-[8px_8px_18px_#d0d8e6,-8px_-8px_18px_#ffffff]">
              <p className="text-sm uppercase tracking-[0.3em] text-[#64748b]">User</p>
              <p className="mt-3 text-xl font-semibold text-[#0f172a]">{user?.name}</p>
              <p className="text-sm text-[#475569]">{user?.email}</p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-[#f8fbff] p-6 shadow-[8px_8px_18px_#d0d8e6,-8px_-8px_18px_#ffffff]">
              <p className="text-sm uppercase tracking-[0.3em] text-[#64748b]">Security</p>
              <ul className="mt-3 space-y-3 text-sm text-[#475569]">
                <li>JWT session active</li>
                <li>OTP enabled</li>
                <li>IP whitelist enforced</li>
              </ul>
            </div>
          </div>
        </NeumorphicCard>
      </div>
    </main>
  );
}
