"use client";

import { PlatformAdminInviteForm } from "../../components/platform-admin-invite-form";
import { ToasterClient } from "../../components/ToasterClient";

export default function PlatformAdminSignupPage() {
  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
          <PlatformAdminInviteForm />
        </div>
      </div>
      <ToasterClient />
    </main>
  );
}
