"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import NeuInput from "../../components/auth/NeuInput";
import NeuButton from "../../components/auth/NeuButton";
import { authApi, extractApiErrorMessage } from "../../lib/api";
import { validateLoginForm } from "../../lib/validators";

export default function CoordinatorLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateLoginForm(identifier, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await authApi.login({ identifier, password });
      if (response?.requiresMfa) {
        router.push(`/coordinator/qr-login?identifier=${encodeURIComponent(identifier)}`);
        return;
      }

      router.push("/coordinator/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Coordinator Sign In"
      subtitle="Use your institute email or phone and password to sign in." 
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NeuInput
          label="Email or Phone"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Enter your email or mobile" 
        />

        <NeuInput
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-3">
          <NeuButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </NeuButton>

          <div className="grid gap-3 sm:grid-cols-2">
            <NeuButton
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/coordinator/forgot-password")}
            >
              Forgot Password
            </NeuButton>

            <NeuButton
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/coordinator/signup")}
            >
              Sign Up
            </NeuButton>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}
