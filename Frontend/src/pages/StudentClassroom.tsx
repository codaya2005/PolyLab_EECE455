import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarStudent from "@/components/ui/StudentNavbar";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ApiError,
  Classroom,
  Assignment,
  Submission,
  AUTH_BASE_URL,
  listClassrooms,
  listAssignments,
  submitAssignment,
  uploadAssignmentFile,
  listSubmissionsForAssignment,
  listMaterials,
  Material,
} from "@/lib/api";
import { Clock3, Send } from "lucide-react";
import bgCircuit from "@/assets/background.png";

type DraftState = Record<
  number,
  { content: string; file?: File | null; submitting: boolean; success?: string; error?: string }
>;

export default function StudentClassroom() {
  const { classId } = useParams();
  const nav = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [drafts, setDrafts] = useState<DraftState>({});
  const [mySubs, setMySubs] = useState<Record<number, Submission[]>>({});
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const classes = await listClassrooms();
      const cls = classes.find((c) => String(c.id) === classId);
      if (!cls) {
        setError("You are not enrolled in this classroom.");
        setLoading(false);
        return;
      }
      setClassroom(cls);
      const data = await listAssignments(classId);
      setAssignments(data);
      const mats = await listMaterials(classId);
      setMaterials(mats);
      // fetch submissions per assignment (own submissions)
      const subsEntries = await Promise.all(
        data.map(async (a) => {
          try {
            const subs = await listSubmissionsForAssignment(a.id);
            return [a.id, subs] as const;
          } catch {
            return [a.id, []] as const;
          }
        }),
      );
      setMySubs(Object.fromEntries(subsEntries));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load classroom data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const asgNumberMap = React.useMemo(() => {
    const sorted = [...assignments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const map: Record<number, number> = {};
    sorted.forEach((a, idx) => {
      map[a.id] = idx + 1;
    });
    return map;
  }, [assignments]);

  async function submit(assignmentId: number) {
    const state = drafts[assignmentId] ?? { content: "", file: null, submitting: false };
    if (!state.content.trim() && !state.file) {
      setDrafts((prev) => ({
        ...prev,
        [assignmentId]: { ...state, error: "Add a short answer or attach a document before submitting." },
      }));
      return;
    }
    setDrafts((prev) => ({
      ...prev,
      [assignmentId]: { ...state, submitting: true, error: undefined, success: undefined },
    }));
    try {
      if (state.file) {
        await uploadAssignmentFile(assignmentId, state.file);
      }
      if (state.content.trim()) {
        await submitAssignment(assignmentId, state.content.trim());
      }
      const subs = await listSubmissionsForAssignment(assignmentId);
      setMySubs((prev) => ({ ...prev, [assignmentId]: subs }));
      setDrafts((prev) => ({
        ...prev,
        [assignmentId]: { content: "", file: null, submitting: false, success: "Submitted!" },
      }));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to submit. Try again.";
      setDrafts((prev) => ({
        ...prev,
        [assignmentId]: { ...state, submitting: false, error: msg },
      }));
    }
  }

  const submittedCount = useMemo(
    () =>
      Object.values(mySubs).reduce((acc, arr) => {
        if (arr && arr.length > 0) return acc + 1;
        return acc;
      }, 0),
    [mySubs],
  );

  if (loading) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed pointer-events-none" style={{ backgroundImage: `url(${bgCircuit})` }} />
        <div className="absolute inset-0 bg-slate-950/75 pointer-events-none" />
        <div className="relative z-10">
          <NavbarStudent onLogout={() => console.log("logout")} />
          <main className="mx-auto max-w-3xl px-4 py-10">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">Loading classroom...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed pointer-events-none" style={{ backgroundImage: `url(${bgCircuit})` }} />
        <div className="absolute inset-0 bg-slate-950/75 pointer-events-none" />
        <div className="relative z-10">
          <NavbarStudent onLogout={() => console.log("logout")} />
          <main className="mx-auto max-w-3xl px-4 py-10">
            <div className="rounded-xl border border-rose-700/40 bg-rose-900/20 p-6">
              {error ?? "Classroom not found."}
            </div>
            <Button variant="outline" className="mt-4 border-slate-700 text-slate-200" onClick={() => nav("/student")}>
              Back to dashboard
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
        <NavbarStudent onLogout={() => console.log("logout")} />
        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
          <PageHeader title={classroom.name} subtitle={`Assignments • ${submittedCount} submitted`} />

          {error && (
            <div className="mt-3 rounded-lg border border-rose-700/40 bg-rose-900/20 px-4 py-3 text-rose-200 text-sm">
              {error}
            </div>
          )}

          <Tabs defaultValue="assignments" className="mt-4">
            <TabsList className="bg-slate-800/60">
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="assignments" className="mt-4 space-y-4">
              {assignments.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
                  No assignments have been posted yet.
                </div>
              ) : (
                assignments.map((a) => {
                  const draft = drafts[a.id] ?? { content: "", submitting: false };
                  const submitted = (mySubs[a.id] ?? [])[0];
                  return (
                    <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold">
                            {`Asg ${asgNumberMap[a.id] ?? ""} ${asgNumberMap[a.id] ? ":" : ""} ${a.title}`}
                          </div>
                          {a.description && <div className="text-sm text-slate-300 whitespace-pre-line mt-1">{a.description}</div>}
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <Clock3 className="h-4 w-4" />
                            {a.due_date ? `Due ${new Date(a.due_date).toLocaleString()}` : "No due date"}
                          </div>
                          {a.attachment_url && (
                            <div className="mt-2">
                              <a
                                href={`${AUTH_BASE_URL}${a.attachment_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-cyan-300 hover:text-cyan-200 underline"
                              >
                                View attached file
                              </a>
                            </div>
                          )}
                          {submitted && (
                            <div className="mt-2 text-xs text-emerald-300">
                              Submitted at {new Date(submitted.submitted_at).toLocaleString()}
                              {submitted.grade !== null && submitted.grade !== undefined ? ` • Grade: ${submitted.grade}` : ""}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-slate-300">Submit your work</label>
                        <textarea
                          value={draft.content}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [a.id]: { ...(prev[a.id] ?? { submitting: false }), content: e.target.value },
                            }))
                          }
                          rows={4}
                          className="w-full rounded-md bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100"
                          placeholder="Paste your polynomial steps or upload link..."
                        />
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-slate-300">
                            Attach document (optional)
                            <input
                              type="file"
                              className="mt-1 block text-sm text-slate-200"
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [a.id]: { ...(prev[a.id] ?? { submitting: false, content: "" }), file: e.target.files?.[0] ?? null },
                                }))
                              }
                            />
                          </label>
                          {draft.file && <span className="text-xs text-slate-400">{draft.file.name}</span>}
                        </div>
                        {draft.error && <div className="text-sm text-rose-300">{draft.error}</div>}
                        {draft.success && <div className="text-sm text-emerald-300">{draft.success}</div>}
                        <Button
                          onClick={() => submit(a.id)}
                          disabled={draft.submitting}
                          className="h-10 bg-cyan-500 text-slate-900 hover:bg-cyan-400"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          {draft.submitting ? "Submitting..." : submitted ? "Resubmit" : "Submit"}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="materials" className="mt-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                {materials.length === 0 ? (
                  <div className="text-slate-300">No materials shared yet.</div>
                ) : (
                  materials.map((m) => (
                    <div key={m.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 flex items-start gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-100">{m.title}</div>
                        {m.description && <div className="text-sm text-slate-400">{m.description}</div>}
                        {m.file_url && (
                          <a
                            href={`${AUTH_BASE_URL}${m.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="mt-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                {submittedCount === 0 ? (
                  <div className="text-slate-300">No submissions yet.</div>
                ) : (
                  Object.entries(mySubs).flatMap(([aid, subs]) =>
                    (subs || []).map((s) => {
                      const assignment = assignments.find((a) => String(a.id) === String(aid));
                      return (
                        <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                          <div className="font-semibold">{assignment?.title ?? `Assignment ${aid}`}</div>
                          <div className="text-sm text-slate-400">
                            Submitted {new Date(s.submitted_at).toLocaleString()}
                            {s.grade !== null && s.grade !== undefined ? ` • Grade: ${s.grade}` : ""}
                          </div>
                        </div>
                      );
                    }),
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button variant="outline" className="border-slate-700 text-slate-200" onClick={() => nav("/student")}>
              Back to dashboard
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
