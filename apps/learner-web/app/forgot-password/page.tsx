"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "../components/AuthCard";
import NeumorphicInput from "../components/NeumorphicInput";
import NeumorphicButton from "../components/NeumorphicButton";
import AlertBox from "../components/AlertBox";
import { authApi } from "../lib/api";

const STORAGE_KEY = "learnerPasswordResetData";

function validatePassword(password: string) {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  return "";
}

export default function ForgotPassword() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function normalizeIdentifier(value: string) {
    return value.trim();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const normalizedIdentifier = normalizeIdentifier(identifier);
    if (!normalizedIdentifier) {
      setError("Enter your email or phone number.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
    const channel = isEmail ? "email" : "phone";

    try {
      setLoading(true);

      await authApi.sendOtp({
        channel,
        target: normalizedIdentifier,
        purpose: "recovery",
      });

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          identifier: normalizedIdentifier,
          isEmail,
          password,
        })
      );

      router.push("/verify-otp");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate password recovery."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <AuthCard
        title="Forgot Password"
        subtitle="Enter your email and a new password, then verify with OTP."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <NeumorphicInput
            label="Email or Phone Number"
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter your email or phone number"
            disabled={loading}
            required
          />

          <NeumorphicInput
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter new password"
            disabled={loading}
            required
          />

          <NeumorphicInput
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="Confirm new password"
            disabled={loading}
            required
          />

          <div className="text-sm text-gray-500 space-y-1">
            <p>Password must be at least 8 characters and include:</p>
            <ul className="list-disc list-inside">
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
            </ul>
          </div>

          {error && (
            <AlertBox
              type="error"
              message={error}
              onClose={() => setError("")}
            />
          )}

          <div className="space-y-3">
            <NeumorphicButton
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </NeumorphicButton>

            <NeumorphicButton
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/signin")}
            >
              Back to Sign In
            </NeumorphicButton>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}