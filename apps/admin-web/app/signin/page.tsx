import { NeumorphicLoginForm } from "../components/NeumorphicLoginForm";
import { ToasterClient } from "../components/ToasterClient";

export const metadata = {
  title: "Super Admin Sign in | LMS Admin",
  description: "Sign in to the LMS Super Admin portal.",
};

export default function AdminSigninPage() {
  return (
    <main className="min-h-screen bg-[#e6e7ee] px-4 py-10 text-[#273457]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="w-full px-4">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-[#5c6d94]">Super Admin Sign in</p>
          </div>
          <NeumorphicLoginForm redirectTo="/dashboard" pageTitle="Super Admin Sign in" />
        </div>
      </div>
      <ToasterClient position="top-center" />
    </main>
  );
}
