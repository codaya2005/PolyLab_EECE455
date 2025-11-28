import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBarUser from "@/components/ui/NavBarUser";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  AUTH_BASE_URL,
  getInstructorRequest,
  decideInstructorRequest,
  InstructorRequest as ApiInstructorRequest,
} from "@/lib/api";
import bgCircuit from "@/assets/background.png";

type AdminInstructorRequest = ApiInstructorRequest & {
  user_email?: string | null;
  created_at?: string;
  decision_by?: number | null;
  decided_at?: string | null;
};

export default function AdminRequestDetail() {
const { requestId } = useParams();
const nav = useNavigate();
const [req, setReq] = useState<AdminInstructorRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!requestId) return;
      setError(null);
      try {
        const data = await getInstructorRequest(Number(requestId));
        setReq(data as AdminInstructorRequest);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Failed to load request";
        setError(msg);
      }
    }
    load();
  }, [requestId]);

  async function act(action: "approve" | "reject") {
    if (!req) return;
    setSaving(true);
    setError(null);
    try {
      await decideInstructorRequest(req.id, action);
      setReq({ ...req, status: action === "approve" ? "approved" : "rejected" });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Action failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen text-slate-100">
      <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${bgCircuit})` }} />
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="relative">
        <NavBarUser email="admin" role="admin" />
        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-4">
          <PageHeader title="Instructor Request" subtitle={`Request #${requestId ?? ""}`} />
          {error && (
            <div className="rounded-lg border border-rose-700/40 bg-rose-900/20 px-4 py-3 text-rose-200 text-sm">
              {error}
            </div>
          )}
          {req ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
              <InfoRow label="User" value={req.user_email ? `${req.user_email} (id ${req.user_id})` : `User #${req.user_id}`} />
              <InfoRow label="Status" value={req.status} />
              <InfoRow label="Note" value={req.note || "—"} />
              <InfoRow label="Submitted at" value={req.created_at ? new Date(req.created_at).toLocaleString() : "-"} />
              <InfoRow label="Decision by" value={req.decision_by ? String(req.decision_by) : "-"} />
              <InfoRow label="Decided at" value={req.decided_at ? new Date(req.decided_at).toLocaleString() : "-"} />
              {req.file_path && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-300">Proof:</span>
                  <a
                    href={req.file_path.startsWith("http") ? req.file_path : `${AUTH_BASE_URL}${req.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 hover:text-cyan-200 underline"
                  >
                    Open proof
                  </a>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => act("approve")}
                  disabled={saving || req.status !== "pending"}
                  className="bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => act("reject")}
                  disabled={saving || req.status !== "pending"}
                  variant="outline"
                  className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                >
                  Reject
                </Button>
                <Button variant="ghost" className="text-slate-200" onClick={() => nav("/admin")}>
                  Back
                </Button>
              </div>
            </div>
          ) : (
            !error && <div className="text-sm text-slate-300">Loading...</div>
          )}
        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-sm text-slate-200">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div>{value}</div>
    </div>
  );
}
