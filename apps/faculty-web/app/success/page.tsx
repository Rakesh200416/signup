"use client";

import { useRouter } from "next/navigation";
import AuthShell from "../components/auth/AuthShell";
import NeuButton from "../components/auth/NeuButton";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <AuthShell
      title="Registration Completed"
      subtitle="Your institution admin account setup is complete."
    >
      <div className="space-y-4">
        <div className="neu-inset p-5 text-sm leading-6 text-slate-600">
          Email verification, mobile verification, password setup, and QR-based
          MFA setup were completed successfully.
        </div>

        <NeuButton
          className="w-full"
          onClick={() => router.push("/auth/institution-admin/login")}
        >
          Go to Sign In
        </NeuButton>
      </div>
    </AuthShell>
  );
}
