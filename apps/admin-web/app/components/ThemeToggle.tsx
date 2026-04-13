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
      className={`inline-flex items-center gap-2 rounded-full border border-white/70 px-4 py-2 text-sm shadow-[5px_5px_10px_#c1c7d0,-5px_-5px_10px_#ffffff] transition-all duration-200 hover:-translate-y-0.5 ${enabled ? "bg-[#111827] text-white" : "bg-[#e6ebf2] text-[#111827]"}`}
    >
      <span>{enabled ? "Light mode" : "Dark mode"}</span>
      <span className="inline-flex h-6 w-10 items-center rounded-full bg-[#d9dfea] p-1 transition-all">
        <span className={`h-4 w-4 rounded-full bg-[#1f2937] transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
      </span>
    </button>
  );
}
