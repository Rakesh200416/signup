"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthShell from "../../../components/auth/AuthShell";
import AuthAlert from "../../../components/auth/AuthAlert";
import OtpInput from "../../../components/auth/OtpInput";
import NeuButton from "../../../components/auth/NeuButton";
import VerificationMethodSelect from "../../../components/auth/VerificationMethodSelect";
import { authApi, extractApiErrorMessage } from "../../../lib/api";

function VerifyMobileContent() {
  const router = useRouter();
  const params = useSearchParams();

  const mobile = params.get("mobile") || "";
  const email = params.get("email") || "";
  const defaultMethod = mobile ? "mobile" : "email";

  const [selectedMethod, setSelectedMethod] = useState<"email" | "mobile">(defaultMethod as "email" | "mobile");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    selectedMethod === "mobile" ? "OTP sent. Check your phone." : "OTP sent. Check your inbox."
  );
  const [messageType, setMessageType] = useState<"success" | "info" | "error">("info");
  const [loading, setLoading] = useState(false);

  function handleMethodSelect(method: "email" | "mobile") {
    setSelectedMethod(method);
    setMessage(method === "mobile" ? "OTP sent. Check your phone." : "OTP sent. Check your inbox.");
    setMessageType("info");
    setError("");
  }

  async function handleVerify() {
    if (!otp || otp.length < 4) {
      setError("Enter a valid OTP.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await authApi.verifyOtp({
        email: selectedMethod === "email" ? email : undefined,
        channel: selectedMethod,
        target: selectedMethod === "email" ? email : mobile,
        purpose: selectedMethod === "email" ? "signup_email" : "signup_mobile",
        otp,
      });

      if (!email) {
        setError("Missing email. Please restart the verification flow.");
        return;
      }

      router.push(`/auth/institution-admin/mfa-setup?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const message = extractApiErrorMessage(err);
      if (message.toLowerCase().includes("expired")) {
        setError("This OTP has expired. Request a new one.");
      } else {
        setError(message || "Incorrect code. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setLoading(true);
      setError("");
      setMessage("A new OTP is being sent.");
      setMessageType("info");

      await authApi.resendOtp({
        channel: selectedMethod,
        target: selectedMethod === "email" ? email : mobile,
        purpose: selectedMethod === "email" ? "signup_email" : "signup_mobile",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Did not receive the code. You can resend in 30 seconds.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Verify OTP"
      subtitle={`Enter the OTP sent to ${selectedMethod === "email" ? email || "your email address" : mobile || "your mobile number"}.`}
    >
      <div className="space-y-4">
        {(email && mobile) ? (
          <VerificationMethodSelect
            email={email}
            mobile={mobile}
            selectedMethod={selectedMethod}
            onSelect={handleMethodSelect}
          />
        ) : null}

        {message ? <AuthAlert type={messageType} message={message} /> : null}
        <OtpInput value={otp} onChange={setOtp} />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <NeuButton type="button" className="w-full" onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </NeuButton>

          <NeuButton type="button" className="w-full" variant="secondary" onClick={handleResend} disabled={loading}>
            {loading ? "Please wait..." : "Resend OTP"}
          </NeuButton>
        </div>
      </div>
    </AuthShell>
  );
}

export default function VerifyMobilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading...</div>}>
      <VerifyMobileContent />
    </Suspense>
  );
}
