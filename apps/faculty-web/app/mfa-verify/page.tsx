"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../components/auth/AuthShell";
import OtpInput from "../components/auth/OtpInput";
import NeuButton from "../components/auth/NeuButton";
import { authApi, extractApiErrorMessage } from "../lib/api";
import { validateMfaCode } from "../lib/validators";

export default function MfaVerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ identifier: string; password: string; role: string } | null>(null);
  const [loadingPending, setLoadingPending] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("pendingMfaLogin");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.identifier && parsed?.password && parsed?.role) {
            setPendingLogin(parsed);
          }
        } catch {
          // ignore invalid session data
        }
      }
      setLoadingPending(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleVerify() {
    const normalizedOtp = otp.replace(/\s+/g, "").trim();
    const validationError = validateMfaCode(normalizedOtp);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!pendingLogin) {
      setError("Missing pending sign-in details. Please sign in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await authApi.loginWithMfa({
        role: pendingLogin.role,
        identifier: pendingLogin.identifier,
        password: pendingLogin.password,
        totpCode: normalizedOtp,
      });

      sessionStorage.removeItem("pendingMfaLogin");
      router.push("/institution-admin/dashboard");
    } catch (err) {
      const message = extractApiErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loadingPending) {
    return (
      <AuthShell title="Verify MFA" subtitle="Loading pending sign-in details...">
        <div className="p-6 text-sm">Loading...</div>
      </AuthShell>
    );
  }

  if (!pendingLogin) {
    return (
      <AuthShell title="Verify MFA" subtitle="Please sign in again to complete MFA verification.">
        <div className="space-y-4">
          <p className="text-sm text-red-600">Missing pending sign-in details. Please start from the login page again.</p>
          <NeuButton className="w-full" onClick={() => router.push("/login")}>Go to Login</NeuButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify MFA"
      subtitle="Enter the code from your authenticator application."
    >
      <div className="space-y-4">
        <OtpInput
          value={otp}
          onChange={(value) => {
            setOtp(value);
            if (error) setError("");
          }}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <NeuButton className="w-full" onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Verify and Continue"}
        </NeuButton>
      </div>
    </AuthShell>
  );
}