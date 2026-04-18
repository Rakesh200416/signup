"use client";
import { useState } from "react";
import Alert from "../components/Alert";
import InputField from "../components/InputField";
import styles from "../styles.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email) return "Email cannot be empty.";
    if (!email.includes("@")) return "This email does not look valid.";
    if (!password) return "Password cannot be empty.";
    return "";
  };

  const handleLogin = async () => {
    const error = validate();
    if (error) return setAlert(error);

    try {
      setLoading(true);
      setAlert("");

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          captchaToken: "valid-captcha-token-2024",
          acceptTerms: true,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAlert(
          typeof data.message === "string"
            ? data.message
            : "Login failed. Please try again."
        );
        return;
      }

      setAlert("You are in. Welcome aboard.");
    } catch {
      setAlert("Server issue. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED ROUTE HERE
  const handleForgotPassword = () => {
    router.push("/auth/co-ordinator/forgot-password");
  };

  // ✅ FIXED ROUTE HERE
  const handleSignUp = () => {
    router.push("/auth/co-ordinator/signup");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Coordinator Login</h2>

        <Alert type="error" message={alert} />

        <InputField
          type="email"
          placeholder="Institute Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <InputField
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>

        {/* LINKS */}
        <div className={styles.authLinks}>
          <span onClick={handleForgotPassword} style={{ cursor: "pointer" }}>
            Forgot Password?
          </span>

          <span>
            Don’t have an account?{" "}
            <Link href="/auth/co-ordinator/signup">
                <b style={{ cursor: "pointer" }}>Sign Up</b>
            </Link>
            </span>
        </div>
      </div>
    </div>
  );
}
