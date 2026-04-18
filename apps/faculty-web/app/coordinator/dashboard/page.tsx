"use client";

import AuthShell from "../../components/auth/AuthShell";
import NeuButton from "../../components/auth/NeuButton";

export default function CoordinatorDashboardPage() {
  return (
    <AuthShell
      title="Coordinator Dashboard"
      subtitle="Welcome back. Your coordinator workspace is ready to use."
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Use the coordinator dashboard to manage classes, view schedules, and track student progress.
        </p>
        <NeuButton className="w-full" onClick={() => window.location.reload()}>
          Refresh Session
        </NeuButton>
      </div>
    </AuthShell>
  );
}
