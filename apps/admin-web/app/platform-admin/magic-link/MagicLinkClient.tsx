"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "../../lib/api";
import { ToasterClient } from "../../components/ToasterClient";

const fetchCsrfToken = async () => {
  const response = await api.get("/auth/csrf-token");
  return response.data?.csrfToken;
};

export default function MagicLinkClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Validating magic link...");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No magic link token provided.");
      return;
    }

    const validateLink = async () => {
      try {
        const csrfToken = await fetchCsrfToken();
        const response = await api.post(
          "/auth/validate-magic-link",
          { token },
          { headers: { "X-CSRF-Token": csrfToken } },
        );
        const email = response.data?.email;
        setEmail(email || "");
        setStatus("success");
        setMessage("Welcome to NeuroLXP Platform Admin. Your sign-in link is valid.");
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message ?? error?.message ?? "Magic link validation failed.";
        setStatus("error");
        setMessage(String(errorMessage));
        toast.error(String(errorMessage));
      }
    };

    validateLink();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#e6e8ee] px-6 py-10 text-[#0f172a] dark:bg-[#111827] dark:text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/80 bg-[#eef6ff] p-10 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#17202c] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
          <h1 className="text-3xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Magic link verification</h1>
          <p className="mt-4 text-sm text-[#475569] dark:text-[#cbd5e1]">{message}</p>
          {status === "success" && (
            <div className="mt-6 space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm text-[#0f172a] dark:border-slate-700 dark:bg-[#111827] dark:text-[#f8fafc]">
              {email && <p>Your email: <strong>{email}</strong></p>}
              <p>Click the button below to open the platform admin sign-in page and complete your login.</p>
              <button
                type="button"
                className="rounded-3xl bg-[#2563eb] px-4 py-2 text-white"
                onClick={() => router.push(`/platform-admin/signin?email=${encodeURIComponent(email)}`)}
              >
                Go to platform admin login
              </button>
            </div>
          )}
          {status === "error" && (
            <div className="mt-6 space-y-3 rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-600 dark:bg-[#4b1515] dark:text-red-200">
              <p>Magic link could not be validated.</p>
              <button
                type="button"
                className="rounded-3xl bg-[#2563eb] px-4 py-2 text-white"
                onClick={() => router.push("/platform-admin/signin")}
              >
                Go to platform admin login
              </button>
            </div>
          )}
        </div>
      </div>
      <ToasterClient />
    </main>
  );
}
