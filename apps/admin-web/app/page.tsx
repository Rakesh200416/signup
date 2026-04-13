"use client";

import { LoginForm } from "./components/auth-forms";
import { ToasterClient } from "./components/ToasterClient";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="rounded-[2rem] border border-white/80 bg-[#e6ebf2] p-8 shadow-[18px_18px_40px_#bec7d5,-18px_-18px_40px_#ffffff] backdrop-blur-xl">
          <div className="grid gap-4 sm:grid-cols-[1.8fr_1fr] sm:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#4b5563]">Super Admin portal</p>
              <h1 className="mt-3 text-4xl font-semibold text-[#111827]">Enterprise LMS access</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#475569]">
                High security onboarding for the global LMS super admin. Use strong multi-factor controls and secure every access point.
              </p>
            </div>
          </div>
        </div>
        <LoginForm />
      </div>
      <ToasterClient />
    </main>
  );
}
