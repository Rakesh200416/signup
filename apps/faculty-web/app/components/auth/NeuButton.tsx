"use client";

import React from "react";

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function NeuButton({ variant = "primary", className = "", ...props }: NeuButtonProps) {
  return (
    <button
      className={`neu-button neu-button--${variant} ${className}`}
      {...props}
    />
  );
}
