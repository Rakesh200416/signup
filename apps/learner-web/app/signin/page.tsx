"use client";

import { useState, type MouseEvent } from "react";
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

      await authApi.login({ email, password });
      showAlert("You are in. Welcome aboard.");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: unknown) {
      let errorMessage = error instanceof Error ? error.message : "Login failed. Please try again.";
      
      // Enhanced user-friendly error handling
      if (errorMessage.includes("401") || errorMessage.toLowerCase().includes("unauthorized")) {
        errorMessage = "The email or password you entered is incorrect. Please check your credentials and try again. If you don't have an account, please create one first.";
      } else if (errorMessage.toLowerCase().includes("no account") || errorMessage.toLowerCase().includes("user not found") || errorMessage.toLowerCase().includes("account not found")) {
        errorMessage = "No account found with this email. Please create an account first or check your email address.";
      } else if (errorMessage.toLowerCase().includes("verification")) {
        errorMessage = "Your account needs to be verified. Please check your email for the verification link.";
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        }, 2000);
        return;
      } else if (errorMessage.toLowerCase().includes("locked")) {
        errorMessage = "Your account has been temporarily locked due to multiple failed attempts. Please wait a few minutes and try again, or reset your password.";
      } else if (errorMessage.includes("409") || errorMessage.toLowerCase().includes("conflict")) {
        errorMessage = "This email is already registered. Please sign in or reset your password.";
      } else if (errorMessage.includes("400") || errorMessage.toLowerCase().includes("bad request")) {
        errorMessage = "Please check your input and try again. Some fields may be missing or incorrect.";
      } else if (errorMessage.includes("500") || errorMessage.toLowerCase().includes("internal server")) {
        errorMessage = "Something went wrong on our end. Please try again later.";
      } else if (errorMessage.includes("Request failed")) {
        errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
      }
      
      showAlert(errorMessage);
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

  const hoverIn = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.boxShadow =
      "inset 6px 6px 12px #c5ccd6, inset -6px -6px 12px #ffffff";
    e.currentTarget.style.transform = "scale(0.98)";
  };

  const hoverOut = (e: MouseEvent<HTMLButtonElement>) => {
    if (!loading) {
      e.currentTarget.style.boxShadow =
        "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff";
      e.currentTarget.style.transform = "scale(1)";
    }
  };

  const pressEffect = (e: MouseEvent<HTMLButtonElement>) => {
    if (!loading) {
      e.currentTarget.style.transform = "scale(0.95)";
    }
  };

  const releaseEffect = (e: MouseEvent<HTMLButtonElement>) => {
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
