"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setEnabled(isDark);
  }, []);

  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    setEnabled(!enabled);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-[#e6ebf2] px-4 py-2 text-sm text-[#111827] shadow-[5px_5px_10px_#c1c7d0,-5px_-5px_10px_#ffffff] transition-all duration-200 hover:-translate-y-0.5"
    >
      <span>{enabled ? "Light mode" : "Dark mode"}</span>
      <span className="inline-flex h-6 w-10 items-center rounded-full bg-[#d9dfea] p-1 transition-all">
        <span className={`h-4 w-4 rounded-full bg-[#1f2937] transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
      </span>
    </button>
  );
}
