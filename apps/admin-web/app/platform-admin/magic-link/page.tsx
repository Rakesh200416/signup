import { Suspense } from "react";
import MagicLinkClient from "./MagicLinkClient";

export default function PlatformAdminMagicLinkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e6e8ee] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]"><div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8"><div className="w-full max-w-2xl text-center">Validating magic link…</div></div></div>}>
      <MagicLinkClient />
    </Suspense>
  );
}
