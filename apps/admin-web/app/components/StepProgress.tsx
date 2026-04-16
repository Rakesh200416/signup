import React from "react";

export function StepProgress({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {steps.map((step, index) => {
        const isActive = index === current;
        const isComplete = index < current;
        const circleStyles = isComplete
          ? "bg-[#dbe8ff] text-[#2563eb] border-[#2563eb]"
          : isActive
          ? "bg-[#e6efff] text-[#1e40af] border-[#1e40af]"
          : "bg-[#eef2f8] text-[#64748b] border-[#cbd5e1]";

        const labelStyles = isActive ? "text-[#111827] font-semibold" : "text-[#64748b]";

        return (
          <div key={step} className="flex flex-col items-center gap-3">
            <button
              type="button"
              aria-current={isActive ? "step" : undefined}
              className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-lg font-semibold transition duration-200 animate-up-1 ${circleStyles}`}
            >
              {index + 1}
            </button>
            <span className={`text-center text-sm ${labelStyles}`}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}
