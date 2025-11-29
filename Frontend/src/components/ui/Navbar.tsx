// src/components/Navbar.tsx
import React, { useEffect, useState } from "react";
import { Home, LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { to: "/docs", label: "Docs" },
  { to: "/tutorials", label: "Tutorials" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Close the mobile sheet on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Allow ESC to close the sheet
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="mx-auto w-full max-w-screen-2xl h-16 px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12 flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          onClick={() => {
            if (user?.role === "admin") navigate("/admin");
            else if (user?.role === "instructor") navigate("/instructor");
            else if (user?.role === "student") navigate("/student");
            else navigate("/");
          }}
          className="flex items-center gap-3 focus:outline-none"
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 grid place-items-center shadow">
            <span className="font-bold text-slate-900">P</span>
          </div>
          <span className="font-semibold tracking-tight text-lg">PolyLab</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-slate-300">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "hover:text-white transition-colors",
                  isActive && "text-white underline underline-offset-4"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-slate-700 text-slate-200 hover:bg-slate-800/50"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4" />
            Home
          </Button>

          <Button
            type="button"
            variant="outline"
            className="gap-2 border-slate-700 text-slate-200"
            onClick={() => navigate("/login")}
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:bg-slate-800/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden border-t border-slate-800/60 bg-slate-950/95">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-5 py-3 space-y-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "block rounded-md px-3 py-2 text-slate-200 hover:bg-slate-800/60",
                    isActive && "bg-slate-800/60 text-white"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}

            <div className="mt-3 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-slate-700 text-slate-200"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4" />
                Home
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-slate-700 text-slate-200"
                onClick={() => navigate("/login")}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
