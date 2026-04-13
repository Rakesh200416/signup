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
        "rounded-3xl bg-[#e6ebf2] px-6 py-3 text-sm font-semibold text-[#1f2937] shadow-[6px_6px_12px_#c1c7d0,-6px_-6px_12px_#ffffff] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[8px_8px_16px_#b8bfd3,-8px_-8px_16px_#ffffff] active:scale-[0.99] dark:bg-[#1f2937] dark:text-[#f8fafc] dark:border-[#334155] " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
