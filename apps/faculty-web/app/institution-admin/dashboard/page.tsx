"use client";

import { useState } from "react";
import NeuButton from "../../components/auth/NeuButton";
import NeuInput from "../../components/auth/NeuInput";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const initialFaculty: TeamMember[] = [
  { id: "f1", name: "Dr. Priya Sharma", email: "priya.sharma@example.com", role: "Faculty" },
  { id: "f2", name: "Dr. Arjun Mehta", email: "arjun.mehta@example.com", role: "Faculty" },
];

const initialCoordinators: TeamMember[] = [
  { id: "c1", name: "Rekha Singh", email: "rekha.singh@example.com", role: "Coordinator" },
  { id: "c2", name: "Naveen Kumar", email: "naveen.kumar@example.com", role: "Coordinator" },
];

export default function InstitutionAdminDashboardPage() {
  const [faculty, setFaculty] = useState(initialFaculty);
  const [coordinators, setCoordinators] = useState(initialCoordinators);
  const [facultyName, setFacultyName] = useState("");
  const [facultyEmail, setFacultyEmail] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [coordinatorEmail, setCoordinatorEmail] = useState("");
  const [message, setMessage] = useState("");

  function addFacultyMember() {
    if (!facultyName.trim() || !facultyEmail.trim()) {
      setMessage("Please enter both name and email for faculty.");
      return;
    }

    const next = {
      id: `f-${Date.now()}`,
      name: facultyName.trim(),
      email: facultyEmail.trim(),
      role: "Faculty",
    };

    setFaculty((current) => [next, ...current]);
    setFacultyName("");
    setFacultyEmail("");
    setMessage("Faculty member added successfully.");
  }

  function addCoordinator() {
    if (!coordinatorName.trim() || !coordinatorEmail.trim()) {
      setMessage("Please enter both name and email for coordinator.");
      return;
    }

    const next = {
      id: `c-${Date.now()}`,
      name: coordinatorName.trim(),
      email: coordinatorEmail.trim(),
      role: "Coordinator",
    };

    setCoordinators((current) => [next, ...current]);
    setCoordinatorName("");
    setCoordinatorEmail("");
    setMessage("Coordinator added successfully.");
  }

  return (
    <section className="neu-shell">
      <div className="neu-card space-y-8 w-full max-w-6xl">
        <header className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Institution Admin</p>
              <h1 className="text-4xl font-semibold text-slate-900">Dashboard</h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                Manage your institution from one place. Add new faculty and coordinators, review staff counts, and keep your team organized.
              </p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-[#f4f8fd] p-5 shadow-[inset_6px_6px_16px_#c1c7d0,inset_-6px_-6px_16px_#ffffff]">
              <p className="text-sm text-slate-500">Total team</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{faculty.length + coordinators.length}</p>
              <div className="mt-3 flex gap-3 text-sm text-slate-600">
                <span>{faculty.length} faculty</span>
                <span className="text-slate-300">|</span>
                <span>{coordinators.length} coordinators</span>
              </div>
            </div>
          </div>
        </header>

        {message ? (
          <div className="auth-alert auth-alert--success">
            <p className="auth-alert__message">{message}</p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="neu-inset p-6">
            <h2 className="text-xl font-semibold text-slate-900">Team overview</h2>
            <p className="mt-3 text-slate-600">Quick actions and team counts to keep your institution on track.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-white p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
                <p className="text-sm text-slate-500">Faculty</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{faculty.length}</p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
                <p className="text-sm text-slate-500">Coordinators</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{coordinators.length}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 grid gap-6">
            <div className="neu-inset p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Add new faculty</h2>
                  <p className="mt-2 text-slate-600">Create a faculty profile so your instructors can be managed from the dashboard.</p>
                </div>
                <NeuButton onClick={addFacultyMember} className="mt-2 sm:mt-0">
                  Add Faculty
                </NeuButton>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NeuInput
                  label="Faculty name"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="Enter name"
                />
                <NeuInput
                  label="Faculty email"
                  value={facultyEmail}
                  onChange={(e) => setFacultyEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="neu-inset p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Add new coordinator</h2>
                  <p className="mt-2 text-slate-600">Add a coordinator to help manage events, schedules, and communication.</p>
                </div>
                <NeuButton onClick={addCoordinator} className="mt-2 sm:mt-0">
                  Add Coordinator
                </NeuButton>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NeuInput
                  label="Coordinator name"
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  placeholder="Enter name"
                />
                <NeuInput
                  label="Coordinator email"
                  value={coordinatorEmail}
                  onChange={(e) => setCoordinatorEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="neu-inset p-6">
            <h2 className="text-xl font-semibold text-slate-900">Faculty members</h2>
            <div className="mt-6 space-y-4">
              {faculty.map((member) => (
                <div key={member.id} className="rounded-3xl bg-white p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
                  <p className="font-semibold text-slate-900">{member.name}</p>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="neu-inset p-6">
            <h2 className="text-xl font-semibold text-slate-900">Coordinators</h2>
            <div className="mt-6 space-y-4">
              {coordinators.map((member) => (
                <div key={member.id} className="rounded-3xl bg-white p-4 shadow-[inset_4px_4px_10px_#c1c7d0,inset_-4px_-4px_10px_#ffffff]">
                  <p className="font-semibold text-slate-900">{member.name}</p>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
