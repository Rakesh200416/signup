"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PlatformAdminInviteForm } from "../../components/platform-admin-invite-form";
import { ToasterClient } from "../../components/ToasterClient";

export default function PlatformAdminSignupPage() {
  useEffect(() => {
    document.title = "Platform Admin Signup | NeuroLXP";
  }, []);

  return (
    <main className="min-h-screen bg-[#e6e7ee] px-4 py-10 text-[#273457]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center px-4">
        <div className="w-full">
          <div className="mb-8 rounded-[2rem] border border-white/80 bg-[#eef6ff] p-6 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] backdrop-blur-xl dark:border-white/10 dark:bg-[#14232d] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
            <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#475569] dark:text-[#94a3b8]">
              <Link href="/dashboard" className="rounded-full border border-white/80 bg-white px-4 py-2 text-[#1f2937] shadow-[6px_6px_12px_rgba(177,190,204,0.25),-6px_-6px_12px_rgba(255,255,255,0.95)] transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#111827] dark:text-[#f8fafc]">
                Dashboard
              </Link>
              <span className="text-[#94a3b8]">/</span>
              <span className="rounded-full border border-white/80 bg-[#f8fbff] px-4 py-2 text-[#243457] shadow-[inset_4px_4px_10px_rgba(177,190,204,0.25),inset_-4px_-4px_10px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#1f2937] dark:text-[#93c5fd]">
                Add platform admin
              </span>
            </nav>
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-[#5c6d94] dark:text-[#94a3b8]">Platform Admin Signup</p>
              <h1 className="mt-3 text-4xl font-semibold text-[#111827] dark:text-[#f8fafc]">Create your account to access the admin workspace</h1>
            </div>
          </div>
          <PlatformAdminInviteForm />
        </div>
      </div>
      <ToasterClient position="top-center" />
    </main>
  );
}
