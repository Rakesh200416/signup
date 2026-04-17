"use client";

interface PasswordChecklistProps {
  password: string;
}

const checks = [
  { label: "At least 8 characters", test: (password: string) => password.length >= 8 },
  { label: "Contains uppercase", test: (password: string) => /[A-Z]/.test(password) },
  { label: "Contains number", test: (password: string) => /\d/.test(password) },
];

export default function PasswordChecklist({ password }: PasswordChecklistProps) {
  return (
    <div className="password-checklist">
      <h3>Password policy</h3>
      <ul>
        {checks.map((check) => (
          <li key={check.label}>
            <span className={check.test(password) ? "text-emerald-600" : "text-slate-400"}>
              {check.test(password) ? "✓" : "○"}
            </span>
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
