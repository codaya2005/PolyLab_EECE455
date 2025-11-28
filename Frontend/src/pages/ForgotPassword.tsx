import React, { useState } from "react";
import Navbar from "@/components/ui/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import bgCircuit from "@/assets/background.png";
import { requestPasswordReset, ApiError } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setBanner({ type: "error", msg: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setBanner({
        type: "success",
        msg: "If an account exists for that email, a reset link has been sent.",
      });
    } catch (err) {
      setBanner({
        type: "error",
        msg:
          err instanceof ApiError
            ? err.message
            : "We were unable to process your request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen text-slate-100">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${bgCircuit})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-950/70" />

      {/* Content */}
      <div className="relative">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6 shadow">
            <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
            <p className="mt-2 text-slate-300">
              Enter your email and we’ll send you a link to reset your password.
            </p>

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

            <form onSubmit={handleSubmit} className="mt-6">
              <label htmlFor="email" className="block text-sm text-slate-300 mb-1">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-slate-900/70 border-slate-700/70"
                autoComplete="email"
                required
              />

              <Button
                type="submit"
                disabled={loading}
                className="mt-5 w-full h-11 bg-cyan-500 text-slate-900 hover:bg-cyan-400 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
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
