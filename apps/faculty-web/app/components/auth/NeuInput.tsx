"use client";

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function NeuInput({ label, className = "", ...props }: NeuInputProps) {
  return (
    <label className="block text-sm text-slate-700">
      <span className="mb-2 block font-medium">{label}</span>
      <input
        className={`neu-input ${className}`}
        {...props}
      />
    </label>
  );
}
