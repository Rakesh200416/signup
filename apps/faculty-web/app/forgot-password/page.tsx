"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../components/auth/AuthShell";
import NeuInput from "../components/auth/NeuInput";
import NeuButton from "../components/auth/NeuButton";
import { authApi, extractApiErrorMessage } from "../lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function normalizeIdentifier(value: string) {
    return value.trim();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const normalizedIdentifier = normalizeIdentifier(identifier);

    if (!normalizedIdentifier) {
      setError("Enter your official email or phone number.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
    const channel = isEmail ? "email" : "phone";

    try {
      setLoading(true);
      setError("");

      await authApi.sendOtp({
        channel,
        target: normalizedIdentifier,
        purpose: "recovery",
      });

      router.push(
        `/auth/institution-admin/reset-password?identifier=${encodeURIComponent(
          normalizedIdentifier
        )}`
      );
    } catch (err) {
      const message = extractApiErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Recover using official email or phone number."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NeuInput
          label="Official Email or Phone Number"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (error) setError("");
          }}
          placeholder="Enter official email or phone number"
          disabled={loading}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <NeuButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending OTP..." : "Send Recovery OTP"}
        </NeuButton>
      </form>
    </AuthShell>
  );
}