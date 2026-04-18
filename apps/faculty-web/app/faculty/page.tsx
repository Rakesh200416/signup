import Link from "next/link";

export default function FacultyHome() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Faculty Portal</h1>
        <p style={styles.description}>
          Welcome to the faculty area. Sign in or create an account to continue.
        </p>
        <div style={styles.actions}>
          <Link href="/faculty/auth/signin" style={styles.button}>
            Faculty Sign In
          </Link>
          <Link href="/faculty/auth/signup" style={{ ...styles.button, marginTop: 12 }}>
            Create Faculty Account
          </Link>
        </div>
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
    fontSize: 28,
    marginBottom: 10,
    color: "#222",
  },
  description: {
    color: "#555",
    marginBottom: 24,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
  },
  button: {
    display: "inline-block",
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    background: "#e6ebf2",
    boxShadow: "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff",
    color: "#222",
    textDecoration: "none",
    fontWeight: 600,
  },
};
