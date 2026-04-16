"use client";

import { Toaster } from "react-hot-toast";

interface ToasterClientProps {
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

export function ToasterClient({ position = "top-right" }: ToasterClientProps) {
  return (
    <Toaster
      position={position}
      gutter={14}
      containerStyle={position === "top-center" ? { top: "50%", transform: "translateY(-50%)" } : undefined}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#e8edf4",
          color: "#1a2433",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.85)",
          boxShadow: "12px 12px 24px rgba(177,190,204,0.4), -10px -10px 24px rgba(255,255,255,0.92)",
          padding: "16px 20px",
        },
      }}
    />
  );
}
