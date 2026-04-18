"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NeumorphicInput from "../../components/NeumorphicInput";
import NeumorphicButton from "../../components/NeumorphicButton";
import AlertBox from "../../components/AlertBox";
import { facultyAuthApi } from "../../lib/api";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email) return setAlert("Institute email required.");
    if (!password) return setAlert("Password required.");

    try {
      setLoading(true);
      setAlert("");
      await facultyAuthApi.login({ email, password, googleId: googleId || undefined });
      setAlert("Login successful. Welcome Faculty.");
      setTimeout(() => router.push("/faculty/dashboard"), 1000);
    } catch (error: any) {
      setAlert(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2>Faculty Login</h2>

        <AlertBox message={alert} />

        <NeumorphicInput
          placeholder="Institute Email"
          onChange={(e: any) => setEmail(e.target.value)}
        />

        <NeumorphicInput
          placeholder="Password"
          type="password"
          onChange={(e: any) => setPassword(e.target.value)}
        />

        <NeumorphicButton onClick={login}>
          Sign In
        </NeumorphicButton>

        <p style={styles.link} onClick={() => router.push("/faculty/auth/forgot")}>
          Forgot Password?
        </p>

        <p style={styles.link} onClick={() => router.push("/faculty/auth/recovery")}>
          Recovery Options
        </p>
      </div>
    </div>
  );
}

const styles: any = {
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
  link: {
    marginTop: 10,
    fontSize: 12,
    cursor: "pointer",
    color: "#555",
  },
};
