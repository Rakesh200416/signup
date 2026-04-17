"use client";

interface VerificationMethodSelectProps {
  email?: string;
  mobile?: string;
  selectedMethod: "email" | "mobile";
  onSelect: (method: "email" | "mobile") => void;
}

const labels = {
  email: "Email OTP",
  mobile: "SMS OTP",
};

export default function VerificationMethodSelect({
  email,
  mobile,
  selectedMethod,
  onSelect,
}: VerificationMethodSelectProps) {
  return (
    <div className="space-y-3 rounded-[1.75rem] border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-700">Choose verification method</p>
      <div className="grid grid-cols-2 gap-3">
        {email ? (
          <button
            type="button"
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              selectedMethod === "email"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => onSelect("email")}
          >
            <div className="font-semibold">{labels.email}</div>
            <div className="text-xs text-slate-500">{email}</div>
          </button>
        ) : null}

        {mobile ? (
          <button
            type="button"
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              selectedMethod === "mobile"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => onSelect("mobile")}
          >
            <div className="font-semibold">{labels.mobile}</div>
            <div className="text-xs text-slate-500">{mobile}</div>
          </button>
        ) : null}
      </div>
    </div>
  );
}
