"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NeumorphicInput from "../../components/NeumorphicInput";
import NeumorphicButton from "../../components/NeumorphicButton";
import AlertBox from "../../components/AlertBox";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../utils/validation";
import { facultyAuthApi } from "../../lib/api";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    // VALIDATION FLOW
    const e = validateEmail(email);
    const p = validatePassword(password);
    const n = validateUsername(name);

    if (!name) return setAlert("Name cannot be empty.");
    if (e) return setAlert(e);
    if (p) return setAlert(p);
    if (n) return setAlert(n);

    try {
      setLoading(true);
      setAlert("");
      await facultyAuthApi.signup({
        name,
        email,
        password,
        confirmPassword: password,
        acceptTerms: true,
        acceptPrivacy: true,
        googleId: googleId || undefined,
      });
      setAlert("Account created successfully! Redirecting to verification...");
      setTimeout(() => {
        router.push(`/faculty/auth/verify?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (error: any) {
      setAlert(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Faculty Signup</h2>

        <AlertBox message={alert} />

        <NeumorphicInput
          placeholder="Full Name"
          onChange={(e: any) => setName(e.target.value)}
        />

        <NeumorphicInput
          placeholder="Institute Email"
          onChange={(e: any) => setEmail(e.target.value)}
        />

        <NeumorphicInput
          placeholder="Password"
          type="password"
          onChange={(e: any) => setPassword(e.target.value)}
        />

        <NeumorphicButton onClick={submit}>
          Create Account
        </NeumorphicButton>

        <p style={styles.note}>
          Account requires Admin / Coordinator approval
        </p>
      </div>
    </div>
  );
}

const styles: {
  wrapper: React.CSSProperties;
  card: React.CSSProperties;
  title: React.CSSProperties;
  note: React.CSSProperties;
} = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#e6ebf2",
  },

  card: {
    width: 420,
    padding: 40,
    borderRadius: 24,
    background: "#e6ebf2",
    boxShadow: "10px 10px 20px #c5ccd6, -10px -10px 20px #ffffff",
    textAlign: "center",
  },

  title: {
    marginBottom: 20,
    fontWeight: 600,
    color: "#333",
  },

  note: {
    marginTop: 12,
    fontSize: 12,
    color: "#666",
  },
};
