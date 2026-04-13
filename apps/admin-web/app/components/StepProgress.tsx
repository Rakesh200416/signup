import React from "react";

export function StepProgress({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      {steps.map((step, index) => {
        const isActive = index === current;
        const isComplete = index < current;
        return (
          <div key={step} className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition ${
                isComplete
                  ? "bg-[#8ec9ff] text-white"
                  : isActive
                  ? "bg-[#3549ff] text-white shadow-[inset_2px_2px_6px_rgba(0,0,0,0.1)]"
                  : "bg-[#e6ebf2] text-[#6b7280]"
              }`}
            >
              {index + 1}
            </span>
            <span className={`text-sm ${isActive ? "font-semibold text-[#111827]" : "text-[#6b7280]"}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
