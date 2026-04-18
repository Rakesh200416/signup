"use client";

import { useRouter } from "next/navigation";
import AuthShell from "../components/auth/AuthShell";
import NeuButton from "../components/auth/NeuButton";

export default function CoordinatorHomePage() {
  const router = useRouter();

  return (
    <AuthShell
      title="Coordinator Access"
      subtitle="Sign in, register, or recover your account with secure coordinator access."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <NeuButton className="w-full" onClick={() => router.push("/coordinator/login")}>Sign In</NeuButton>
        <NeuButton variant="secondary" className="w-full" onClick={() => router.push("/coordinator/signup")}>Sign Up</NeuButton>
        <NeuButton variant="secondary" className="w-full" onClick={() => router.push("/coordinator/forgot-password")}>Forgot Password</NeuButton>
      </div>
    </AuthShell>
  );
}
