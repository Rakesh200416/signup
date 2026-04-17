"use client";

import { useEffect, useState } from "react";

interface AuthAlertProps {
  type: "success" | "info" | "error";
  message: string;
}

const alertTitles: Record<AuthAlertProps["type"], string> = {
  success: "Success",
  info: "New Message",
  error: "Error",
};

export default function AuthAlert({ type, message }: AuthAlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
  }, [message]);

  if (!visible) {
    return null;
  }

  return (
    <div className={`auth-alert auth-alert--${type}`} role="status">
      <div className="auth-alert__header">
        <div>
          <span className="auth-alert__title">{alertTitles[type]}</span>
          <p className="auth-alert__message">{message}</p>
        </div>
        <button
          type="button"
          className="auth-alert__close"
          aria-label="Dismiss notification"
          onClick={() => setVisible(false)}
        >
          ×
        </button>
      </div>
    </div>
  );
}
