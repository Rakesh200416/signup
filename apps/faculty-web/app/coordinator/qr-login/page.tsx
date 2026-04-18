"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import NeuInput from "../../components/auth/NeuInput";
import NeuButton from "../../components/auth/NeuButton";
import { authApi, extractApiErrorMessage } from "../../lib/api";
import { validateMfaCode } from "../../lib/validators";

function CoordinatorQrLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIdentifier = searchParams.get("identifier") ?? "";

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("Enter the authenticator code to complete sign in.");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim()) {
      setError("Enter your email or mobile number.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    if (!validateMfaCode(code)) {
      setError("Provide a valid 6-digit authenticator code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInfo("");
      const response = await authApi.login({ identifier, password, totpCode: code });
      if (response?.requiresMfa) {
        setInfo("The code was not accepted. Please confirm your authenticator app entry.");
        return;
      }
      router.push("/coordinator/dashboard");
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Coordinator MFA Sign In"
      subtitle="Use your authenticator code to complete login." 
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
        <NeuInput
          label="Authenticator Code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter 6-digit code"
        />

        {info ? <p className="text-sm text-slate-600">{info}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <NeuButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying..." : "Complete Sign In"}
        </NeuButton>
      </form>
    </AuthShell>
  );
}

export default function CoordinatorQrLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CoordinatorQrLoginContent />
    </Suspense>
  );
}
