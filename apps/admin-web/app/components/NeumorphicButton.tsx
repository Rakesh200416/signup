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
        "neumorphic-button animate-up-1 px-6 py-3 text-sm font-semibold " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
