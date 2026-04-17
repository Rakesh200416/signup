"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthShell from "../../../../components/auth/AuthShell";
import OtpInput from "../../../../components/auth/OtpInput";
import NeuButton from "../../../../components/auth/NeuButton";
import { authApi } from "../../../../lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") || "";
  const mobile = params.get("mobile") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    if (!otp || otp.length < 4) {
      setError("Enter a valid OTP.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await authApi.verifyOtp({
        channel: "email",
        target: email,
        purpose: "signup_email",
        otp,
      });

      router.push(
        `/auth/institution-admin/verify-mobile?mobile=${encodeURIComponent(
          mobile
        )}&email=${encodeURIComponent(email)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setLoading(true);
      setError("");

      await authApi.resendOtp({
        channel: "email",
        target: email,
        purpose: "signup_email",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Verify Email OTP"
      subtitle={`Enter the OTP sent to ${email || "your email address"}.`}
    >
      <div className="space-y-4">
        <OtpInput value={otp} onChange={setOtp} />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <NeuButton
            type="button"
            className="w-full"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </NeuButton>

          <NeuButton
            type="button"
            className="w-full"
            variant="secondary"
            onClick={handleResend}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Resend OTP"}
          </NeuButton>
        </div>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}