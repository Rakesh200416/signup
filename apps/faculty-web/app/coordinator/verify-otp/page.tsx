"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import NeuInput from "../../components/auth/NeuInput";
import NeuButton from "../../components/auth/NeuButton";
import { authApi, extractApiErrorMessage } from "../../lib/api";

function CoordinatorVerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const target = searchParams.get("target") ?? "";
  const channel = searchParams.get("channel") ?? (email ? "email" : "mobile");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasValidTarget = Boolean(email || target);
  const displayTarget = email || target;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!otp.trim()) {
      setError("Enter your OTP.");
      return;
    }

    if (!hasValidTarget) {
      setError("Unable to verify OTP without an email or phone target.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const payload = email
        ? { email, otpCode: otp, purpose: "recovery" }
        : { target, channel, otpCode: otp, purpose: "recovery" };
      await authApi.verifyOtp(payload);
      router.push("/coordinator/login");
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Enter OTP"
      subtitle={`Verify the code sent to ${displayTarget}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NeuInput
          label="OTP Code"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          placeholder="Enter the 6-digit code"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <NeuButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </NeuButton>
      </form>
    </AuthShell>
  );
}

export default function CoordinatorVerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CoordinatorVerifyOtpContent />
    </Suspense>
  );
}
