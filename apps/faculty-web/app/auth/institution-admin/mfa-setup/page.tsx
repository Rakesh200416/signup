"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "../../../components/auth/AuthShell";
import OtpInput from "../../../components/auth/OtpInput";
import NeuButton from "../../../components/auth/NeuButton";
import { authApi, extractApiErrorMessage } from "../../../lib/api";

function MfaSetupContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) {
    return (
      <AuthShell
        title="QR / MFA Setup"
        subtitle="Missing email for MFA setup."
      >
        <p className="text-sm text-red-600">
          No email address was provided. Please restart the signup or login flow to continue.
        </p>
      </AuthShell>
    );
  }

  async function handleGenerateQr() {
    if (!email) {
      setError("Missing email for MFA setup.");
      return;
    }

    if (!password) {
      setError("Enter your account password to generate the MFA QR code.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await authApi.setupMfa({ email, password });

      if (response && typeof response === "object" && "qrCodeDataUrl" in response && typeof response.qrCodeDataUrl === "string") {
        setQrCodeDataUrl(response.qrCodeDataUrl);
      }

      if (response && typeof response === "object" && "otpauthUrl" in response && typeof response.otpauthUrl === "string") {
        setOtpauthUrl(response.otpauthUrl);
        const secretValue = response.otpauthUrl.split("secret=")[1]?.split("&")[0] ?? "";
        setManualKey(secretValue);
      }
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate() {
    if (!email) {
      setError("Missing email for MFA verification.");
      return;
    }

    if (!otp || otp.length !== 6) {
      setError("Enter a valid 6-digit authenticator code.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await authApi.verifyMfa({
        email,
        totpCode: otp,
      });

      router.push("/auth/institution-admin/success");
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="QR / MFA Setup"
      subtitle="Scan the QR code in your authenticator app and enter the verification code."
    >
      <div className="space-y-5">
        {qrCodeDataUrl ? (
          <img
            src={qrCodeDataUrl}
            alt="QR Code"
            className="mx-auto h-56 w-56 rounded-3xl sm:h-60 sm:w-60 md:h-64 md:w-64"
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Enter your account password to generate the MFA QR code.</p>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Enter your password"
              />
            </div>
            <NeuButton className="w-full" onClick={handleGenerateQr} disabled={loading}>
              {loading ? "Generating..." : "Generate QR code"}
            </NeuButton>
          </div>
        )}

        {qrCodeDataUrl ? (
          <div className="neu-inset p-4">
            <p className="text-sm font-semibold text-slate-800">Manual setup key</p>
            <p className="mt-2 break-all text-sm text-slate-600">{manualKey || otpauthUrl || "—"}</p>
          </div>
        ) : null}

        {qrCodeDataUrl ? <OtpInput value={otp} onChange={setOtp} /> : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {qrCodeDataUrl ? (
          <NeuButton className="w-full" onClick={handleActivate} disabled={loading}>
            {loading ? "Activating..." : "Activate MFA"}
          </NeuButton>
        ) : null}
      </div>
    </AuthShell>
  );
}

export default function MfaSetupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading...</div>}>
      <MfaSetupContent />
    </Suspense>
  );
}

