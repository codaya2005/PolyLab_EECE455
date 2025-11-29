import { Link, NavLink, useNavigate } from "react-router-dom";
import { UserPlus, LogOut, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Props = { email?: string; onLogout?: () => void | Promise<void> };

export default function StudentNavbar({ onLogout }: Props) {
  const { logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto max-w-7xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/student")}
          className="flex items-center gap-2"
        >
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 grid place-items-center text-slate-900 font-black">P</div>
          <span className="font-semibold">PolyLab</span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-slate-300">
          <NavLink to="/calculator" className="hover:text-white">Calculator</NavLink>
          <NavLink to="/docs" className="hover:text-white">Docs</NavLink>
          <NavLink to="/tutorials" className="hover:text-white">Tutorials</NavLink>
          {/* Always visible here since this navbar is only used in the student area */}
          <NavLink to="/instructor/request" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
            <UserPlus className="h-4 w-4" /> Request Instructor
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
                      <Link
            to={`/student`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800/60"
            title="Go to Dashboard"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800/60"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
