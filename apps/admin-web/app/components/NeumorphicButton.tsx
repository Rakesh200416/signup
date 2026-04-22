import React from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "info" | "warning" | "dark" | "gray" | "soft" | "white" | "facebook" | "github" | "google" | "twitter";
type ButtonSize = "sm" | "md" | "lg" | "xs";
type AnimateDir = "up" | "right" | "down" | "left";

interface NeumorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  circle?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  animateDir?: AnimateDir;
  animateAmount?: 1 | 2 | 3 | 4 | 5;
  block?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function NeumorphicButton({
  children,
  type = "button",
  className = "",
  variant = "soft",
  size = "md",
  pill = false,
  circle = false,
  iconOnly = false,
  loading = false,
  animateDir = "up",
  animateAmount = 1,
  block = false,
  iconLeft,
  iconRight,
  disabled,
  ...props
}: NeumorphicButtonProps) {
  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : size === "xs" ? "btn-xs" : "";
  const variantClass = `btn-${variant}`;
  const pillClass = pill ? "btn-pill" : "";
  const circleClass = circle ? "btn-circle" : "";
  const iconOnlyClass = iconOnly ? "btn-icon-only" : "";
  const blockClass = block ? "btn-block" : "";
  const animateClass = `animate-${animateDir}-${animateAmount}`;
  const loadingClass = loading ? "btn-loading-overlay btn-loading" : "";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        "btn",
        variantClass,
        sizeClass,
        pillClass,
        circleClass,
        iconOnlyClass,
        blockClass,
        animateClass,
        loadingClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
        <>
          {iconLeft && <span className="mr-2 inline-flex items-center">{iconLeft}</span>}
          <span className="btn-inner-text">{children}</span>
          <span className="spinner spinner-border spinner-border-sm ml-2" role="status" aria-hidden="true" />
        </>
      ) : iconOnly ? (
        <span aria-hidden="true" className="inline-flex items-center">{iconLeft ?? children}</span>
      ) : (
        <>
          {iconLeft && <span className="mr-2 inline-flex items-center">{iconLeft}</span>}
          {children}
          {iconRight && <span className="ml-2 inline-flex items-center">{iconRight}</span>}
        </>
      )}
    </button>
  );
}
