import React from "react";

export function NeumorphicCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-[2rem] border border-white/80 bg-[#e6ebf2] p-8 shadow-[12px_12px_24px_#c1c7d0,-12px_-12px_24px_#ffffff] dark:border-[#334155] dark:bg-[#1f2937] dark:text-[#f8fafc] " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}
