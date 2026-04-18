"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../components/auth/AuthShell";
import AuthAlert from "../components/auth/AuthAlert";
import NeuInput from "../components/auth/NeuInput";
import NeuButton from "../components/auth/NeuButton";
import PasswordChecklist from "../components/auth/PasswordChecklist";
import { authApi, extractApiErrorMessage } from "../lib/api";

export default function InstitutionAdminSignupPage() {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const email = form.officialEmail.trim();

    if (!form.firstName || !form.lastName) {
      setMessage("Please tell us your full name so we can personalize your account.");
      setMessageType("error");
      return;
    }

    if (!email) {
      setMessage("Enter your official email address to get started.");
      setMessageType("error");
      return;
    }

    if (!form.officialPhone) {
      setMessage("We need your phone number for verification — please add it.");
      setMessageType("error");
      return;
    }

    if (!form.password) {
      setMessage("A strong password is required to protect your account.");
      setMessageType("error");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Your passwords don’t match yet. Please check both fields.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await authApi.signup({
        firstName: form.firstName,
        lastName: form.lastName,
        officialEmail: email,
        officialPhone: form.officialPhone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      router.push(
        `/auth/institution-admin/verify-email?email=${encodeURIComponent(
          email
        )}&mobile=${encodeURIComponent(form.officialPhone)}`
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setMessage("This email is already registered. Try signing in or use another official email.");
      } else {
        const message = axios.isAxiosError(err)
        ? extractApiErrorMessage(err)
        : err instanceof Error
        ? err.message
        : "We hit a snag while creating your account. Please try again.";
      setMessage(message);
      }
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Institution Admin Registration"
      subtitle="Create your institution admin account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-grid two">
          <NeuInput
            label="First Name"
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="Enter first name"
          />
          <NeuInput
            label="Last Name"
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Enter last name"
          />
        </div>

        <div className="form-grid two">
          <NeuInput
            label="Official Email"
            type="email"
            value={form.officialEmail}
            onChange={(e) => updateField("officialEmail", e.target.value)}
            placeholder="Enter official email"
          />
          <NeuInput
            label="Official Phone"
            value={form.officialPhone}
            onChange={(e) => updateField("officialPhone", e.target.value)}
            placeholder="Enter official phone"
          />
        </div>

        <NeuInput
          label="Create Password"
          type="password"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          placeholder="Create password"
        />

        <NeuInput
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
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
            onClick={() => router.push("/auth/institution-admin/login")}
          >
            Back to Sign In
          </NeuButton>
        </div>
      </form>
    </AuthShell>
  );
}