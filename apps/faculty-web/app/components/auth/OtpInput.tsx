"use client";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function OtpInput({ value, onChange }: OtpInputProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="neu-otp"
      placeholder="000000"
      maxLength={6}
      inputMode="numeric"
    />
  );
}
