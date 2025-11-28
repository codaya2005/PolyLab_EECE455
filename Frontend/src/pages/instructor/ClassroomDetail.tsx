import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavBarUser from "@/components/ui/NavBarUser";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/ui/CopyButton";
import {
  ApiError,
  Classroom,
  Assignment,
  AssignmentTemplate,
  AUTH_BASE_URL,
  Material,
  listClassrooms,
  listAssignments,
  createAssignment,
  listAssignmentTemplates,
  uploadAssignmentAttachment,
  listSubmissionsForClassroom,
  Submission,
  listMaterials,
  createMaterial,
  uploadMaterialFile,
  gradeSubmission,
} from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Inbox, Clock3, Download, ExternalLink } from "lucide-react";
import bgCircuit from "@/assets/background.png"; // your background image
import { useAuth } from "@/contexts/AuthContext";

export default function ClassroomDetail() {
  const { classId } = useParams();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [templates, setTemplates] = useState<AssignmentTemplate[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
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

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const data = await listClassrooms();
      setClasses(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load classrooms";
      setError(msg);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    if (!classId) return;
    setLoadingAssignments(true);
    try {
      const data = await listAssignments(classId);
      setAssignments(data);
      const subs = await listSubmissionsForClassroom(classId);
      setSubmissions(subs);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load assignments";
      setError(msg);
    } finally {
      setLoadingAssignments(false);
    }
  }, [classId]);

  const loadMaterials = useCallback(async () => {
    if (!classId) return;
    setLoadingMaterials(true);
    try {
      const data = await listMaterials(classId);
      setMaterials(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load materials";
      setError(msg);
    } finally {
      setLoadingMaterials(false);
    }
  }, [classId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  useEffect(() => {
    listAssignmentTemplates()
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const classroom = classes.find((c) => String(c.id) === classId);

  if (loadingClasses) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed pointer-events-none" style={{ backgroundImage: `url(${bgCircuit})` }} />
        <div className="absolute inset-0 bg-slate-950/75 pointer-events-none" />
        <div className="relative z-10">
          <NavBarUser email={user?.email} role={user?.role ?? "instructor"} />
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
          <NavBarUser email={user?.email} role={user?.role ?? "instructor"} />
          <main className="mx-auto max-w-3xl px-4 py-10">
            <div className="rounded-xl border border-rose-700/40 bg-rose-900/20 p-6">Classroom not found.</div>
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
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <PageHeader
            title={classroom.name}
            subtitle={`Join code: ${classroom.code}`}
            right={<CopyButton text={classroom.code} />}
          />

          {error && (
            <div className="mt-3 rounded-lg border border-rose-700/40 bg-rose-900/20 px-4 py-3 text-rose-200 text-sm">
              {error}
            </div>
          )}

          <Tabs defaultValue="assignments" className="mt-4">
            <TabsList className="bg-slate-800/60">
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="assignments" className="mt-4">
              <AssignmentsPanel
                classroomId={classroom.id}
                assignments={assignments}
                templates={templates}
                loading={loadingAssignments}
                onCreated={(a) => setAssignments((prev) => [a, ...prev])}
                onRefresh={loadAssignments}
                onError={setError}
                onSelect={setSelectedAssignment}
              />
            </TabsContent>

            <TabsContent value="materials" className="mt-4">
              <MaterialsPanel
                classroomId={classroom.id}
                materials={materials}
                loading={loadingMaterials}
                onCreated={(m) => setMaterials((prev) => [m, ...prev])}
                onRefresh={loadMaterials}
                onError={setError}
              />
            </TabsContent>

            <TabsContent value="submissions" className="mt-4">
              <SubmissionsPanel submissions={submissions} assignments={assignments} />
            </TabsContent>
          </Tabs>

          {selectedAssignment && (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    Asg {asgNumberMap[selectedAssignment.id] ?? selectedAssignment.id}: {selectedAssignment.title}
                  </div>
                  {selectedAssignment.description && (
                    <div className="text-sm text-slate-300 whitespace-pre-line mt-1">
                      {selectedAssignment.description}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-200"
                  onClick={() => setSelectedAssignment(null)}
                >
                  Close
                </Button>
              </div>
              {selectedAssignment.attachment_url && (
                <a
                  href={`${AUTH_BASE_URL}${selectedAssignment.attachment_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200"
                >
                  <ExternalLink className="h-4 w-4" /> View attachment
                </a>
              )}
            </div>
          )}

          <div className="mt-6">
            <Button variant="outline" className="border-slate-700 text-slate-200" onClick={() => window.history.back()}>
              Back
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

function AssignmentsPanel({
  classroomId,
  assignments,
  templates,
  loading,
  onCreated,
  onRefresh,
  onError,
  onSelect,
}: {
  classroomId: number;
  assignments: Assignment[];
  templates: AssignmentTemplate[];
  loading: boolean;
  onCreated: (a: Assignment) => void;
  onRefresh: () => Promise<void>;
  onError: (msg: string | null) => void;
  onSelect: (a: Assignment | null) => void;
}) {
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
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setTitle(tpl.title);
      if (tpl.description) setDesc(tpl.description);
    }
  }, [templateId, templates]);

  async function add() {
    if (!title.trim()) {
      setLocalError("Enter a title for the assignment.");
      return;
    }
    setSaving(true);
    setLocalError(null);
    onError(null);
    try {
      const payload = {
        classroom_id: classroomId,
        title: title.trim(),
        description: desc.trim() ? desc.trim() : null,
        due_date: due ? new Date(due).toISOString() : null,
      };
      const created = await createAssignment(payload);
      if (file) {
        await uploadAssignmentAttachment(created.id, file);
      }
      onCreated(created);
      setTitle("");
      setDesc("");
      setDue("");
      setTemplateId("");
      setFile(null);
      await onRefresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to create assignment";
      setLocalError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-sm text-slate-300">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-900/60 border-slate-700" />
        </div>
        <div>
          <label className="text-sm text-slate-300">Due (optional)</label>
          <Input
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="bg-slate-900/60 border-slate-700"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">Templates</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full h-10 rounded-md bg-slate-900/60 border border-slate-700 px-3 text-sm text-slate-100"
          >
            <option value="">Choose a polynomial exercise</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="text-sm text-slate-300">Attach assignment PDF/document (optional)</label>
          <div
            className="mt-1 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
          >
            <input
              type="file"
              className="text-sm text-slate-200"
              accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <span className="text-xs text-slate-400 truncate">{file.name}</span>
            ) : (
              <span className="text-xs text-slate-500">No file chosen</span>
            )}
          </div>
        </div>
      </div>
      <div className="md:col-span-3">
        <label className="text-sm text-slate-300">Description (optional)</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100"
        />
      </div>
      {localError && (
        <div className="rounded-md border border-rose-700/40 bg-rose-900/20 px-3 py-2 text-sm text-rose-200">
          {localError}
        </div>
      )}
      <Button onClick={add} disabled={saving} className="h-11 bg-cyan-500 text-slate-900 hover:bg-cyan-400">
        <Upload className="h-4 w-4 mr-1" /> {saving ? "Publishing..." : "Publish Assignment"}
      </Button>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-slate-300">
            Loading assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-slate-300">
            No assignments yet. Add one above.
          </div>
        ) : (
          assignments.map((a, idx) => (
            <div key={a.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-start gap-3">
                <Inbox className="h-5 w-5 text-indigo-400 mt-0.5" />
                <div>
                  <div className="font-semibold">{`Asg ${asgNumberMap[a.id] ?? idx + 1}: ${a.title}`}</div>
                  {a.description && <div className="text-sm text-slate-400 whitespace-pre-line">{a.description}</div>}
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Clock3 className="h-3.5 w-3.5" /> {a.due_date ? `Due ${new Date(a.due_date).toLocaleString()}` : "No due date"}
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
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-slate-200"
                      onClick={() => onSelect(a)}
                    >
                      Open inline
                    </Button>
                    <Link to={`/instructor/assignments/${a.id}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="text-cyan-300 hover:text-cyan-200">
                        Open in new tab
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MaterialsPanel({
  classroomId,
  materials,
  loading,
  onCreated,
  onRefresh,
  onError,
}: {
  classroomId: number;
  materials: Material[];
  loading: boolean;
  onCreated: (m: Material) => void;
  onRefresh: () => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function add() {
    if (!title.trim()) {
      setLocalError("Enter a title for the material.");
      return;
    }
    setSaving(true);
    setLocalError(null);
    onError(null);
    try {
      const created = await createMaterial({
        classroom_id: classroomId,
        title: title.trim(),
        description: desc.trim() || null,
      });
      if (file) {
        await uploadMaterialFile(created.id, file);
      }
      onCreated(created);
      setTitle("");
      setDesc("");
      setFile(null);
      await onRefresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to upload material";
      setLocalError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="text-sm text-slate-300">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-900/60 border-slate-700" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-slate-300">Description (optional)</label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="bg-slate-900/60 border-slate-700" />
        </div>
        <div className="md:col-span-3">
          <label className="text-sm text-slate-300">Attach file (optional)</label>
          <div className="mt-1 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
            <input
              type="file"
              className="text-sm text-slate-200"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? <span className="text-xs text-slate-400 truncate">{file.name}</span> : <span className="text-xs text-slate-500">No file chosen</span>}
          </div>
        </div>
      </div>
      {localError && (
        <div className="rounded-md border border-rose-700/40 bg-rose-900/20 px-3 py-2 text-sm text-rose-200">
          {localError}
        </div>
      )}
      <Button onClick={add} disabled={saving} className="h-11 bg-cyan-500 text-slate-900 hover:bg-cyan-400">
        <Upload className="h-4 w-4 mr-1" /> {saving ? "Uploading..." : "Upload Material"}
      </Button>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-slate-300">Loading materials...</div>
        ) : materials.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-slate-300">
            No materials yet. Upload slides, PDFs, or links.
          </div>
        ) : (
          materials.map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 flex items-start gap-3">
              <FileText className="h-5 w-5 text-cyan-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">{m.title}</div>
                {m.description && <div className="text-sm text-slate-400">{m.description}</div>}
                {m.file_url && (
                  <a
                    href={`${AUTH_BASE_URL}${m.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200"
                  >
                    <Download className="h-4 w-4" /> Download
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SubmissionsPanel({
  submissions,
  assignments,
}: {
  submissions: Submission[];
  assignments: Assignment[];
}) {
  const relative = (iso: string) => {
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
  };

  const grouped = assignments.map((a, idx) => ({
    assignment: a,
    label: `Asg ${idx + 1}`,
    subs: submissions.filter((s) => s.assignment_id === a.id),
  }));

  return (
    <div className="space-y-3">
      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
          No submissions yet.
        </div>
      ) : (
        grouped.map(({ assignment, label, subs }) => (
          <div key={assignment.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-100">
                {label}: {assignment.title}
              </div>
              <div className="text-xs text-slate-500">{subs.length} submission(s)</div>
            </div>
            {subs.length === 0 ? (
              <div className="text-sm text-slate-400">No submissions for this assignment.</div>
            ) : (
              subs.map((s) => <SubmissionRow key={s.id} submission={s} relative={relative} />)
            )}
          </div>
        ))
      )}
    </div>
  );
}

function SubmissionRow({ submission, relative }: { submission: Submission; relative: (iso: string) => string }) {
  const [gradeInput, setGradeInput] = React.useState<string | number>(submission.grade ?? "");
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

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
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex justify-between text-sm text-slate-200">
        <div>
          <div className="font-semibold">{submission.user_email ?? `User #${submission.user_id}`}</div>
          <div className="text-xs text-slate-400">
            Submitted {relative(submission.submitted_at)}
          </div>
          <div className="text-xs text-slate-500">Submission ID: {submission.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={gradeInput}
            onChange={(e) => setGradeInput(e.target.value)}
            className="w-20 h-9 bg-slate-900/70 border-slate-700 text-sm"
            placeholder="Grade"
          />
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" disabled={saving} onClick={saveGrade}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      {err && <div className="text-xs text-rose-300 mt-2">{err}</div>}
      {submission.grade !== null && submission.grade !== undefined && !err && (
        <div className="text-xs text-emerald-300 mt-1">Grade saved: {submission.grade}</div>
      )}
    </div>
  );
}
