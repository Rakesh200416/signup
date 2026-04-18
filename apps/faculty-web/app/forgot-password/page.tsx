"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../components/auth/AuthShell";
import NeuInput from "../components/auth/NeuInput";
import NeuButton from "../components/auth/NeuButton";
import { authApi, extractApiErrorMessage } from "../lib/api";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = identifier.trim();
    if (!target) {
      setError("Enter your email or mobile number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const channel = isEmail(target) ? "email" : "mobile";
      await authApi.sendOtp({ target, channel, purpose: "recovery" });
      const query = isEmail(target)
        ? `email=${encodeURIComponent(target)}`
        : `target=${encodeURIComponent(target)}&channel=mobile`;
      router.push(`/reset-password?${query}`);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Recovery"
      subtitle="Enter your email or phone to receive a recovery OTP."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NeuInput
          label="Email or Phone"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Enter your email or phone"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <NeuButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending OTP..." : "Send Recovery OTP"}
        </NeuButton>
      </form>
    </AuthShell>
  );
}