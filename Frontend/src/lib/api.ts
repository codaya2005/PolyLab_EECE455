/// <reference types="vite/client" />
// Central API client for Auth/Classroom service (FastAPI backend)
// Handles base URL resolution, credentials, CSRF tokens, and typed helpers.

export const AUTH_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL_AUTH || "/api";
const CSRF_COOKIE_NAME = "csrf_token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    const message = formatErrorMessage(status, data);
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function formatErrorMessage(status: number, data: unknown): string {
  const detail = extractDetail(data);
  if (detail) return detail;

  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    const merged = data.map(extractDetail).filter(Boolean).join("; ");
    if (merged) return merged;
  }

  if (data && typeof data === "object") {
    try {
      return JSON.stringify(data);
    } catch {
      /* ignore and fall through */
    }
  }

  return `API request failed with status ${status}`;
}

function extractDetail(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;

  const detail = (value as any).detail ?? value;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return (item as any).msg ?? (item as any).detail ?? JSON.stringify(item);
        }
        return null;
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }

  if (detail && typeof detail === "object") {
    const msg = (detail as any).msg ?? (detail as any).detail;
    if (typeof msg === "string") return msg;
  }

  return null;
}

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: BodyInit | null;
  headers?: HeadersInit;
  json?: unknown;
  skipCsrf?: boolean;
};

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const finalInit: RequestInit = {
    ...init,
    method,
    headers,
    credentials: "include",
  };

  if (init.json !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    finalInit.body = JSON.stringify(init.json);
  } else if (init.body !== undefined) {
    finalInit.body = init.body;
  }

  if (!SAFE_METHODS.has(method) && !init.skipCsrf) {
    const token = await ensureCsrfToken();
    if (!token) {
      throw new ApiError(0, "CSRF token unavailable");
    }
    headers.set("x-csrf-token", token);
  }

  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE_URL}${path}`, finalInit);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new ApiError(
      0,
      `Network error reaching auth API. Ensure the backend is running and CORS allows this origin. (${msg})`,
    );
  }

  const text = await res.text();
  const data = text ? tryParseJSON(text) : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, data ?? text ?? res.statusText);
  }

  return (data as T) ?? (undefined as T);
}

const csrfCache: { value: string | null; fetchedAt: number | null } = {
  value: null,
  fetchedAt: null,
};
let inflightCsrf: Promise<string | null> | null = null;

async function ensureCsrfToken(): Promise<string | null> {
  const fromCookie = readCookie(CSRF_COOKIE_NAME);
  if (fromCookie) {
    csrfCache.value = fromCookie;
    csrfCache.fetchedAt = Date.now();
    return fromCookie;
  }

  if (!inflightCsrf) {
    inflightCsrf = fetchCsrfToken().finally(() => {
      inflightCsrf = null;
    });
  }

  const token = await inflightCsrf;
  csrfCache.value = token;
  csrfCache.fetchedAt = token ? Date.now() : null;
  return token;
}

export async function prefetchCsrfToken(): Promise<void> {
  await ensureCsrfToken();
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/auth/csrf`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { csrf?: string };
    return data?.csrf ?? null;
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    ?.split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function tryParseJSON(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

// ------- Typed API methods -------

export type SignupPayload = {
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  totp?: string;
};

export type BasicOk = { ok: boolean };

export type UserProfile = {
  id: number;
  email: string;
  role: "student" | "instructor" | "admin";
  email_verified: boolean;
  totp_enabled?: boolean;
};

export type Classroom = {
  id: number;
  name: string;
  code: string;
  instructor_id: number;
  created_at: string;
};

export type Assignment = {
  id: number;
  title: string;
  description?: string | null;
  classroom_id: number;
  due_date?: string | null;
  attachment_url?: string | null;
  created_at: string;
};

export type Material = {
  id: number;
  classroom_id: number;
  title: string;
  description?: string | null;
  file_url?: string | null;
  created_at: string;
};

export type AssignmentTemplate = {
  id: string;
  title: string;
  description?: string | null;
};

export type Submission = {
  id: number;
  user_id: number;
  user_email?: string;
  assignment_id: number;
  content: string;
  grade?: number | null;
  submitted_at: string;
};

export type InstructorRequest = {
  id: number;
  user_id: number;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  file_path: string;
  // Admin-facing fields may be present on GET /admin/roles/requests and GET /admin/roles/requests/{id}
  created_at?: string;
  decision_by?: number | null;
  decided_at?: string | null;
  user_email?: string | null;
};

export type MFAEnrollOut = {
  secret: string;
  otpauth: string;
  mfa_token: string;
};

export async function signup(body: SignupPayload): Promise<BasicOk> {
  return request("/auth/signup", {
    method: "POST",
    json: body,
    // Signup is CSRF-exempt server-side; skipping avoids an extra round-trip
    // that can fail when the API isn't reachable yet.
    skipCsrf: true,
  });
}

export async function login(body: LoginPayload): Promise<BasicOk> {
  const result = await request<BasicOk>("/auth/login", {
    method: "POST",
    json: body,
    // Login is CSRF-exempt before a session exists, but ensureCsrfToken
    // prefetch keeps signup/other flows working. Skip to avoid extra hit.
    skipCsrf: true,
  });
  await ensureCsrfToken(); // refresh after session cookie is set
  return result;
}

export async function logout(): Promise<BasicOk> {
  return request("/auth/logout", { method: "POST" });
}

export async function requestPasswordReset(email: string): Promise<BasicOk> {
  const qs = new URLSearchParams({ email });
  return request(`/auth/reset?${qs.toString()}`, { method: "POST" });
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<BasicOk> {
  const qs = new URLSearchParams({ token, new_password: newPassword });
  return request(`/auth/reset/confirm?${qs.toString()}`, { method: "POST" });
}

export async function verifyEmail(token: string): Promise<BasicOk> {
  const qs = new URLSearchParams({ token });
  return request(`/auth/verify-email?${qs.toString()}`, { method: "POST" });
}

export async function getProfile(): Promise<UserProfile> {
  return request("/me", { method: "GET" });
}

// --- Classrooms ---

export async function listClassrooms(): Promise<Classroom[]> {
  return request("/classrooms", { method: "GET" });
}

export async function createClassroom(name: string): Promise<Classroom> {
  return request("/classrooms", {
    method: "POST",
    json: { name },
  });
}

export async function joinClassroom(code: string): Promise<BasicOk> {
  return request("/classrooms/join", {
    method: "POST",
    json: { code },
  });
}

// --- Assignments ---

type AssignmentCreatePayload = {
  title: string;
  description?: string | null;
  classroom_id: number;
  due_date?: string | null;
};

export async function listAssignments(classroomId: number | string): Promise<Assignment[]> {
  return request(`/assignments/classroom/${classroomId}`, { method: "GET" });
}

export async function getAssignment(assignmentId: number | string): Promise<Assignment> {
  return request(`/assignments/${assignmentId}`, { method: "GET" });
}

export async function createAssignment(payload: AssignmentCreatePayload): Promise<Assignment> {
  return request("/assignments", {
    method: "POST",
    json: payload,
  });
}

export async function listAssignmentTemplates(): Promise<AssignmentTemplate[]> {
  return request("/assignments/templates", { method: "GET" });
}

export async function uploadAssignmentAttachment(
  assignmentId: number,
  file: File,
): Promise<Assignment> {
  const form = new FormData();
  form.append("file", file);
  return request(`/assignments/${assignmentId}/attachment`, {
    method: "POST",
    body: form,
  });
}

export async function submitAssignment(
  assignmentId: number,
  content: string,
): Promise<Submission> {
  return request("/submissions", {
    method: "POST",
    json: { assignment_id: assignmentId, content },
  });
}

export async function uploadAssignmentFile(
  assignmentId: number,
  file: File,
): Promise<Submission> {
  const form = new FormData();
  form.append("file", file);
  return request(`/submissions/${assignmentId}/upload`, {
    method: "POST",
    body: form,
  });
}

export async function listSubmissionsForAssignment(
  assignmentId: number,
): Promise<Submission[]> {
  return request(`/submissions/assignment/${assignmentId}`, { method: "GET" });
}

export async function listSubmissionsForClassroom(
  classroomId: number | string,
): Promise<Submission[]> {
  return request(`/submissions/classroom/${classroomId}`, { method: "GET" });
}

export async function listMaterials(classroomId: number | string): Promise<Material[]> {
  return request(`/materials/classroom/${classroomId}`, { method: "GET" });
}

export async function createMaterial(payload: {
  classroom_id: number;
  title: string;
  description?: string | null;
  file_url?: string | null;
}): Promise<Material> {
  return request("/materials", {
    method: "POST",
    json: payload,
  });
}

export async function uploadMaterialFile(materialId: number, file: File): Promise<Material> {
  const form = new FormData();
  form.append("file", file);
  return request(`/materials/${materialId}/upload`, {
    method: "POST",
    body: form,
  });
}

export async function gradeSubmission(submissionId: number, grade: number): Promise<BasicOk> {
  const qs = new URLSearchParams({ grade: String(grade) });
  return request(`/submissions/${submissionId}/grade?${qs.toString()}`, { method: "POST" });
}

// --- Instructor requests ---

export async function submitInstructorRequest(
  file: File,
  note?: string,
): Promise<InstructorRequest> {
  const form = new FormData();
  if (note) form.append("note", note);
  form.append("file", file);
  return request("/roles/requests", {
    method: "POST",
    body: form,
  });
}

export async function listInstructorRequests(
  status?: "pending" | "approved" | "rejected",
): Promise<InstructorRequest[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(`/admin/roles/requests${qs}`, { method: "GET" });
}

export async function decideInstructorRequest(id: number, action: "approve" | "reject"): Promise<BasicOk> {
  return request(`/admin/roles/requests/${id}/${action}`, { method: "POST" });
}

export async function getInstructorRequest(id: number): Promise<InstructorRequest> {
  return request(`/admin/roles/requests/${id}`, { method: "GET" });
}

// --- MFA (TOTP) ---

export async function enrollTotpMfa(): Promise<MFAEnrollOut> {
  return request("/auth/mfa/totp/enroll", { method: "POST" });
}

export async function verifyTotpMfa(code: string, mfaToken: string): Promise<BasicOk> {
  return request("/auth/mfa/totp/verify", {
    method: "POST",
    json: { code, mfa_token: mfaToken },
  });
}

export async function disableTotpMfa(code: string): Promise<BasicOk> {
  return request("/auth/mfa/totp/disable", {
    method: "POST",
    json: { code },
  });
}

export const api = {
  signup,
  login,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
  getProfile,
  listClassrooms,
  createClassroom,
  joinClassroom,
  listAssignments,
  getAssignment,
  createAssignment,
  listAssignmentTemplates,
  uploadAssignmentAttachment,
  submitAssignment,
  uploadAssignmentFile,
  listSubmissionsForAssignment,
  listSubmissionsForClassroom,
  listMaterials,
  createMaterial,
  uploadMaterialFile,
  gradeSubmission,
  decideInstructorRequest,
  getInstructorRequest,
  submitInstructorRequest,
  listInstructorRequests,
  enrollTotpMfa,
  verifyTotpMfa,
  disableTotpMfa,
};
