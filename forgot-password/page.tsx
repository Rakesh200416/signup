"use client";

import { useState } from "react";
import styles from "../styles.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = () => {
    if (!email) {
      setMessage("Email is required.");
      return;
    }

    if (!email.includes("@")) {
      setMessage("Enter a valid email.");
      return;
    }

    setMessage("Password reset link sent to your email.");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Recover Password</h2>

        {message && <p className={styles.alert}>{message}</p>}

        <input
          className={styles.input}
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className={styles.button} onClick={handleReset}>
          Send Reset Link
        </button>
      </div>
    </div>
  );
}