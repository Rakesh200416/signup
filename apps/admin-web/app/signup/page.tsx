"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SignupWizard } from "../components/auth-forms";
import { ToasterClient } from "../components/ToasterClient";

export default function SignupPage() {
  useEffect(() => {
    document.title = "Super Admin Signup | NeuroLXP";
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ffffff_0%,_#eef1f6_22%,_#e6e8ee_56%,_#dde1ea_100%)] px-4 py-10 text-[#273457]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center px-4">
        <div className="w-full">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.45em] text-[#5c6d94]">SUPER ADMIN SIGNUP</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#111827] text-center">Create your account to access the admin workspace</h1>
          </div>
          <SignupWizard />
          <div className="mt-6 text-center text-sm text-[#5c6d94]">
            Already have an account?{' '}
            <Link href="/signin" className="font-semibold text-[#243457] transition duration-200 hover:text-[#1b2740]">
              Sign in
            </Link>
          </div>
        </div>
      </div>
      <ToasterClient position="top-center" />
    </main>
  );
}
