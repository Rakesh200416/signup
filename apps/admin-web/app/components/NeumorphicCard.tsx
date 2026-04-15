import React from "react";

export function NeumorphicCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        "neumorphic-surface p-8 text-[#0f172a] dark:text-[#f8fafc] " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}
