import React from "react";

export function NeumorphicCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        "neumorphic-surface rounded-[32px] bg-[#e0e5ec] p-8 text-[#2d3436] " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}
