"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../../components/auth/AuthShell";
import AuthAlert from "../../../components/auth/AuthAlert";
import NeuInput from "../../../components/auth/NeuInput";
import NeuButton from "../../../components/auth/NeuButton";
import PasswordChecklist from "../../../components/auth/PasswordChecklist";
import { authApi } from "../../../lib/api";

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

  const [error, setError] = useState("");
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
      setError("Looks like we are missing your name. Add your first and last name to continue.");
      return;
    }

    if (!email) {
      setError("Please enter your official email so we can send your account details.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("That email looks a bit off. Try a valid address like name@example.com.");
      return;
    }

    if (!form.officialPhone) {
      setError("Your phone number helps keep your account secure. Please add it.");
      return;
    }

    if (!form.password) {
      setError("Create a strong password to protect your institution admin account.");
      return;
    }

    if (form.password.length < 8) {
      setError("Make your password stronger with at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("The passwords don’t match yet. Double-check both fields and try again.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await authApi.signup({
        firstName: form.firstName,
        lastName: form.lastName,
        officialEmail: email,
        officialPhone: form.officialPhone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      setMessage("Account created. Let us get started.");
      setMessageType("success");

      await authApi.sendOtp({
        channel: "email",
        target: email,
        purpose: "signup_email",
      });

      setMessage("OTP sent. Check your inbox.");
      setMessageType("info");

      setTimeout(() => {
        router.push(
          `/auth/institution-admin/verify-email?email=${encodeURIComponent(
            email
          )}&mobile=${encodeURIComponent(form.officialPhone)}`
        );
      }, 900);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError("This email is already registered. Try signing in or use a different official email.");
      } else {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
          ? err.message
          : "We hit a snag while creating your account. Please try again in a moment.";
        setError(message);
      }
      setMessage("");
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
        {message ? <AuthAlert type={messageType} message={message} /> : null}
        {error ? <AuthAlert type="error" message={error} /> : null}
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
