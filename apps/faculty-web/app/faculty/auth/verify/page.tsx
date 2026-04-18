"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { facultyAuthApi } from "../../lib/api";
import NeumorphicInput from "../../components/NeumorphicInput";
import NeumorphicButton from "../../components/NeumorphicButton";

export default function VerifyOtp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!email) return setAlert("Email is required.");
    if (!otp || otp.length !== 6) return setAlert("Enter a valid 6-digit OTP.");

    try {
      setLoading(true);
      setAlert("");
      await facultyAuthApi.verifyOTP({ email, otp });
      setAlert("Email verified successfully. You may sign in now.");
      setTimeout(() => router.push("/faculty/auth/signin"), 1200);
    } catch (error: any) {
      setAlert(error.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Verify Faculty OTP</h2>
        {alert && <div style={styles.alert}>{alert}</div>}

        <NeumorphicInput placeholder="Email" onChange={(e: any) => setEmail(e.target.value)} />
        <NeumorphicInput placeholder="OTP code" onChange={(e: any) => setOtp(e.target.value)} />

        <NeumorphicButton onClick={verify} disabled={loading}>
          Verify OTP
        </NeumorphicButton>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    color: "#333",
  },
  alert: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    background: "#fdecea",
    color: "#611a15",
  },
};
