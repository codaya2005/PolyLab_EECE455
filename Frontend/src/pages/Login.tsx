import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ShieldCheck, KeyRound } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import heroImg from "@/assets/polylab-hero.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [totp, setTotp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [totpSubmitting, setTotpSubmitting] = useState(false);
  const [totpRequired, setTotpRequired] = useState(false);

  const emailErrId = "login-email-err";
  const formErrId = "login-form-err";
  const totpErrId = "login-totp-err";

  const totpInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setTotpError(null);
    setTotpRequired(false);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password: pw });
      const profile = await refresh();
      const role = profile?.role;
      if (role === "admin") navigate("/admin");
      else if (role === "instructor") navigate("/instructor");
      else navigate("/student");
    } catch (err) {
      if (err instanceof ApiError) {
        const detail =
          typeof err.data === "object" && err.data
            ? (err.data as any).detail
            : null;
        if (err.status === 401 && detail === "MFA TOTP required") {
          setTotpRequired(true);
          setTotpError("Enter your 6-digit code to finish logging in.");
          requestAnimationFrame(() => totpInputRef.current?.focus());
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Unable to log you in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasskey() {
    setFormError("Passkeys/WebAuthn integration is coming soon.");
  }

  async function handleVerifyTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!totpRequired) return;
    if (totp.trim().length < 6) {
      setTotpError("Enter a valid 6-digit code.");
      return;
    }
    setTotpError(null);
    setTotpSubmitting(true);
    try {
      await login({ email: email.trim(), password: pw, totp: totp.trim() });
      const profile = await refresh();
      const role = profile?.role;
      if (role === "admin") navigate("/admin");
      else if (role === "instructor") navigate("/instructor");
      else navigate("/student");
    } catch (err) {
      if (err instanceof ApiError) {
        setTotpError(err.message);
      } else {
        setTotpError("Unable to verify the code. Please try again.");
      }
    } finally {
      setTotpSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="relative">
        {/* soft radial halo behind hero area */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_700px_at_80%_-10%,rgba(56,189,248,0.22),transparent)]" />

        <section className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid gap-10 lg:gap-12 lg:grid-cols-2 items-center">
            {/* Left: headline */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
                Welcome Back to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  PolyLab
                </span>
              </h1>
              <p className="mt-4 text-lg text-slate-300 max-w-xl">
                Access your interactive finite-field learning lab with secure
                login and MFA.
              </p>

              <div className="mt-6 flex items-center gap-3 text-slate-400 text-sm">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>OWASP-aligned auth and TOTP support.</span>
              </div>
            </div>

            

              {/* Right: hero + login card */}
<div className="relative lg:min-h-[520px] flex justify-center items-center">
  {/* Glowing hero image (behind the card) */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -top-14 right-0 hidden md:block z-0"
  >
    <div className="absolute -inset-10 blur-3xl rounded-[28px] bg-cyan-500/10" />
    <img
      src={heroImg}
      alt=""
      className="relative w-[520px] max-w-none rounded-[24px]
                 shadow-[0_25px_80px_rgba(56,189,248,0.22),0_10px_40px_rgba(59,130,246,0.18)]"
      style={{
        objectFit: "cover",
        objectPosition: "center",
        filter: "saturate(1.1) brightness(1.06)",
        WebkitMaskImage:
          "radial-gradient(80% 80% at 70% 30%, black 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
        maskImage:
          "radial-gradient(80% 80% at 70% 30%, black 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
      }}
    />
  </div>

  {/* Login card (always above image; centered) */}
  <div
    className="relative z-20 mx-auto w-full max-w-md
               rounded-2xl border border-slate-800/70 bg-slate-900/60 backdrop-blur
               shadow-[0_10px_40px_rgba(2,6,23,.45)] p-6"
    aria-labelledby="login-title"
  >
                <h2 id="login-title" className="sr-only">
                  Login to PolyLab
                </h2>

                {/* Global form error (generic) */}
                {formError ? (
                  <p
                    id={formErrId}
                    role="alert"
                    className="mb-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-2 text-sm"
                  >
                    {formError}
                  </p>
                ) : null}

                <form onSubmit={handleSubmit} noValidate>
                  <label className="block text-sm text-slate-300 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-describedby={formError ? formErrId : undefined}
                    className="h-11 bg-slate-900/70 border-slate-700/70 placeholder:text-slate-400"
                    autoComplete="email"
                    required
                  />

                  <div className="mt-4">
                    <label className="block text-sm text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="••••••••"
                        aria-describedby={formError ? formErrId : undefined}
                        className="h-11 bg-slate-900/70 border-slate-700/70 placeholder:text-slate-400 pr-10"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        aria-label={showPw ? "Hide password" : "Show password"}
                        aria-pressed={showPw}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute inset-y-0 right-2 my-auto p-2 rounded
                                   text-slate-300 hover:text-white
                                   focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                      >
                        {showPw ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Minimum 8 chars. Avoid common or breached passwords.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="mt-5 w-full h-11 gap-2 bg-gradient-to-r from-blue-600 to-cyan-500
                               text-slate-900 font-semibold hover:brightness-110 disabled:opacity-60
                               focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    <LogIn className="h-5 w-5" />
                    {submitting ? "Signing in..." : "Login"}
                  </Button>
                </form>



                {/* Divider + link */}
                <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                  <span>Don’t have an account?</span>
                  <Link to="/signup" className="text-cyan-300 hover:text-cyan-200">
                    Sign Up
                  </Link>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                  <span>Forgot your password?</span>
                  <Link to="/forgot" className="text-cyan-300 hover:text-cyan-200">
                    Reset Password
                  </Link>
                </div>

                {/* MFA TOTP (optional) */}
                {totpRequired && (
                  <form onSubmit={handleVerifyTotp} className="mt-5">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                      <div className="flex items-center gap-2 text-slate-300 mb-2">
                        <ShieldCheck className="h-5 w-5 text-cyan-400" />
                        <span className="font-medium">MFA Challenge</span>
                      </div>

                      {totpError ? (
                        <p
                          id={totpErrId}
                          role="alert"
                          className="mb-2 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-2 text-sm"
                        >
                          {totpError}
                        </p>
                      ) : null}

                      <label className="block text-sm text-slate-300 mb-1">
                        TOTP Code
                      </label>
                      <Input
                        ref={totpInputRef}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={totp}
                        onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        placeholder="123456"
                        aria-describedby={totpError ? totpErrId : undefined}
                        className="h-11 bg-slate-900/70 border-slate-700/70 placeholder:text-slate-400"
                      />

                      <Button
                        type="submit"
                        disabled={totpSubmitting}
                        className="mt-3 w-full h-10 bg-cyan-500 text-slate-900 hover:bg-cyan-400 disabled:opacity-60
                                   focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                      >
                        {totpSubmitting ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
