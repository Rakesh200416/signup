"use client";

type Props = {
  password: string;
};

export default function PasswordStrength({ password }: Props) {
  if (!password) return null;

  if (password.length < 8) {
    return <p className="warning">Use at least 8 characters.</p>;
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return <p className="warning">Add letters, numbers and symbols.</p>;
  }

  return <p className="success">Strong password ✔</p>;
}