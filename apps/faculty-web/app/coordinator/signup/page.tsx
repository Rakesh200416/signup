"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import AuthAlert from "../../components/auth/AuthAlert";
import NeuInput from "../../components/auth/NeuInput";
import NeuButton from "../../components/auth/NeuButton";
import PasswordChecklist from "../../components/auth/PasswordChecklist";
import { authApi, extractApiErrorMessage } from "../../lib/api";

export default function CoordinatorSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    officialEmail: "",
    officialPhone: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "info" | "error">("success");
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.firstName || !form.lastName) {
      setMessage("Enter your full name.");
      setMessageType("error");
      return;
    }

    if (!form.officialEmail) {
      setMessage("Official email is required.");
      setMessageType("error");
      return;
    }

    if (!form.officialPhone) {
      setMessage("Official phone is required.");
      setMessageType("error");
      return;
    }

    if (!form.password || form.password.length < 8) {
      setMessage("Create a stronger password with at least 8 characters.");
      setMessageType("error");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await authApi.coordinatorSignup({
        firstName: form.firstName,
        lastName: form.lastName,
        officialEmail: form.officialEmail.trim(),
        officialPhone: form.officialPhone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      router.push(`/coordinator/verify-otp?email=${encodeURIComponent(form.officialEmail.trim())}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed.";
      setMessage(message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Coordinator Registration"
      subtitle="Start your account setup for coordinator access."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-grid two">
          <NeuInput
            label="First Name"
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            placeholder="Enter first name"
          />
          <NeuInput
            label="Last Name"
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            placeholder="Enter last name"
          />
        </div>

        <div className="form-grid two">
          <NeuInput
            label="Official Email"
            type="email"
            value={form.officialEmail}
            onChange={(event) => updateField("officialEmail", event.target.value)}
            placeholder="Enter official email"
          />
          <NeuInput
            label="Official Phone"
            value={form.officialPhone}
            onChange={(event) => updateField("officialPhone", event.target.value)}
            placeholder="Enter official phone"
          />
        </div>

        <NeuInput
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Create password"
        />

        <NeuInput
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={(event) => updateField("confirmPassword", event.target.value)}
          placeholder="Confirm password"
        />

        <PasswordChecklist password={form.password} />

        {message ? <AuthAlert type={messageType} message={message} /> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <NeuButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </NeuButton>

          <NeuButton
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/coordinator/login")}
          >
            Back to Sign In
          </NeuButton>
        </div>
      </form>
    </AuthShell>
  );
}
