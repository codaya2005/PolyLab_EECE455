// src/components/Navbar.tsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Role = "student" | "instructor" | "admin";

type NavbarProps = {
  email?: string;
  role?: Role;
  onLogout?: () => void | Promise<void>;
};

export default function Navbar({ email, role = "student", onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      if (onLogout) {
        await Promise.resolve(onLogout());
      }
      navigate("/login", { replace: true });
    }
  };

  // dynamic tabs based on role
  const baseTabs = [
    { to: "/calculator", label: "Calculator" },
    { to: "/docs", label: "Docs" },
    { to: "/tutorials", label: "Tutorials" },
  ];


  const tabs = [...baseTabs];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto h-14 w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          onClick={() => {
            if (role === "admin") navigate("/admin");
            else if (role === "instructor") navigate("/instructor");
            else navigate("/student");
          }}
          className="flex items-center gap-2"
        >
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 grid place-items-center text-slate-900 font-black">
            P
          </div>
          <span className="font-semibold tracking-tight">PolyLab</span>
        </button>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-5 text-slate-300">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                "hover:text-white transition-colors " +
                (isActive ? "text-white underline underline-offset-4" : "")
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: user info */}
        <div className="flex items-center gap-3">
          {email && (
            <div className="hidden sm:flex flex-col leading-4 text-xs text-slate-400">
              <span className="truncate max-w-[220px]">{email}</span>
              {role && (
                <span className="inline-flex w-fit items-center rounded-md bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-200">
                  {role[0].toUpperCase() + role.slice(1)}
                </span>
              )}
            </div>
          )}

          {/* Go to dashboard for current role */}
          <Link
            to={`/${role}`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800/60"
            title="Go to Dashboard"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800/60"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
