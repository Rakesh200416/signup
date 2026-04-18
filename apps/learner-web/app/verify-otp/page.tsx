"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "../lib/api";

const STORAGE_KEY = "learnerPasswordResetData";

export default function VerifyOTP() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [alert, setAlert] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [pendingReset, setPendingReset] = useState<{
    identifier: string;
    isEmail: boolean;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPendingReset(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const showAlert = (msg: string, type: "success" | "error" | "info" = "info") => {
    setAlertType(type);
    setAlert(msg);
    setTimeout(() => setAlert(""), 4000);
  };

  const handleVerifyOTP = async () => {
    try {
      if (!otp) return showAlert("OTP is required", "error");
      if (otp.length !== 6) return showAlert("OTP must be 6 digits", "error");

      setLoading(true);
      setAlert("");

      if (pendingReset) {
        await authApi.resetPassword({
          email: pendingReset.isEmail ? pendingReset.identifier : undefined,
          phone: pendingReset.isEmail ? undefined : pendingReset.identifier,
          password: pendingReset.password,
          confirmPassword: pendingReset.password,
          otpCode: otp,
        });

        sessionStorage.removeItem(STORAGE_KEY);
        showAlert("Password reset successfully! Redirecting to sign in...", "success");

        setTimeout(() => {
          router.push("/signin");
        }, 1200);
      } else {
        await authApi.verifyOTP({ email, otp });
        showAlert("Email verified successfully! Redirecting to dashboard...", "success");

        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error: any) {
      showAlert(error.message || "OTP verification failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    const identifier = pendingReset?.identifier || email;
    if (!identifier) {
      return showAlert("Unable to resend OTP without a valid email or phone.", "error");
    }

    const isEmail = pendingReset?.isEmail ?? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    try {
      setResendLoading(true);
      setAlert("");

      await authApi.sendOtp({
        channel: isEmail ? "email" : "phone",
        target: identifier,
        purpose: pendingReset ? "recovery" : "signin",
      });

      showAlert("Verification code sent successfully!", "success");
      setCountdown(30);
    } catch (error: any) {
      showAlert(error.message || "Failed to resend OTP. Please try again.", "error");
    } finally {
      setResendLoading(false);
    }
  };

  const displayIdentifier = pendingReset?.identifier || email;
  const pageTitle = pendingReset ? "Reset Password" : "Verify OTP";
  const pageSubtitle = pendingReset
    ? "Enter the OTP sent to your email or phone to complete password reset."
    : "Enter the OTP sent to your email to verify your account.";
  const buttonText = pendingReset ? "Reset Password" : "Verify";

  return (
    <div className="neu-card" style={{ width: 400, margin: "auto", marginTop: 50, padding: "2rem" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>{pageTitle}</h2>
      <p style={{ textAlign: "center", marginBottom: "1rem" }}>
        {pageSubtitle}
      </p>

      {displayIdentifier ? (
        <p style={{ textAlign: "center", marginBottom: "1rem", color: "#6b7280" }}>
          Code sent to {displayIdentifier}
        </p>
      ) : null}

      {alert && (
        <div
          style={{
            marginBottom: 15,
            padding: "10px",
            borderRadius: 10,
            background: alertType === "error" ? "#fee2e2" : "#e6f4ea",
            boxShadow: "inset 4px 4px 8px #c5ccd6, inset -4px -4px 8px #ffffff",
            fontSize: 13,
            color: alertType === "error" ? "#991b1b" : "#166534",
          }}
        >
          {alert}
        </div>
      )}

      <input
        className="neu-input"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        disabled={loading}
        style={{ marginBottom: "1rem" }}
      />

      <button
        className="neu-button"
        onClick={handleVerifyOTP}
        disabled={loading || otp.length !== 6}
        style={{ width: "100%", marginBottom: "1rem" }}
      >
        {loading ? "Processing..." : buttonText}
      </button>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleResendOTP}
          disabled={countdown > 0 || resendLoading}
          style={{
            background: "none",
            border: "none",
            color: countdown > 0 || resendLoading ? "#999" : "#007bff",
            cursor: countdown > 0 || resendLoading ? "not-allowed" : "pointer",
            textDecoration: "underline",
          }}
        >
          {resendLoading
            ? "Sending..."
            : countdown > 0
            ? `Resend OTP in ${countdown}s`
            : "Resend OTP"}
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <a
          href="/signin"
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          Back to sign in
        </a>
      </div>
    </div>
  );
}