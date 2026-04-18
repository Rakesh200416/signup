"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NeumorphicInput from "../../components/NeumorphicInput";
import NeumorphicButton from "../../components/NeumorphicButton";
import AlertBox from "../../components/AlertBox";
import { facultyAuthApi } from "../../lib/api";

function validatePassword(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  return "";
}

export default function Forgot() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = async () => {
    if (!email) {
      setAlert("Email cannot be empty.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setAlert(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setAlert("Passwords must match.");
      return;
    }

    try {
      setLoading(true);
      setAlert("");
      await facultyAuthApi.sendOtp({ channel: "email", target: email, purpose: "recovery" });
      setOtpSent(true);
      setAlert("OTP sent to your email. Enter the OTP below.");
    } catch (error: any) {
      setAlert(error.message || "Unable to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otp) {
      setAlert("Please enter the OTP.");
      return;
    }

    try {
      setLoading(true);
      setAlert("");
      await facultyAuthApi.resetPassword({
        email,
        password,
        confirmPassword,
        otpCode: otp,
      });
      setAlert("Password reset successfully. You can now log in with your new password.");
      setTimeout(() => router.push("/faculty/auth/signin"), 2000);
    } catch (error: any) {
      setAlert(error.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Password</h2>

        <AlertBox message={alert} />

        <NeumorphicInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
          disabled={otpSent}
        />

        <NeumorphicInput
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          disabled={otpSent}
        />

        <NeumorphicInput
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e: any) => setConfirmPassword(e.target.value)}
          disabled={otpSent}
        />

        {!otpSent ? (
          <NeumorphicButton onClick={sendOtp} disabled={loading}>
            Send OTP
          </NeumorphicButton>
        ) : (
          <>
            <NeumorphicInput
              placeholder="Enter OTP"
              value={otp}
              onChange={(e: any) => setOtp(e.target.value)}
            />
            <NeumorphicButton onClick={resetPassword} disabled={loading}>
              Reset Password
            </NeumorphicButton>
          </>
        )}

        <p style={styles.note}>
          Remember your password? <a href="/faculty/auth/signin" style={styles.link}>Sign In</a>
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
  link: React.CSSProperties;
} = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#e6ebf2",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "#e6ebf2",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "20px 20px 40px #c5ccd6, -20px -20px 40px #ffffff",
    textAlign: "center",
    maxWidth: "400px",
    width: "100%",
  },
  title: {
    fontSize: "24px",
    marginBottom: "20px",
    color: "#333",
  },
  note: {
    fontSize: "14px",
    color: "#666",
    marginTop: "20px",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
  },
};
