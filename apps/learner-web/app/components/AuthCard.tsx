import React from 'react';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function AuthCard({ title, subtitle, children, className = '' }: AuthCardProps) {
  return (
    <div className={`neu-card max-w-md mx-auto p-6 ${className}`}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}