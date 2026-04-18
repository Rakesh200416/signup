"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NeumorphicInput from "../components/NeumorphicInput";
import NeumorphicButton from "../components/NeumorphicButton";
import CheckboxGroup from "../components/CheckboxGroup";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../utils/validation";
import { authApi } from "../lib/api";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [checks, setChecks] = useState<string[]>([]);
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      // Validation
      const e = validateEmail(email);
      const p = validatePassword(password);
      const n = validateUsername(name);

      if (e || p || n) {
        setAlert(e || p || n || "Validation error");
        return;
      }

      if (!checks.length) {
        setAlert("Please accept required LMS access conditions.");
        return;
      }

      setLoading(true);
      setAlert("");

      // Call API to create account
      const response = await authApi.signup({
        name,
        email,
        password,
      });

      setAlert("Account created successfully! Redirecting to verification...");
      
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
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
        <h2 style={styles.title}>Create Account</h2>

        {/* ALERT */}
        {alert && <div style={styles.alert}>{alert}</div>}

        {/* INPUTS */}
        <div style={styles.inputGroup}>
          <NeumorphicInput
            placeholder="Name"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            disabled={loading}
          />

          <NeumorphicInput
            placeholder="Email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            disabled={loading}
          />

          <NeumorphicInput
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* CHECKBOX */}
        <div style={styles.checkboxBox}>
          <CheckboxGroup values={checks} setValues={setChecks} />
        </div>

        {/* BUTTON */}
        <button
          style={styles.button}
          onClick={handleSubmit}
          disabled={loading}
          onMouseDown={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "scale(0.96)";
              e.currentTarget.style.boxShadow =
                "inset 6px 6px 12px #c5ccd6, inset -6px -6px 12px #ffffff";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff";
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.boxShadow =
                "10px 10px 22px #c5ccd6, -10px -10px 22px #ffffff";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff";
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        {/* FOOTER */}
        <p style={styles.footer}>
          Quick signup • Secure LMS access • No spam
        </p>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: any = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#e6ebf2",
    padding: "20px",
  },

  card: {
    width: 430,
    padding: "45px",
    borderRadius: "26px",
    background: "#e6ebf2",
    boxShadow: "10px 10px 25px #c5ccd6, -10px -10px 25px #ffffff",
    textAlign: "center",
  },

  title: {
    marginBottom: 22,
    fontWeight: 600,
    color: "#333",
    letterSpacing: "0.5px",
  },

  alert: {
    marginBottom: 15,
    padding: "12px",
    borderRadius: "14px",
    background: "#e6ebf2",
    boxShadow:
      "inset 5px 5px 10px #c5ccd6, inset -5px -5px 10px #ffffff",
    fontSize: 13,
    color: "#444",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  checkboxBox: {
    marginTop: 12,
    marginBottom: 18,
    textAlign: "left",
  },

  button: {
    width: "100%",
    marginTop: 10,
    padding: "15px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    background: "#e6ebf2",
    boxShadow: "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff",
    fontWeight: 600,
    fontSize: "15px",
    transition: "all 0.2s ease-in-out",
    color: "#333",
  },

  footer: {
    marginTop: 18,
    fontSize: 12,
    color: "#666",
  },
};