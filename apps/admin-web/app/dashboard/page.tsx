"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const LOGOUT_TIMEOUT_MS = 10 * 60 * 1000;

const stats = [
  { title: "total tenants", value: "230", accent: "from-[#3b82f6] to-[#93c5fd]" },
  { title: "total students", value: "5,430", accent: "from-[#60a5fa] to-[#93c5fd]" },
  { title: "total faculties", value: "112", accent: "from-[#38bdf8] to-[#7dd3fc]" },
  { title: "total exams", value: "340", accent: "from-[#0ea5e9] to-[#22d3ee]" },
  { title: "active alerts", value: "2", accent: "from-[#2563eb] to-[#60a5fa]" },
];

const navItems = ["Dashboard", "Analytics", "Users", "Settings", "Logout"];
const activities = [
  "Provisioned new institution account",
  "Updated Super Admin profile",
  "Enabled OTP for user john.doe@example.com",
  "Reviewed account access logs",
  "Generated weekly activity report",
];
const tasks = [
  "Approve institution admin requests",
  "Review verification workflows",
  "Verify daily sign-in reports",
  "Validate new tenant onboarding",
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [resetPasswordClicked, setResetPasswordClicked] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const logoutTimeoutRef = useRef<number | null>(null);

  const resetLogoutTimer = () => {
    lastActivityRef.current = Date.now();
    if (logoutTimeoutRef.current !== null) {
      window.clearTimeout(logoutTimeoutRef.current);
    }
    logoutTimeoutRef.current = window.setTimeout(() => {
      setUser(null);
      router.push("/");
    }, LOGOUT_TIMEOUT_MS);
  };

  useEffect(() => {
    setUser({ name: "Super Admin", email: "admin@lms.example" });
    setResetPasswordClicked(sessionStorage.getItem("resetPasswordClicked") === "true");
    resetLogoutTimer();

    const handleActivity = () => resetLogoutTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      if (logoutTimeoutRef.current) {
        window.clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  const handleResetPasswordClick = () => {
    sessionStorage.setItem("resetPasswordClicked", "true");
    setResetPasswordClicked(true);
    router.push("/reset-password");
  };

  const handleLogout = () => {
    setUser(null);
    router.push("/");
  };

  const handleNavClick = (item: string) => {
    if (item === "Logout") {
      handleLogout();
      return;
    }
    setActiveTab(item);
  };

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  return (
    <main className="min-h-screen w-full bg-[#ecf4ff] px-4 py-6 text-[#0f172a] transition-colors duration-300 dark:bg-[#0f172a] dark:text-[#f8fafc] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1800px] gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="sticky top-6 self-start rounded-[2rem] border border-white/80 bg-[#e8f0ff] p-6 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] backdrop-blur-xl dark:border-white/10 dark:bg-[#16202c] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
          <div className="mb-8 rounded-[1.75rem] bg-white/90 p-5 shadow-[inset_6px_6px_16px_rgba(173,191,216,0.35),inset_-6px_-6px_16px_rgba(255,255,255,0.95)] dark:bg-[#1c2939] dark:shadow-[inset_4px_4px_12px_rgba(0,0,0,0.35),inset_-4px_-4px_12px_rgba(255,255,255,0.05)]">
            <p className="text-xs uppercase tracking-[0.4em] text-[#475569] dark:text-[#94a3b8]">Super Admin</p>
            <h2 className="mt-4 text-3xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Dashboard</h2>
            <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-[#cbd5e1]">A polished, full-screen neumorphic workspace with a cool blue glow.</p>
          </div>

          <nav className="space-y-3">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className={`flex w-full items-center gap-3 rounded-[1.5rem] border px-5 py-4 text-left text-sm font-semibold transition ${
                  activeTab === item
                    ? "border-[#93c5fd] bg-[#dbeafe] text-[#1d4ed8] shadow-[inset_6px_6px_16px_rgba(92,135,246,0.18),inset_-6px_-6px_16px_rgba(255,255,255,0.95)]"
                    : "border-white/80 bg-[#f8fbff] text-[#0f172a] shadow-[6px_6px_16px_rgba(177,190,204,0.25),-6px_-6px_16px_rgba(255,255,255,0.95)] hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white"
                } dark:border-white/10 dark:bg-[#1f2937] dark:text-[#f8fafc] dark:shadow-[6px_6px_16px_rgba(0,0,0,0.35),-6px_-6px_16px_rgba(255,255,255,0.05)]`}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#dbeafe] to-[#c7d9ff] text-[#1d4ed8]">{item[0]}</span>
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="grid gap-6">
          <div className="grid gap-6 rounded-[2rem] border border-white/75 bg-[#eef6ff] p-6 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#17202c] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)] lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Super Admin Dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Welcome back, {user?.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#475569] dark:text-[#cbd5e1]">
                The dashboard has been updated into a fully neumorphic workspace with a cool blue glow, full-screen layout, and polished admin actions.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 rounded-[1.75rem] bg-white/90 p-4 shadow-[8px_8px_20px_rgba(177,190,204,0.25),-8px_-8px_20px_rgba(255,255,255,0.9)] dark:bg-[#1f2937] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.3),-8px_-8px_20px_rgba(255,255,255,0.06)]">
              <button
                type="button"
                onClick={handleResetPasswordClick}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  resetPasswordClicked
                    ? "border-[#cbd5e1] bg-[#f8fbff] text-[#0f172a] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#f8fafc]"
                    : "border-red-200 bg-red-50 text-red-700 shadow-[inset_2px_2px_6px_rgba(248,113,113,0.15)] hover:bg-red-100 dark:border-red-500/30 dark:bg-[#3b1820] dark:text-red-300"
                }`}
              >
                Reset password
              </button>
              <div className="flex items-center gap-3 rounded-full border border-white/80 bg-[#f8fbff] p-3 shadow-[6px_6px_12px_rgba(177,190,204,0.25),-6px_-6px_12px_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-[#111827]">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#dbeafe] to-[#a5b9ff] text-2xl text-[#1d4ed8] dark:from-[#111827] dark:to-[#1f2937] dark:text-[#93c5fd]">SA</div>
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Signed in as</p>
                  <p className="mt-1 text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc]">{user?.name}</p>
                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.75rem] border border-white/80 bg-[#f8fbff] p-5 shadow-[8px_8px_20px_rgba(177,190,204,0.25),-8px_-8px_20px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#1f2937] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.35),-8px_-8px_20px_rgba(255,255,255,0.06)]"
              >
                <div className={`inline-flex rounded-3xl bg-gradient-to-br ${item.accent} px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-black/10`}>
                  {item.title.split(" ")[1] || item.title[0]}
                </div>
                <p className="mt-5 text-sm uppercase tracking-[0.3em] text-[#64748b] dark:text-[#94a3b8]">{item.title}</p>
                <p className="mt-4 text-3xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
            <div className="rounded-[2rem] border border-white/75 bg-[#eef6ff] p-6 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#17202c] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Recent activities</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Live activity stream</h2>
                </div>
                <span className="rounded-3xl bg-[#dbeafe] px-4 py-2 text-sm text-[#2563eb] shadow-[6px_6px_12px_rgba(177,190,204,0.25),-6px_-6px_12px_rgba(255,255,255,0.95)] dark:bg-[#1f2937] dark:text-[#93c5fd]">Updated now</span>
              </div>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity} className="rounded-[1.5rem] bg-white/90 p-4 shadow-[inset_6px_6px_14px_rgba(177,190,204,0.25),inset_-6px_-6px_14px_rgba(255,255,255,0.9)] dark:bg-[#1f2937] dark:shadow-[inset_4px_4px_12px_rgba(0,0,0,0.35),inset_-4px_-4px_12px_rgba(255,255,255,0.05)]">
                    <p className="text-sm font-medium text-[#0f172a] dark:text-[#f8fafc]">{activity}</p>
                    <p className="mt-2 text-xs text-[#64748b] dark:text-[#94a3b8]">2 min ago</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-white/75 bg-[#eef6ff] p-6 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#17202c] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">User status</p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">All systems healthy</h3>
                  </div>
                  <div className="rounded-full border border-white/80 bg-[#f8fbff] p-3 shadow-[6px_6px_12px_rgba(177,190,204,0.25),-6px_-6px_12px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#1f2937]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[inset_4px_4px_10px_rgba(177,190,204,0.25),inset_-4px_-4px_10px_rgba(255,255,255,0.95)] dark:bg-[#111827]">
                      <div className="h-12 w-12 rounded-full bg-[#1d4ed8] dark:bg-[#bfdbfe]" />
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#475569] dark:text-[#cbd5e1]">View the current platform health and status indicators to ensure every tenant, student, faculty, and exam workflow is operating smoothly.</p>
              </div>
              <div className="rounded-[2rem] border border-white/75 bg-[#eef6ff] p-6 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#17202c] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
                <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">View reports</p>
                <div className="mt-6 flex h-32 items-center justify-center rounded-[1.75rem] bg-white/90 text-center text-xl font-semibold text-[#0f172a] shadow-[inset_6px_6px_14px_rgba(177,190,204,0.25),inset_-6px_-6px_14px_rgba(255,255,255,0.9)] dark:bg-[#1f2937] dark:text-[#f8fafc] dark:shadow-[inset_4px_4px_12px_rgba(0,0,0,0.35),inset_-4px_-4px_12px_rgba(255,255,255,0.05)]">
                  Quick analytics overview
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-[2rem] border border-white/75 bg-[#eef6ff] p-6 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#17202c] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Today tasks</h3>
                <span className="rounded-3xl bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#2563eb] dark:bg-[#1f2937] dark:text-[#93c5fd]">4 items</span>
              </div>
              <ul className="mt-5 space-y-4">
                {tasks.map((task) => (
                  <li key={task} className="flex items-center gap-4 rounded-[1.5rem] border border-white/80 bg-white/90 px-4 py-4 shadow-[inset_6px_6px_14px_rgba(177,190,204,0.25),inset_-6px_-6px_14px_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-[#1f2937] dark:text-[#f8fafc] dark:shadow-[inset_4px_4px_12px_rgba(0,0,0,0.35),inset_-4px_-4px_12px_rgba(255,255,255,0.05)]">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2563eb] text-[10px] text-white">✓</span>
                    <span className="text-sm text-[#475569] dark:text-[#cbd5e1]">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[2rem] border border-white/75 bg-[#eef6ff] p-6 shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#17202c] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-[#475569] dark:text-[#94a3b8]">Add members</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#0f172a] dark:text-[#f8fafc]">Invite admin roles</h3>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => router.push("/platform-admin/signup")}
                  className="flex w-full items-center justify-between rounded-[1.75rem] border border-white/80 bg-[#f8fbff] px-5 py-4 text-left text-sm font-semibold text-[#0f172a] shadow-[6px_6px_12px_rgba(177,190,204,0.25),-6px_-6px_12px_rgba(255,255,255,0.95)] transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#1f2937] dark:text-[#f8fafc]"
                >
                  <span>Add platform admin</span>
                  <span className="rounded-2xl bg-[#eff6ff] px-3 py-2 text-sm text-[#2563eb] dark:bg-[#111827] dark:text-[#93c5fd]">+</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/platform-admin/signup")}
                  className="flex w-full items-center justify-between rounded-[1.75rem] border border-white/80 bg-[#f8fbff] px-5 py-4 text-left text-sm font-semibold text-[#0f172a] shadow-[6px_6px_12px_rgba(177,190,204,0.25),-6px_-6px_12px_rgba(255,255,255,0.95)] transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#1f2937] dark:text-[#f8fafc]"
                >
                  <span>Open platform admin signup page</span>
                  <span className="rounded-2xl bg-[#eff6ff] px-3 py-2 text-sm text-[#2563eb] dark:bg-[#111827] dark:text-[#93c5fd]">+</span>
                </button>
              </div>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
