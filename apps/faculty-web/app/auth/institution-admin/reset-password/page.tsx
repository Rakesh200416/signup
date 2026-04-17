"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "../../../components/auth/AuthShell";
import AuthAlert from "../../../components/auth/AuthAlert";
import OtpInput from "../../../components/auth/OtpInput";
import NeuInput from "../../../components/auth/NeuInput";
import NeuButton from "../../../components/auth/NeuButton";
import PasswordChecklist from "../../../components/auth/PasswordChecklist";
import { authApi } from "../../../lib/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier") || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!identifier) {
      setError("Missing recovery identifier.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    if (!isEmail) {
      setError("Password reset currently supports email recovery only.");
      return;
    }

    if (!otp || otp.length !== 6) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    if (!password) {
      setError("Enter a new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await authApi.resetPassword({
        email: identifier,
        password,
        confirmPassword,
        otpCode: otp,
      });

      router.push("/auth/institution-admin/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter the OTP sent to your official email or phone and set a new password."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NeuInput
          label="Official Email or Phone"
          value={identifier}
          readOnly
          placeholder="Recovery identifier"
        />

        <OtpInput value={otp} onChange={setOtp} />

        <NeuInput
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
        />

        <NeuInput
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />

        <PasswordChecklist password={password} />

        {error ? <AuthAlert type="error" message={error} /> : null}

        <NeuButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </NeuButton>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

