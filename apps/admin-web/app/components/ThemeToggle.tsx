"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
    setEnabled(isDark);
  }, []);

  const toggle = () => {
    const next = !enabled;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
    setEnabled(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center justify-between rounded-full border border-white/80 bg-[#e6ebf2] px-4 py-2 shadow-[8px_8px_18px_rgba(200,201,209,0.35),-8px_-8px_18px_rgba(255,255,255,0.95)] transition duration-200 ${enabled ? "bg-[#1f2937] text-white" : "bg-[#e6ebf2] text-[#111827]"}`}
      aria-pressed={enabled}
    >
      <span className="text-sm font-medium">{enabled ? "Dark mode" : "Light mode"}</span>
      <span className={`relative inline-flex h-9 w-16 items-center rounded-full p-1 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.25),inset_-2px_-2px_6px_rgba(255,255,255,0.95)] transition-colors duration-200 ${enabled ? "bg-[#2f3443]" : "bg-[#d9dfea]"}`}>
        <span className={`block h-7 w-7 rounded-full shadow-[4px_4px_10px_rgba(163,177,198,0.32),-4px_-4px_10px_rgba(255,255,255,0.9)] transition-transform duration-200 ${enabled ? "translate-x-7 bg-[#94a3ff]" : "translate-x-0 bg-white"}`} />
      </span>
    </button>
  );
}
