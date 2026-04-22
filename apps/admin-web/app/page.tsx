import { SuperAdminSigninFlow } from "./components/SuperAdminSigninFlow";
import { ToasterClient } from "./components/ToasterClient";

export const metadata = {
  title: "Super Admin Sign in | LMS Admin",
  description: "Secure Super Admin access to the LMS portal.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ffffff_0%,_#eef1f6_22%,_#e6e8ee_56%,_#dde1ea_100%)] px-4 py-10 text-[#273457]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-start justify-center py-12">
        <div className="w-full rounded-[32px] border border-white/80 bg-[#e6e8ee] p-8 shadow-[8px_8px_20px_#b8b9be,-8px_-8px_20px_#ffffff]">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.45em] text-[#5c6d94]">Super Admin</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#111827]">Sign In</h1>
          </div>
          <SuperAdminSigninFlow redirectTo="/dashboard" />
        </div>
      </div>
      <ToasterClient position="top-center" />
    </main>
  );
}
