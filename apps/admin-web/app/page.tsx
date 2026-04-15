"use client";

import { LoginForm } from "./components/auth-forms";
import { ToasterClient } from "./components/ToasterClient";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#e0e5ec] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <LoginForm />
        </div>
      </div>
      <ToasterClient />
    </main>
  );
}
