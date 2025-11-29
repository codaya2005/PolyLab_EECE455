import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import { ArrowUpRight } from "lucide-react";

const pages = [
  { path: "/", title: "Landing", desc: "Marketing hero and overview" },
  { path: "/signup", title: "Sign Up", desc: "Create a new account" },
  { path: "/verify", title: "Verify Email", desc: "Token submission screen" },
  { path: "/login", title: "Login", desc: "Session sign-in with optional MFA" },
  { path: "/forgot", title: "Forgot Password", desc: "Password reset request" },
  { path: "/calculator", title: "GF Calculator", desc: "Field operations playground" },
  { path: "/student", title: "Student Dashboard", desc: "Student view and classroom join" },
  { path: "/instructor/request", title: "Request Instructor", desc: "Upload proof for instructor role" },
  { path: "/instructor", title: "Instructor Dashboard", desc: "Instructor landing page" },
  { path: "/instructor/classrooms", title: "Classrooms List", desc: "Instructor classrooms overview" },
  { path: "/instructor/classrooms/123", title: "Classroom Detail", desc: "Single classroom detail mock" },
  { path: "/admin", title: "Admin Dashboard", desc: "Admin moderation and review" },
  { path: "/docs", title: "Docs", desc: "Platform docs placeholder" },
  { path: "/tutorials", title: "Tutorials", desc: "Walkthroughs and labs" },
  { path: "/examples", title: "Examples", desc: "Sample problems and templates" },
  { path: "/security", title: "Security", desc: "Security model notes" },
];

export default function PageGallery() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Preview</p>
            <h1 className="text-3xl font-bold tracking-tight">All Pages</h1>
            <p className="text-slate-400 mt-1">Quick links to every screen so designers/devs can open them fast.</p>
          </div>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 hover:border-cyan-500/50"
          >
            Back to landing
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-cyan-500/50 hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm text-slate-500">{page.path}</div>
                  <div className="text-xl font-semibold">{page.title}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400" />
              </div>
              <p className="mt-3 text-sm text-slate-400 leading-6">{page.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
