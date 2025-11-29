import React from "react";
import NavBarUser from "@/components/ui/NavBarUser";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listClassrooms, createClassroom, Classroom, ApiError } from "@/lib/api";
import CopyButton from "@/components/ui/CopyButton";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ExternalLink, Plus, Users } from "lucide-react";
import bgCircuit from "@/assets/background.png"; // your background image
import { useAuth } from "@/contexts/AuthContext";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function ClassroomsList() {
  const nav = useNavigate();
  const { user } = useAuth();
  const q = useQuery();
  const [showCreate, setShowCreate] = React.useState(q.get("create") === "1");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<"recent" | "name">("recent");
  const [classes, setClasses] = React.useState<Classroom[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
  }, [refresh]);

  let filtered = classes;
  if (search.trim()) {
    const s = search.trim().toLowerCase();
    filtered = classes.filter(
      (c) => c.name.toLowerCase().includes(s) || (c.code || "").toLowerCase().includes(s),
    );
  }
  if (sort === "name") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  else filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed pointer-events-none"
        style={{ backgroundImage: `url(${bgCircuit})` }}
      />
      {/* dark overlay */}
      <div className="absolute inset-0 bg-slate-950/75 pointer-events-none" />
      <div className="relative z-10">
        <NavBarUser email={user?.email} role={user?.role ?? "instructor"} />
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <PageHeader
            title="My Classrooms"
            right={
              <div className="flex gap-2">
                <Input
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48 bg-slate-900/60 border-slate-700"
                />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="h-10 rounded-md bg-slate-900/60 border border-slate-700 px-3 text-sm"
                >
                  <option value="recent">Recent</option>
                  <option value="name">Name A–Z</option>
                </select>
                <Button onClick={() => setShowCreate(true)} className="bg-cyan-500 text-slate-900 hover:bg-cyan-400">
                  <Plus className="h-4 w-4 mr-1" /> Create Classroom
                </Button>
              </div>
            }
          />

          {error && <div className="mb-4 rounded-lg border border-rose-600/40 bg-rose-900/20 px-4 py-3 text-rose-200 text-sm">{error}</div>}

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-300">
              Loading classrooms...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <div className="text-slate-300 mb-3">You don’t have any classrooms yet.</div>
              <Button onClick={() => setShowCreate(true)} className="bg-cyan-500 text-slate-900 hover:bg-cyan-400">
                <Plus className="h-4 w-4 mr-1" /> Create your first classroom
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-slate-400">
                        {c.code || "No code"} • {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Users className="h-3.5 w-3.5" /> —
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="text-slate-400">
                      Join: <span className="font-mono">{c.code}</span>
                    </div>
                    <CopyButton text={c.code} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to={`/instructor/classrooms/${c.id}`}>
                      <Button size="sm" variant="outline" className="border-slate-700 text-slate-200">
                        <ExternalLink className="h-4 w-4 mr-1" /> Open
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showCreate && <CreateModal onClose={() => { setShowCreate(false); refresh(); }} navigateTo={nav} setError={setError} />}
        </main>
      </div>
    </div>
  );
}

function CreateModal({
  onClose,
  navigateTo,
  setError,
}: {
  onClose: () => void;
  navigateTo: ReturnType<typeof useNavigate>;
  setError: (msg: string | null) => void;
}) {
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function create() {
    if (!name.trim()) {
      setError("Enter a classroom name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const cls = await createClassroom(name.trim());
      onClose();
      navigateTo(`/instructor/classrooms/${cls.id}`);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Failed to create classroom";
      setError(msg);
      console.error("Failed to create classroom", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="text-lg font-semibold mb-4">Create Classroom</div>

        <label className="text-sm text-slate-300">Classroom Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 mb-3 bg-slate-900/60 border-slate-700"
        />

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-200">
            Cancel
          </Button>
          <Button onClick={create} disabled={saving} className="bg-cyan-500 text-slate-900 hover:bg-cyan-400">
            {saving ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
