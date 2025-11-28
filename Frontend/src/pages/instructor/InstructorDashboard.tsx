import React from "react";
import NavBarUser from "@/components/ui/NavBarUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import CopyButton from "@/components/ui/CopyButton";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Users, ExternalLink } from "lucide-react";
import bgCircuit from "@/assets/background.png"; // your background image
import {
  listClassrooms,
  createClassroom,
  Classroom,
  enrollTotpMfa,
  verifyTotpMfa,
  disableTotpMfa,
  ApiError,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function InstructorDashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = React.useState<Classroom[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [mfaState, setMfaState] = React.useState<"idle" | "enrolling" | "verifying" | "enabled">(
    user?.totp_enabled ? "enabled" : "idle",
  );
  const [mfaSecret, setMfaSecret] = React.useState<string | null>(null);
  const [mfaOtpAuth, setMfaOtpAuth] = React.useState<string | null>(null);
  const [mfaToken, setMfaToken] = React.useState<string | null>(null);
  const [mfaCode, setMfaCode] = React.useState("");
  const [mfaError, setMfaError] = React.useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listClassrooms();
      setClasses(data);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Failed to load classrooms";
      setError(msg);
      console.error("Failed to load classrooms", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    if (user?.totp_enabled) {
      setMfaState("enabled");
    }
  }, [refresh, user?.totp_enabled]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const cls = await createClassroom(newName.trim());
      setNewName("");
      await refresh();
      nav(`/instructor/classrooms/${cls.id}`);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Failed to create classroom";
      setError(msg);
      console.error("Failed to create classroom", e);
    } finally {
      setCreating(false);
    }
  }

  const top = classes.slice(0, 3);

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
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to start MFA setup.";
      setMfaError(msg);
      setMfaState(user?.totp_enabled ? "enabled" : "idle");
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
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Invalid code.";
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
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Unable to disable MFA.";
      setMfaError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${bgCircuit})` }}
      />
      {/* dark overlay */}
      <div className="absolute inset-0 bg-slate-950/75" />

      <NavBarUser email={user?.email} role={user?.role ?? "instructor"} />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <PageHeader
          title="Instructor Dashboard"
          subtitle={user ? `Welcome, ${user.email}` : "Quick overview and actions"}
          right={
            <div className="flex gap-2">
              <Link to="/instructor/classrooms">
                <Button variant="outline" className="border-slate-700 text-slate-200">
                  View All Classrooms
                </Button>
              </Link>
              <Button onClick={() => nav("/instructor/classrooms?create=1")} className="bg-cyan-500 text-slate-900 hover:bg-cyan-400">
                <Plus className="h-4 w-4 mr-1" /> Create Classroom
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: My Classrooms */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
            <h2 className="text-xl font-semibold mb-1">My Classrooms</h2>
            <p className="text-slate-400 mb-4">
              {loading ? "Loading..." : `You have ${classes.length} classrooms`}
            </p>
            {error && <p className="mb-3 text-sm text-rose-300">{error}</p>}

            {loading ? (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300">Loading classrooms...</div>
            ) : top.length === 0 ? (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40">
                <p className="text-slate-300">You don’t have any classrooms yet.</p>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Classroom name"
                    className="bg-slate-900/60 border-slate-700"
                  />
                  <Button onClick={handleCreate} disabled={creating} className="bg-cyan-500 text-slate-900 hover:bg-cyan-400">
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {top.map((c) => (
                  <div key={c.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-slate-400">
                          {c.code || "No code"} • Created {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CopyButton text={c.code} />
                        <Link to={`/instructor/classrooms/${c.id}`}>
                          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200">
                            <ExternalLink className="h-4 w-4 mr-1" /> Open
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right: Quick Actions */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New classroom name"
                  className="bg-slate-900/60 border-slate-700"
                />
                <Button onClick={handleCreate} disabled={creating} className="h-11 bg-cyan-500 text-slate-900 hover:bg-cyan-400">
                  <Plus className="h-4 w-4 mr-1" /> {creating ? "Creating..." : "Create"}
                </Button>
              </div>
              <Button onClick={() => nav("/instructor/classrooms")} className="w-full h-11 border-slate-700 text-slate-200" variant="outline">
                <Users className="h-4 w-4 mr-1" /> View classrooms
              </Button>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-sm font-medium mb-2">Pending Review</div>
              <div className="text-slate-400 text-sm">No items.</div>
            </div>
          </section>
        </div>
      </main>

      {/* MFA setup */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
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
                  <div className="flex items-center gap-2 flex-wrap">
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
        </div>
      </section>
    </div>
  );
}
