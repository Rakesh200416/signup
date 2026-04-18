"use client";

import Link from "next/link";
import { FaBookOpen, FaChartLine, FaCheckCircle, FaBell, FaUserGraduate } from "react-icons/fa";

export default function LearnerDashboard() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="neu-card p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Welcome back</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Learner Dashboard</h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                View your learning progress, continue active courses, and stay on track with goals and upcoming deadlines.
              </p>
            </div>

            <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-100 px-5 py-4 shadow-[inset_6px_6px_12px_rgba(209,217,230,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)]">
              <FaUserGraduate className="text-slate-700 text-xl" />
              <div>
                <p className="text-sm text-slate-500">Current learner level</p>
                <p className="text-lg font-semibold text-slate-900">Silver Learner</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="neu-card p-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-sky-100 text-sky-700 shadow-[6px_6px_12px_rgba(209,217,230,0.6),-6px_-6px_12px_rgba(255,255,255,0.9)]">
              <FaBookOpen className="text-xl" />
            </div>
            <p className="mt-4 text-sm text-slate-500">Active courses</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">4</h2>
          </article>

          <article className="neu-card p-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 shadow-[6px_6px_12px_rgba(209,217,230,0.6),-6px_-6px_12px_rgba(255,255,255,0.9)]">
              <FaChartLine className="text-xl" />
            </div>
            <p className="mt-4 text-sm text-slate-500">Course progress</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">72%</h2>
          </article>

          <article className="neu-card p-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-100 text-indigo-700 shadow-[6px_6px_12px_rgba(209,217,230,0.6),-6px_-6px_12px_rgba(255,255,255,0.9)]">
              <FaCheckCircle className="text-xl" />
            </div>
            <p className="mt-4 text-sm text-slate-500">Completed modules</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">18</h2>
          </article>

          <article className="neu-card p-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 shadow-[6px_6px_12px_rgba(209,217,230,0.6),-6px_-6px_12px_rgba(255,255,255,0.9)]">
              <FaBell className="text-xl" />
            </div>
            <p className="mt-4 text-sm text-slate-500">Upcoming reminders</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">2</h2>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <div className="neu-card p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Next milestone</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Complete all required certifications</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">3 days left</span>
            </div>

            <div className="mt-8 rounded-3xl bg-slate-100 p-5 shadow-[inset_6px_6px_12px_rgba(209,217,230,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]">
              <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
                <span>Progress</span>
                <span className="font-semibold text-slate-900">72%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-sky-500" style={{ width: "72%" }} />
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="neu-card p-6">
              <h3 className="text-lg font-semibold text-slate-900">Quick actions</h3>
              <div className="mt-5 space-y-3">
                <Link href="/courses" className="neu-button neu-button-secondary w-full text-left">
                  Continue learning
                </Link>
                <Link href="/verify-otp" className="neu-button neu-button-secondary w-full text-left">
                  Confirm recovery OTP
                </Link>
                <Link href="/forgot-password" className="neu-button neu-button-secondary w-full text-left">
                  Reset password
                </Link>
              </div>
            </div>

            <div className="neu-card p-6 bg-slate-900 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Tip</p>
              <p className="mt-3 text-base leading-7">
                Keep your account secure by updating your password regularly and completing courses on schedule.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
