import React from "react";

export function StepProgress({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-8 flex flex-wrap justify-center gap-3 w-full">
      {steps.map((step, index) => {
        const isActive = index === current;
        const isComplete = index < current;

        // Themesberg-style: completed = inset shadow (pressed), active = outset + dark, pending = muted
        const btnClass = isActive
          ? "btn btn-sm btn-secondary"
          : isComplete
          ? ""
          : "btn btn-sm btn-soft";

        return (
          <div key={step} className="flex flex-col items-center gap-2">
            <button
              type="button"
              aria-current={isActive ? "step" : undefined}
              className={isComplete ? "btn-circle flex items-center justify-center rounded-full" : `${btnClass} btn-circle`}
              style={{
                width: "2.575rem",
                height: "2.575rem",
                padding: 0,
                fontWeight: 600,
                ...(isComplete ? {
                  backgroundColor: "#000000",
                  border: "none",
                  boxShadow: "none",
                } : {}),
              }}
            >
              {isComplete ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 16 16">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" fill="#ffffff" strokeWidth="0.5" stroke="#ffffff"/>
                </svg>
              ) : (
                index + 1
              )}
            </button>
            <span
              className="text-center text-xs"
              style={{
                color: isActive ? "#31344b" : isComplete ? "#000000" : "#93a5be",
                fontWeight: isActive || isComplete ? 600 : 400,
                maxWidth: "5rem",
              }}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
