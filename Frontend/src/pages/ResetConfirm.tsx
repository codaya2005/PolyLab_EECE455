import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import bgCircuit from "@/assets/background.png";
import { confirmPasswordReset, ApiError } from "@/lib/api";

export default function ResetConfirm() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const navigate = useNavigate();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const disabled = !token || !pw || !pw2 || pw !== pw2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setBanner(null);
    setLoading(true);
    try {
      await confirmPasswordReset(token, pw);
      setBanner({ type: "success", msg: "Password updated. Redirecting to login..." });
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Unable to reset your password. Please try again.";
      setBanner({ type: "error", msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen text-slate-100 bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${bgCircuit})` }}
      />
      <div className="absolute inset-0 bg-slate-950/75" />

      <div className="relative">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6 shadow">
            <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="mt-2 text-slate-300">
              Choose a new password to finish resetting your account.
            </p>

            {!token && (
              <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                This reset link is missing a token. Please request a new password reset.
              </div>
            )}

            {banner && (
              <div
                role="alert"
                className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                  banner.type === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                }`}
              >
                {banner.msg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">New password</label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Enter a strong password"
                    className="h-11 bg-slate-900/70 border-slate-700/70 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-2 my-auto p-2 rounded text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Minimum 8 characters with upper, lower, digit, and symbol.
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Confirm password</label>
                <div className="relative">
                  <Input
                    type={showPw2 ? "text" : "password"}
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    placeholder="Re-enter password"
                    className="h-11 bg-slate-900/70 border-slate-700/70 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw2((v) => !v)}
                    aria-label={showPw2 ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-2 my-auto p-2 rounded text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    {showPw2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {pw && pw2 && pw !== pw2 && (
                  <p className="mt-1 text-xs text-rose-300">Passwords do not match.</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={disabled || loading || !token}
                className="w-full h-11 bg-cyan-500 text-slate-900 hover:bg-cyan-400 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>

            <div className="mt-4 text-sm text-slate-400">
              Remembered your password?{" "}
              <a href="/login" className="underline hover:text-slate-200">
                Back to login
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
