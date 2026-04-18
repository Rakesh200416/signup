"use client";

export default function ResetRequest() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Password Reset Request</h2>
        <p style={styles.text}>
          Please enter your institute email or phone number to receive reset instructions.
        </p>
      </div>
    </div>
  );
}

const styles: {
  wrapper: React.CSSProperties;
  card: React.CSSProperties;
  title: React.CSSProperties;
  text: React.CSSProperties;
} = {
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
    marginBottom: 15,
    fontWeight: 600,
    color: "#333",
  },

  text: {
    color: "#555",
    lineHeight: 1.6,
  },
};
