"use client";

import { SignupWizard } from "../components/auth-forms";
import { ToasterClient } from "../components/ToasterClient";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl">
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Create a Super Admin</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#111827] dark:text-[#f8fafc]">Modern onboarding with full 2FA protection</h1>
          </div>
          <SignupWizard />
        </div>
      </div>
      <ToasterClient />
    </main>
  );
}
