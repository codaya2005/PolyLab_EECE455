// src/pages/StudentDashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import NavbarStudent from "@/components/ui/StudentNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ChevronRight } from "lucide-react";
import bgCircuit from "@/assets/background.png"; // your background image
import { useAuth } from "@/contexts/AuthContext";
import { joinClassroom, listClassrooms, Classroom, ApiError, enrollTotpMfa, verifyTotpMfa, disableTotpMfa } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const email = user?.email ?? "guest@polylab.dev";
  const [mfaState, setMfaState] = useState<"idle" | "enrolling" | "verifying" | "enabled">(
    user?.totp_enabled ? "enabled" : "idle",
  );
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaOtpAuth, setMfaOtpAuth] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null);

  // ----- Classrooms state -----
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const loadClasses = useCallback(async () => {
    setClassesLoading(true);
    setJoinError(null);
    try {
      const data = await listClassrooms();
      setClasses(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load classrooms";
      setJoinError(msg);
    } finally {
      setClassesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
    if (user?.totp_enabled) {
      setMfaState("enabled");
    }
  }, [loadClasses, user?.totp_enabled]);

  async function startMfaEnroll() {
    setMfaError(null);
    setMfaSuccess(null);
    setMfaState("enrolling");
    try {
      const res = await enrollTotpMfa();
      setMfaSecret(res.secret);
      setMfaOtpAuth(res.otpauth);
      setMfaToken(res.mfa_token);
      setMfaState("verifying");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to start MFA setup.";
      setMfaError(msg);
      setMfaState("idle");
    }
  }

  async function verifyMfa() {
    if (!mfaToken) return;
    setMfaError(null);
    setMfaSuccess(null);
    try {
      await verifyTotpMfa(mfaCode.trim(), mfaToken);
      setMfaState("enabled");
      setMfaSuccess("MFA enabled. Use your authenticator app for future logins.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Invalid code.";
      setMfaError(msg);
    }
  }

  async function disableMfa() {
    setMfaError(null);
    setMfaSuccess(null);
    if (!mfaCode.trim()) {
      setMfaError("Enter your current TOTP code to disable.");
      return;
    }
    try {
      await disableTotpMfa(mfaCode.trim());
      setMfaState("idle");
      setMfaSecret(null);
      setMfaOtpAuth(null);
      setMfaToken(null);
      setMfaSuccess("MFA disabled.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Unable to disable MFA.";
      setMfaError(msg);
    }
  }

  // ----- Join a classroom -----
  async function joinClass() {
    setJoinError(null);
    if (!/^[A-Z0-9]{6,10}$/i.test(joinCode.trim())) {
      setJoinError("Enter a valid join code.");
      return;
    }
    setJoining(true);
    try {
      await joinClassroom(joinCode.trim());
      await loadClasses();
      setJoinCode("");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Unable to join. Check the code or try again.";
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="relative min-h-screen text-slate-100">
      {/* background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${bgCircuit})` }}
      />
      {/* dark overlay */}
      <div className="absolute inset-0 bg-slate-950/75" />

      <div className="relative">
        <NavbarStudent onLogout={() => console.log("logout")} />

        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Student Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Signed in as {email}</p>
            <div className="mt-2 inline-flex items-center rounded-full bg-slate-800/70 px-2.5 py-1 text-xs">
              Student
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* RIGHT: My Classrooms */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
              <h2 className="text-xl font-semibold">My Classrooms</h2>

              <div className="mt-4 flex items-center gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="Join a Classroom"
                  className="h-10 w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3 text-slate-100 placeholder:text-slate-400"
                />
                <button
                  onClick={joinClass}
                  disabled={joining || !/^[A-Z0-9]{6,10}$/.test(joinCode)}
                  className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
                >
                  {joining ? "..." : "Join"}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">Enter the code your instructor shared with you.</p>
              {joinError && <p className="mt-2 text-sm text-rose-300">{joinError}</p>}

              <div className="mt-5 space-y-3">
                {classesLoading ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-300">
                    Loading classrooms...
                  </div>
                ) : classes.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-300">
                    You are not enrolled in any classrooms yet. Enter a join code above to get started.
                  </div>
                ) : (
                  classes.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-xs text-slate-500">
                            Created {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/60"
                          onClick={() => nav(`/student/classrooms/${c.id}`)}
                        >
                          Open Class <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex items-center gap-2 text-slate-400 text-sm">
                <Shield className="h-4 w-4 text-cyan-400" />
                Secure classrooms. Codes are case-insensitive.
              </div>
            </section>
          </div>

          {/* MFA setup */}
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Multi-Factor Authentication (TOTP)</h2>
                <p className="text-slate-400 text-sm">Add an authenticator app code to your login.</p>
              </div>
              <Button
                onClick={startMfaEnroll}
                disabled={mfaState === "enrolling" || mfaState === "verifying" || mfaState === "enabled"}
                className="bg-cyan-500 text-slate-900 hover:bg-cyan-400 disabled:opacity-60"
              >
                {mfaState === "enabled" ? "MFA Enabled" : mfaState === "verifying" || mfaState === "enrolling" ? "Continue setup" : "Enable MFA"}
              </Button>
            </div>

            {mfaError && (
              <div className="mt-3 rounded-md border border-rose-700/40 bg-rose-900/20 px-3 py-2 text-sm text-rose-200">
                {mfaError}
              </div>
            )}
            {mfaSuccess && (
              <div className="mt-3 rounded-md border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-200">
                {mfaSuccess}
              </div>
            )}

            {(mfaState === "verifying" || mfaState === "enabled") && (
              <div className="mt-4 space-y-3">
                {mfaSecret && (
                  <div className="text-sm text-slate-300 flex items-center gap-2 flex-wrap">
                    <span>Secret:</span>
                    <span className="font-mono bg-slate-800/70 px-2 py-1 rounded">{mfaSecret}</span>
                  </div>
                )}
                {mfaOtpAuth && (
                  <div className="text-sm text-slate-300 space-y-2">
                    <div className="break-all">
                      OTPAuth URL: <span className="font-mono">{mfaOtpAuth}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-200"
                        onClick={() => navigator.clipboard.writeText(mfaOtpAuth)}
                      >
                        Copy URL
                      </Button>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mfaOtpAuth)}`}
                        alt="Scan to add to authenticator"
                        className="h-32 w-32 rounded-lg border border-slate-800 bg-slate-900/60 p-1"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Enter 6-digit code</label>
                  <Input
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-11 bg-slate-900/70 border-slate-700/70 max-w-xs"
                    placeholder="123456"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={verifyMfa}
                    disabled={!mfaToken || mfaCode.length < 6 || mfaState === "enabled"}
                    className="bg-cyan-500 text-slate-900 hover:bg-cyan-400"
                  >
                    Verify code
                  </Button>
                  <Button variant="outline" onClick={disableMfa} className="border-slate-700 text-slate-200">
                    Disable MFA
                  </Button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

