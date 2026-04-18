"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../components/auth/AuthShell";
import NeuInput from "../components/auth/NeuInput";
import NeuButton from "../components/auth/NeuButton";
import { authApi, extractApiErrorMessage } from "../lib/api";
import { ROLES } from "../lib/constants";
import { validateLoginForm } from "../lib/validators";

export default function InstitutionAdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validateLoginForm(identifier, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await authApi.login({
        role: ROLES.INSTITUTION_ADMIN,
        identifier,
        password,
      });

      if (response.requiresMfa) {
        try {
          sessionStorage.setItem(
            "pendingMfaLogin",
            JSON.stringify({ identifier, password, role: ROLES.INSTITUTION_ADMIN })
          );
        } catch {
          // Ignore storage failures; continue to MFA page.
        }
        router.push("/auth/institution-admin/mfa-verify");
        return;
      }

      router.push("/institution-admin/dashboard");
    } catch (err) {
      const message = extractApiErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Institution Admin Sign In"
      subtitle="Sign in using your email ID or mobile number and password."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NeuInput
          label="Email ID or Mobile Number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter email ID or mobile number"
        />

        <NeuInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-3">
          <NeuButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </NeuButton>

          <div className="grid gap-3 sm:grid-cols-2">
            <NeuButton
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/auth/institution-admin/forgot-password")}
            >
              Forgot Password
            </NeuButton>

            <NeuButton
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/auth/institution-admin/signup")}
            >
              Register if no account
            </NeuButton>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}