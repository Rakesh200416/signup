import React from "react";

export function NeumorphicButton({
  children,
  type = "button",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; className?: string }) {
  return (
    <button
      type={type}
      className={
        "rounded-3xl bg-[#e6ebf2] px-6 py-3 text-sm font-semibold text-[#1f2937] shadow-[8px_8px_20px_rgba(177,190,204,0.45),-8px_-8px_20px_rgba(255,255,255,0.9)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[10px_10px_24px_rgba(177,190,204,0.55),-10px_-10px_24px_rgba(255,255,255,0.95)] active:scale-[0.98] dark:bg-[#1f2937] dark:text-[#f8fafc] dark:border-[#334155] " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
