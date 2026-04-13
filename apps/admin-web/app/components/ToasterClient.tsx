"use client";

import { Toaster } from "react-hot-toast";

export function ToasterClient() {
  return <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: "#ffffff", color: "#111827", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)" } }} />;
}
