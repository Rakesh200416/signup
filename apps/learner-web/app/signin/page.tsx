"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- ALERT SYSTEM ----------------
  const showAlert = (msg: string) => {
    setAlert(msg);
    setTimeout(() => setAlert(""), 3000);
  };

  // ---------------- LOGIN ----------------
  const handleLogin = async () => {
    try {
      if (!email) return showAlert("Email cannot be empty.");
      if (!email.includes("@")) return showAlert("This email does not look valid.");

      if (!password) return showAlert("Password cannot be empty.");
      if (password.length < 8) return showAlert("Use at least 8 characters.");

      setLoading(true);
      setAlert("");

      const response = await authApi.login({ email, password });
      showAlert("You are in. Welcome aboard.");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      showAlert(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- YOUR STYLES (UNCHANGED) ----------------
  const cardStyle = {
    width: 420,
    margin: "90px auto",
    textAlign: "center" as const,
    background: "#e6ebf2",
    padding: "45px",
    borderRadius: "24px",
    boxShadow: "10px 10px 20px #c5ccd6, -10px -10px 20px #ffffff",
    transition: "0.3s",
  };

  const inputStyle = {
    width: "100%",
    margin: "12px 0",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    outline: "none",
    background: "#e6ebf2",
    boxShadow: "inset 6px 6px 12px #c5ccd6, inset -6px -6px 12px #ffffff",
    fontSize: "14px",
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    background: "#e6ebf2",
    boxShadow: "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff",
    fontWeight: 600,
    fontSize: "15px",
    transition: "all 0.2s ease-in-out",
  };

  const actionButton = {
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    background: "#e6ebf2",
    boxShadow: "6px 6px 12px #c5ccd6, -6px -6px 12px #ffffff",
    transition: "all 0.2s ease-in-out",
    color: "#444",
  };

  const hoverIn = (e: any) => {
    e.currentTarget.style.boxShadow =
      "inset 6px 6px 12px #c5ccd6, inset -6px -6px 12px #ffffff";
    e.currentTarget.style.transform = "scale(0.98)";
  };

  const hoverOut = (e: any) => {
    if (!loading) {
      e.currentTarget.style.boxShadow =
        "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff";
      e.currentTarget.style.transform = "scale(1)";
    }
  };

  const pressEffect = (e: any) => {
    if (!loading) {
      e.currentTarget.style.transform = "scale(0.95)";
    }
  };

  const releaseEffect = (e: any) => {
    e.currentTarget.style.transform = "scale(1)";
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ marginBottom: 25, fontWeight: 600 }}>Welcome Back</h2>

      {/* ---------------- ALERT BOX ---------------- */}
      {alert && (
        <div
          style={{
            marginBottom: 15,
            padding: "10px",
            borderRadius: 10,
            background: "#e6ebf2",
            boxShadow:
              "inset 4px 4px 8px #c5ccd6, inset -4px -4px 8px #ffffff",
            fontSize: 13,
            color: "#444",
          }}
        >
          {alert}
        </div>
      )}

      {/* ---------------- INPUTS ---------------- */}
      <input
        style={inputStyle}
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <input
        style={inputStyle}
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      {/* ---------------- LOGIN BUTTON ---------------- */}
      <button
        style={buttonStyle}
        onClick={handleLogin}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
        onMouseDown={pressEffect}
        onMouseUp={releaseEffect}
        disabled={loading}
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>

      {/* ---------------- ACTION BUTTONS ---------------- */}
      <button
        style={actionButton}
        onClick={() => router.push("/forgot-password")}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
      >
        Forgot Password
      </button>

      {/* CREATE ACCOUNT */}
      <button
        style={actionButton}
        onClick={() => router.push("/signup")}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
      >
        Create Account
      </button>

      {/* ---------------- FOOTER ---------------- */}
      <p style={{ marginTop: 15, fontSize: 12, color: "#666" }}>
        Secure LMS Login • Smart Alerts Enabled
      </p>
    </div>
  );
}