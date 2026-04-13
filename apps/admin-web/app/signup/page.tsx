"use client";

import { SignupWizard } from "../components/auth-forms";
import { ToasterClient } from "../components/ToasterClient";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827]">
      <div className="mx-auto max-w-6xl">
        <SignupWizard />
      </div>
      <ToasterClient />
    </main>
  );
}
