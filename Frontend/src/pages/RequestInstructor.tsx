import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "@/components/ui/StudentNavbar";
import { Loader2, FileUp, ShieldCheck } from "lucide-react";
import { submitInstructorRequest, logout, ApiError } from "@/lib/api";

export default function RequestInstructor() {
  const navigate = useNavigate();
  const [institution, setInstitution] = useState("American University of Beirut");
  const [roleTitle, setRoleTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [country, setCountry] = useState("Lebanon");
  const [instEmail, setInstEmail] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [courses, setCourses] = useState("");
  const [note, setNote] = useState("");
  const [attest, setAttest] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attest || !file) return;
    setBanner(null);

    setSubmitting(true);
    try {
      const compiledNote = [
        `Institution: ${institution}`,
        roleTitle && `Role Title: ${roleTitle}`,
        department && `Department: ${department}`,
        `Country: ${country}`,
        instEmail && `Institution Email: ${instEmail}`,
        profileUrl && `Profile URL: ${profileUrl}`,
        supervisorEmail && `Supervisor Email: ${supervisorEmail}`,
        courses && `Courses: ${courses}`,
        note && `Notes:\n${note}`,
      ]
        .filter(Boolean)
        .join("\n");

      await submitInstructorRequest(file, compiledNote || undefined);
      setBanner({
        type: "success",
        msg: "Request submitted. We will email you after review.",
      });
      setTimeout(() => navigate("/student"), 1200);
    } catch (err) {
      setBanner({
        type: "error",
        msg:
          err instanceof ApiError
            ? err.message
            : "Failed to submit your request. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <StudentNavbar onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Request Instructor Verification</h1>
        <p className="mt-2 text-slate-400">
          Fill this form to verify your academic affiliation. Admins will review your submission.
        </p>

        {banner && (
          <div
            role="alert"
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              banner.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/40 bg-rose-500/10 text-rose-300"
            }`}
          >
            {banner.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-slate-300">Institution</label>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="h-10 w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-10 w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Role Title</label>
              <input
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Lecturer / Professor / TA"
                className="h-10 w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-10 w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Institutional Email</label>
              <input
                value={instEmail}
                onChange={(e) => setInstEmail(e.target.value)}
                placeholder="name@aub.edu.lb"
                className="h-10 w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Profile URL (optional)</label>
              <input
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://www.aub.edu.lb/faculty/..."
                className="h-10 w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1 text-slate-300">Supervisor/Dept Contact (optional)</label>
              <input
                value={supervisorEmail}
                onChange={(e) => setSupervisorEmail(e.target.value)}
                placeholder="chair@aub.edu.lb"
                className="h-10 w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-slate-300">Course(s) you plan to teach (optional)</label>
            <input
              value={courses}
              onChange={(e) => setCourses(e.target.value)}
              className="h-10 w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-slate-300">Proof Document (PDF/JPG/PNG, up to 10MB)</label>
            <label className="group relative block">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="peer sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-slate-300">
                <FileUp className="h-4 w-4" />
                <span className="truncate">{file?.name ?? "Choose File"}</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm mb-1 text-slate-300">Additional Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} />
            <span>I certify that the provided information is accurate.</span>
          </label>

          <button
            type="submit"
            disabled={!file || !attest || submitting}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 font-medium text-slate-900 hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Submit for Review
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-500">
          We review requests manually. We may contact your department to confirm affiliation.
        </p>
      </main>
    </div>
  );
}
