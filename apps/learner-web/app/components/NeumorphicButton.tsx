import React from 'react';

interface NeumorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function NeumorphicButton({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: NeumorphicButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'neu-button-secondary';
      case 'danger':
        return 'neu-button-danger';
      case 'primary':
      default:
        return 'neu-button-primary';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      case 'md':
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      className={`neu-button ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}