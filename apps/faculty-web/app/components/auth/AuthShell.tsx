"use client";

import React from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <section className="neu-shell">
      <div className="neu-card">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
        </header>
        <div className="space-y-6">{children}</div>
      </div>
    </section>
  );
}
