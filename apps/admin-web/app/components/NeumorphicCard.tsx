import React from "react";

type CardVariant = "default" | "inset" | "lift";

interface NeumorphicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  title?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
}

export function NeumorphicCard({
  children,
  className = "",
  variant = "default",
  title,
  footer,
  header,
}: NeumorphicCardProps) {
  const variantClass =
    variant === "inset" ? "card-inset" :
    variant === "lift" ? "card card-lift-hover" :
    "card";

  return (
    <div className={`${variantClass} ${className}`}>
      {(header || title) && (
        <div className="card-header">
          {header ?? <h5 className="card-title mb-0">{title}</h5>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
