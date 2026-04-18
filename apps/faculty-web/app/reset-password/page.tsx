"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../components/auth/AuthShell";
import NeuInput from "../components/auth/NeuInput";
import NeuButton from "../components/auth/NeuButton";
import PasswordChecklist from "../components/auth/PasswordChecklist";
import { authApi, extractApiErrorMessage } from "../lib/api";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function ResetPasswordContent() {
  const router = useRouter();

  // Step 1: Email and Password
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Step 2: OTP Verification
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  // Common
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = identifier.trim();
    if (!target) {
      setError("Enter your email or mobile number.");
      return;
    }

    if (!password) {
      setError("Enter a new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const channel = isEmail(target) ? "email" : "mobile";
      await authApi.sendOtp({ target, channel, purpose: "recovery" });
      
      setOtpSent(true);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = identifier.trim();
    if (!otp || otp.length !== 6) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const channel = isEmail(target) ? "email" : "mobile";
      
      // First verify OTP
      const payload = isEmail(target)
        ? { email: target, otpCode: otp, purpose: "recovery" }
        : { target, channel, otpCode: otp, purpose: "recovery" };
      await authApi.verifyOtp(payload);

      // Then reset password
      await authApi.resetPassword({
        ...(isEmail(target) ? { email: target } : { phone: target }),
        password,
        confirmPassword,
        otpCode: otp,
      });

      router.push("/login");
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={otpSent ? "Verify OTP" : "Reset Password"}
      subtitle={
        otpSent
          ? `Enter the OTP sent to ${identifier}.`
          : "Enter your email/phone and set a new password."
      }
    >
      {!otpSent ? (
        // Step 1: Email + Password + Confirm Password
        <form onSubmit={handleSendOtp} className="space-y-4">
          <NeuInput
            label="Email or Phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter your email or phone"
          />

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

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <NeuButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </NeuButton>
        </form>
      ) : (
        // Step 2: OTP Verification
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <NeuInput
            label="Email or Phone"
            value={identifier}
            readOnly
            placeholder="Your email or phone"
          />

          <NeuInput
            label="OTP Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter the 6-digit code"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <NeuButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP & Reset Password"}
          </NeuButton>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
              }}
            >
              Change email/phone or password
            </button>
          </div>
        </form>
      )}
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