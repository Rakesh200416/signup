"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../../components/auth/AuthShell";
import OtpInput from "../../../components/auth/OtpInput";
import NeuButton from "../../../components/auth/NeuButton";
import { authApi } from "../../../lib/api";
import { ROLES } from "../../../lib/constants";
import { validateMfaCode } from "../../../lib/validators";

export default function MfaVerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    const normalizedOtp = otp.replace(/\s+/g, "").trim();
    const validationError = validateMfaCode(normalizedOtp);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      await authApi.verifyMfa({
        role: ROLES.INSTITUTION_ADMIN,
        otp: normalizedOtp,
      });

      router.push("/institution-admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "MFA verification failed.");
    } finally {
      setLoading(false);
    }
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

