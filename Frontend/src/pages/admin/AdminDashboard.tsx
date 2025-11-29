import React, { useEffect, useMemo, useState } from "react";
import NavBarUser from "@/components/ui/NavBarUser";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  AUTH_BASE_URL,
  listInstructorRequests,
  decideInstructorRequest,
  InstructorRequest as ApiInstructorRequest,
} from "@/lib/api";
import {
  CheckCircle2,
  Clock4,
  Shield,
  Users2,
  XCircle,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import bgCircuit from "@/assets/background.png"; // background image

// ----------------------------- Types -----------------------------
type AdminInstructorRequest = ApiInstructorRequest & {
  created_at?: string;
  decision_by?: number | null;
  decided_at?: string | null;
  user_email?: string | null;
};


// --------------------------- Small UI Bits ------------------------
function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "cyan" | "green" | "amber" | "rose" | "indigo";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-800/70 text-slate-200",
    cyan: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
    green: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
    indigo: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs ${tones[tone]} whitespace-nowrap`}>
      {children}
    </span>
  );
}

function Toast({
  open,
  title,
  description,
  onClose,
  tone = "success",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  tone?: "success" | "error";
}) {
  if (!open) return null;
  const styles =
    tone === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : "border-rose-500/40 bg-rose-500/10 text-rose-200";
  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <div className={`rounded-xl border ${styles} px-4 py-3 shadow-lg min-w-[280px]`}>
        <div className="font-semibold">{title}</div>
        {description && <div className="text-sm mt-0.5">{description}</div>}
        <div className="mt-2 text-right">
          <button
            onClick={onClose}
            className="text-xs underline hover:opacity-80"
            aria-label="Dismiss toast"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------- Page ------------------------------
export default function AdminDashboard() {
  const [requests, setRequests] = useState<AdminInstructorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqError, setReqError] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    open: boolean;
    tone: "success" | "error";
    title: string;
    description?: string;
  }>({ open: false, tone: "success", title: "" });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setReqError(null);
      try {
        const data = await listInstructorRequests();
        setRequests(data);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Failed to load requests";
        setReqError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  // Handlers
  async function approveReq(id: number) {
    try {
      await decideInstructorRequest(id, "approve");
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
      setToast({
        open: true,
        tone: "success",
        title: "Request approved",
        description: "The user can now access instructor features.",
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to approve";
      setToast({ open: true, tone: "error", title: "Error", description: msg });
    }
  }

  async function rejectReq(id: number) {
    try {
      await decideInstructorRequest(id, "reject");
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
      setToast({
        open: true,
        tone: "error",
        title: "Request rejected",
        description: "The user remains a student.",
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to reject";
      setToast({ open: true, tone: "error", title: "Error", description: msg });
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

      {/* Foreground */}
      <div className="relative">
        <NavBarUser email="admin@polylab.app" role="admin" />

        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-7 w-7 text-cyan-400" />
              Admin Dashboard
            </h1>
            <p className="mt-1 text-slate-300">
              Review instructor requests, manage users, and monitor platform status.
            </p>
          </div>

          {/* Status Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <CardStat
              icon={<Users2 className="h-5 w-5" />}
              title="Total Requests"
              value={String(stats.total)}
            />
            <CardStat
              icon={<Clock4 className="h-5 w-5" />}
              title="Pending"
              value={String(stats.pending)}
              tone="amber"
            />
            <CardStat
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Approved"
              value={String(stats.approved)}
              tone="green"
            />
            <CardStat
              icon={<XCircle className="h-5 w-5" />}
              title="Rejected"
              value={String(stats.rejected)}
              tone="rose"
            />
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Review Queue */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Instructor Requests</h2>
                <Badge tone="cyan">Queue</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {reqError && (
                  <div className="rounded-md border border-rose-700/40 bg-rose-900/20 px-3 py-2 text-sm text-rose-200">
                    {reqError}
                  </div>
                )}
                {loading ? (
                  <div className="text-sm text-slate-300">Loading requests...</div>
                ) : requests.length === 0 ? (
                  <div className="text-sm text-slate-400">No requests.</div>
                ) : (
                  requests
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                    )
                    .map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {r.user_email ?? `User #${r.user_id}`}
                          </div>
                          {r.note && <div className="text-sm text-slate-300">{r.note}</div>}
                          <div className="text-xs text-slate-500">
                            Submitted: {new Date(r.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800/60"
                            href={`/admin/requests/${r.id}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open details for ${r.user_email ?? r.user_id}`}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            Open
                          </a>
                          {r.file_path && (
                            <a
                              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800/60"
                              href={r.file_path.startsWith("http") ? r.file_path : `${AUTH_BASE_URL}${r.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open proof for ${r.user_email ?? r.user_id}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                              Proof
                            </a>
                          )}

                          {r.status === "pending" ? (
                            <>
                              <Button
                                className="bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                                onClick={() => approveReq(r.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                                onClick={() => rejectReq(r.id)}
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Badge tone={r.status === "approved" ? "green" : "rose"}>
                              {r.status[0].toUpperCase() + r.status.slice(1)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    ))
                )}
              </div>
            </section>


          </div>
        </main>
      </div>

      {/* Toast */}
      <Toast
        open={toast.open}
        tone={toast.tone}
        title={toast.title}
        description={toast.description}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
}

// --------------------------- Small Card ---------------------------
function CardStat({
  icon,
  title,
  value,
  tone = "slate",
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  tone?: "slate" | "green" | "amber" | "rose";
}) {
  const ring =
    tone === "green"
      ? "ring-emerald-500/30"
      : tone === "amber"
      ? "ring-amber-500/30"
      : tone === "rose"
      ? "ring-rose-500/30"
      : "ring-slate-500/20";
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-5 shadow ${ring}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-slate-300">{title}</div>
        <div className="text-cyan-300">{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}
