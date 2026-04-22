"use client";

import { useSearchParams } from "next/navigation";
import { NeumorphicLoginForm } from "../../components/NeumorphicLoginForm";
import { ToasterClient } from "../../components/ToasterClient";

export default function PlatformAdminSigninClient() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e6e8ee] px-4 py-10 text-[#273457]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#ffffff] blur-3xl opacity-70" />
        <div className="absolute right-8 top-24 h-44 w-44 rounded-full bg-[#d4d5dd] blur-3xl opacity-75" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#f8f9fd] blur-3xl opacity-60" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="w-full px-4">
          <NeumorphicLoginForm
            initialEmail={initialEmail}
            redirectTo="/platform-admin/dashboard"
            pageTitle="Platform Admin Sign in"
            allowedFallbackMethods={["totp", "recovery", "security"]}
            allowFallbackSwitch={false}
          />
        </div>
      </div>
      <ToasterClient position="top-center" />
    </main>
  );
}
