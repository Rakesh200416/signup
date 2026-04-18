"use client";

import { useState } from "react";

export default function Recovery() {
  const [alert, setAlert] = useState("");
  const [showQR, setShowQR] = useState(false);

  const handleAction = (msg: string) => {
    setAlert(msg);
  };

  const handleQR = () => {
    setShowQR(true);
    setAlert("QR Code displayed for authentication.");
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Recovery Options</h2>

        {alert && <div style={styles.alert}>{alert}</div>}

        <button
          style={styles.button}
          onClick={() => handleAction("Recovery link sent to official email.")}
          onMouseDown={(e) =>
            (e.currentTarget.style.boxShadow =
              "inset 6px 6px 12px #c5ccd6, inset -6px -6px 12px #ffffff")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.boxShadow =
              "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff")
          }
        >
          Recover via Official Email
        </button>

        <button
          style={styles.button}
          onClick={() => handleAction("OTP sent to registered phone number.")}
          onMouseDown={(e) =>
            (e.currentTarget.style.boxShadow =
              "inset 6px 6px 12px #c5ccd6, inset -6px -6px 12px #ffffff")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.boxShadow =
              "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff")
          }
        >
          Recover via Phone Number
        </button>

        <button
          style={styles.button}
          onClick={handleQR}
          onMouseDown={(e) =>
            (e.currentTarget.style.boxShadow =
              "inset 6px 6px 12px #c5ccd6, inset -6px -6px 12px #ffffff")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.boxShadow =
              "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff")
          }
        >
          QR Code Login
        </button>

        {showQR && (
          <div style={styles.qrContainer}>
            <p>Scan this QR code with your authenticator app:</p>
            <div style={styles.qrCode}>
              {/* Placeholder for QR code - in a real implementation, use a QR library */}
              <pre style={styles.qrText}>
{`█████████████████████████████████████████
██ ▄▄▄▄▄ █▄▀█▀▀▄█ ▄▄▄▄▄ ██ ▄▄▄▄▄ █▄▀█▀▀▄█
██ █   █ █ ▀█▄█ █ █   █ ██ █   █ █ ▀█▄█ █
██ █▄▄▄█ █ ▀█▄█ █ █▄▄▄█ ██ █▄▄▄█ █ ▀█▄█ █
██▄▄▄▄▄▄▄█▄█▄█▄█▄▄▄▄▄▄▄█▄▄▄▄▄▄▄▄▄█▄█▄█▄█▄█
██ ▀▄ ▀ ▀▄ ▄ ▀▄ ▀ ▀▄ ▀ ██ ▀▄ ▀ ▀▄ ▄ ▀▄ ▀
██ █▄█▄█▄█▄█▄█▄█▄█▄█▄█ ██ █▄█▄█▄█▄█▄█▄█▄█
██ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ██ ▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀
██▄█▄█▄█▄█▄█▄█▄█▄█▄█▄█▄██▄█▄█▄█▄█▄█▄█▄█▄█
██ ▄▄▄▄▄ █▄▀█▀▀▄█ ▄▄▄▄▄ ██ ▄▄▄▄▄ █▄▀█▀▀▄█
██ █   █ █ ▀█▄█ █ █   █ ██ █   █ █ ▀█▄█ █
██ █▄▄▄█ █ ▀█▄█ █ █▄▄▄█ ██ █▄▄▄█ █ ▀█▄█ █
██▄▄▄▄▄▄▄█▄█▄█▄█▄▄▄▄▄▄▄█▄▄▄▄▄▄▄▄▄█▄█▄█▄█▄█
█████████████████████████████████████████`}
              </pre>
            </div>
          </div>
        )}

        <p style={styles.note}>
          If all methods fail, Platform Admin / Institute Admin / Coordinator will reset credentials.
        </p>
      </div>
    </div>
  );
}

const styles: {
  wrapper: React.CSSProperties;
  card: React.CSSProperties;
  title: React.CSSProperties;
  button: React.CSSProperties;
  note: React.CSSProperties;
  alert: React.CSSProperties;
  qrContainer: React.CSSProperties;
  qrCode: React.CSSProperties;
  qrText: React.CSSProperties;
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
    marginBottom: 20,
    fontWeight: 600,
    color: "#333",
  },

  button: {
    width: "100%",
    marginTop: 12,
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    background: "#e6ebf2",
    boxShadow: "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff",
    transition: "0.2s",
    fontWeight: 500,
  },

  note: {
    marginTop: 15,
    fontSize: 12,
    color: "#666",
  },

  alert: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    background: "#e6ebf2",
    boxShadow: "inset 5px 5px 10px #c5ccd6, inset -5px -5px 10px #ffffff",
    fontSize: 13,
    color: "#444",
  },

  qrContainer: {
    marginTop: 20,
    padding: 20,
    background: "#f9f9f9",
    borderRadius: 10,
    boxShadow: "inset 4px 4px 8px #c5ccd6, inset -4px -4px 8px #ffffff",
  },

  qrCode: {
    marginTop: 10,
  },

  qrText: {
    fontFamily: "monospace",
    fontSize: 8,
    lineHeight: "8px",
    color: "#000",
  },
};
