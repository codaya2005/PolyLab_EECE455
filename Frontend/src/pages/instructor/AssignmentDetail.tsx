import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBarUser from "@/components/ui/NavBarUser";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, Assignment, Submission, AUTH_BASE_URL, getAssignment, listSubmissionsForAssignment, gradeSubmission } from "@/lib/api";
import { Clock3, ExternalLink } from "lucide-react";
import bgCircuit from "@/assets/background.png";
import { useAuth } from "@/contexts/AuthContext";

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  if (diffSec < 45) return "just now";
  if (diffMin < 90) return `${diffMin}m ago`;
  if (diffHr < 36) return `${diffHr}h ago`;
  if (diffDay < 14) return `${diffDay}d ago`;
  return new Date(iso).toLocaleString();
}

export default function AssignmentDetail() {
  const { assignmentId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const idNum = Number(assignmentId);
      if (Number.isNaN(idNum)) {
        throw new Error("Invalid assignment id");
      }
      const a = await getAssignment(idNum);
      setAssignment(a);
      const s = await listSubmissionsForAssignment(idNum);
      setSubs(s);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load assignment";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed pointer-events-none" style={{ backgroundImage: `url(${bgCircuit})` }} />
        <div className="absolute inset-0 bg-slate-950/75 pointer-events-none" />
        <div className="relative z-10">
          <NavBarUser email={user?.email} role={user?.role ?? "instructor"} />
          <main className="mx-auto max-w-4xl px-4 py-10">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed pointer-events-none" style={{ backgroundImage: `url(${bgCircuit})` }} />
        <div className="absolute inset-0 bg-slate-950/75 pointer-events-none" />
        <div className="relative z-10">
          <NavBarUser email={user?.email} role={user?.role ?? "instructor"} />
          <main className="mx-auto max-w-4xl px-4 py-10">
            <div className="rounded-xl border border-rose-700/40 bg-rose-900/20 p-6">
              {error ?? "Assignment not found."}
            </div>
            <Button
              variant="outline"
              className="mt-4 border-slate-700 text-slate-200"
              onClick={() => nav("/instructor/classrooms")}
            >
              Back
            </Button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-cover bg-center bg-fixed pointer-events-none" style={{ backgroundImage: `url(${bgCircuit})` }} />
      <div className="absolute inset-0 bg-slate-950/75 pointer-events-none" />
      <div className="relative z-10">
        <NavBarUser email={user?.email} role={user?.role ?? "instructor"} />
        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <PageHeader title={`Asg ${assignment.id}: ${assignment.title}`} subtitle={`Classroom ID: ${assignment.classroom_id}`} />

          {error && (
            <div className="rounded-lg border border-rose-700/40 bg-rose-900/20 px-4 py-3 text-rose-200 text-sm">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2">
            <div className="text-sm text-slate-300 whitespace-pre-line">{assignment.description || "No description"}</div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              {assignment.due_date ? `Due ${new Date(assignment.due_date).toLocaleString()}` : "No due date"}
            </div>
            {assignment.attachment_url && (
              <a
                href={`${AUTH_BASE_URL}${assignment.attachment_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200"
              >
                <ExternalLink className="h-4 w-4" /> View attachment
              </a>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Submissions</div>
              <div className="text-xs text-slate-500">{subs.length} total</div>
            </div>
            {subs.length === 0 ? (
              <div className="text-sm text-slate-300">No submissions yet.</div>
            ) : (
              subs.map((s) => <SubmissionRow key={s.id} submission={s} />)
            )}
          </div>

          <div>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-200"
              onClick={() => nav("/instructor/classrooms")}
            >
              Back
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

function SubmissionRow({ submission }: { submission: Submission }) {
  const [gradeInput, setGradeInput] = useState<string | number>(submission.grade ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function saveGrade() {
    const num = Number(gradeInput);
    if (Number.isNaN(num)) {
      setErr("Enter a numeric grade.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await gradeSubmission(submission.id, num);
      submission.grade = num;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to save grade";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2">
      <div className="flex justify-between text-sm text-slate-200">
        <div>
          <div className="font-semibold">{submission.user_email ?? `User #${submission.user_id}`}</div>
          <div className="text-xs text-slate-400">Submitted {relativeTime(submission.submitted_at)}</div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={gradeInput}
            onChange={(e) => setGradeInput(e.target.value)}
            className="w-24 h-9 bg-slate-900/70 border-slate-700 text-sm"
            placeholder="Score"
          />
          <span className="text-xs text-slate-400">/ 100</span>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" disabled={saving} onClick={saveGrade}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      {err && <div className="text-xs text-rose-300">{err}</div>}
      {submission.grade !== null && submission.grade !== undefined && !err && (
        <div className="text-xs text-emerald-300">Grade saved: {submission.grade}/100</div>
      )}
    </div>
  );
}
