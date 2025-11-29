import React from "react";
import Navbar from "@/components/ui/Navbar";
import StudentNavbar from "@/components/ui/StudentNavbar";
import NavbarUser from "@/components/ui/NavBarUser";
import { useAuth } from "@/contexts/AuthContext";
import bgCircuit from "@/assets/background.png";

type InfoVariant = "docs" | "tutorials" | "examples" | "security";

type InfoSection = {
  title: string;
  items: string[];
};

type InfoMeta = {
  title: string;
  lead: string;
  sections: InfoSection[];
};

const meta: Record<InfoVariant, InfoMeta> = {
  docs: {
    title: "Documentation",
    lead: "How to run PolyLab, call the API, and understand the main feature areas.",
    sections: [
      {
        title: "Getting Started",
        items: [
          "Backend: uvicorn Backend.main:app --reload --host 0.0.0.0 --port 8000 (env from repo .env; SQLite by default).",
          "Frontend: npm install && npm run dev -- --host 0.0.0.0 --port 5173 with VITE_API_BASE_URL_AUTH=http://localhost:8000.",
          "OpenAPI/Swagger: http://localhost:8000/docs, health check: /health, uploads served at /uploads.",
        ],
      },
      {
        title: "Auth & Sessions",
        items: [
          "Signup, email verification, login, logout, password reset, MFA TOTP (enroll/verify/disable).",
          "Password policy: min 8 chars, upper/lower/digit/symbol required.",
        ],
      },
      {
        title: "Roles & Access",
        items: [
          "Roles: student (default), instructor, admin; role enforcement via dependencies.",
          "Instructor upgrade: POST /roles/requests with proof upload; admin approves/rejects at /admin/roles/requests/{id}/approve|reject.",
        ],
      },
      {
        title: "Classrooms & Work",
        items: [
          "Classrooms: create/list/join by code; assignments + materials belong to classrooms.",
          "Assignments: create, attach file, list by classroom, submit text/file, grade submissions.",
          "Quizzes model exists; submissions endpoint returns per-classroom or per-assignment lists.",
        ],
      },
    ],
  },
  tutorials: {
    title: "Tutorials",
    lead: "Guided flows to exercise the main features end-to-end.",
    sections: [
      {
        title: "Account Flow (Student)",
        items: [
          "1) Sign up with a strong password.",
          "2) Open the verification link from email and confirm.",
          "3) If want to reset password: request link, receive link by email, set a new password, log back in.",
          "4) Optional: enable MFA (scan QR, enter 6-digit code, then login will require it).",
        ],
      },
      {
        title: "Student Journey",
        items: [
          "1) Join a classroom with the provided code.",
          "2) Open Materials and download any shared files.",
          "3) Open an assignment, submit work (text or file), verify it appears in submissions.",
          "4) Use Calculator to experiment with GF(2^m) while reviewing.",
        ],
      },
      {
        title: "Instructor Journey",
        items: [
          "1) Request instructor role with proof upload; (as admin) approve it.",
          "2) Create a classroom; copy the join code and share it.",
          "3) Create an assignment (add attachment if needed) and a material.",
          "4) After students submit, open the assignment, review submissions, and post grades.",
          "5) Optional: enable MFA (scan QR, enter 6-digit code) to protect instructor access.",
        ],
      },
    ],
  },
  examples: {
    title: "Examples",
    lead: "Concrete snippets and steps for common API interactions.",
    sections: [
      {
        title: "Auth",
        items: [
          "Get CSRF (optional before session): GET /auth/csrf.",
          "Login: POST /auth/login with JSON {email, password} (include TOTP if required).",
          "Logout: POST /auth/logout (cookie + x-csrf-token).",
          "MFA enroll: POST /auth/mfa/totp/enroll; verify: POST /auth/mfa/totp/verify (code + mfa_token); disable: POST /auth/mfa/totp/disable (code).",
        ],
      },
      {
        title: "Classrooms",
        items: [
          "Create: POST /classrooms {name}.",
          "Join: POST /classrooms/join {code}.",
          "List mine: GET /classrooms; assignments in a class: GET /assignments/classroom/{id}.",
        ],
      },
      {
        title: "Assignments & Submissions",
        items: [
          "Create assignment: POST /assignments {title, description?, classroom_id, due_date?}.",
          "Attach file: POST /assignments/{id}/attachment (multipart form-data with file).",
          "Submit: POST /submissions {assignment_id, content} or POST /submissions/{id}/upload with file.",
          "Grade: POST /submissions/{id}/grade?grade=95 (instructor/admin).",
        ],
      },
      {
        title: "Instructor Requests",
        items: [
          "Submit proof: POST /roles/requests (multipart with file and optional note).",
          "Admin list: GET /admin/roles/requests?status=pending; approve/reject via POST /admin/roles/requests/{id}/{approve|reject}.",
        ],
      },
    ],
  },
  security: {
    title: "Security",
    lead: "How PolyLab protects sessions and handles risky operations.",
    sections: [
      {
        title: "Sessions & Cookies",
        items: [
          "HttpOnly session cookie (Secure when DEBUG=false, SameSite=Lax), TTL controlled by SESSION_TTL_MINUTES.",
          "Argon2 password hashing; session pruning on login.",
        ],
      },
      {
        title: "CSRF & Rate Limit",
        items: [
          "Double-submit CSRF: csrf_token cookie + x-csrf-token header on unsafe methods (login/signup/reset/verify/logout/csrf exempt).",
          "Basic per-IP rate limiting: settings.RATE_LIMIT_PER_MINUTE within a 60s window.",
        ],
      },
      {
        title: "Headers & Transport",
        items: [
          "Security headers middleware: CSP, X-Frame-Options=DENY, X-Content-Type-Options=nosniff, Referrer-Policy=no-referrer.",
          "HSTS toggle via HSTS_ENABLED; enable in production with HTTPS.",
        ],
      },
      {
        title: "Roles & Access",
        items: [
          "Role-guarded routes for instructor/admin actions; instructor promotion only via admin approval.",
          "Uploads stored under /uploads; proofs capped at 10 MB.",
        ],
      },
    ],
  },
};

function InfoLayout({ variant }: { variant: InfoVariant }) {
  const data = meta[variant];
  const { user } = useAuth();

  const navbar = user
    ? user.role === "student"
      ? <StudentNavbar />
      : <NavbarUser email={user.email} role={user.role} />
    : <Navbar />;

  return (
    <div className="relative min-h-screen text-slate-100">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${bgCircuit})` }}
      />
      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative">
        {navbar}
        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">PolyLab</p>
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
          <p className="mt-2 text-slate-400">{data.lead}</p>

          <div className="mt-6 space-y-4">
            {data.sections.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6"
              >
                <h2 className="text-lg font-semibold text-slate-100">{section.title}</h2>
                <div className="mt-3 space-y-2">
                  {section.items.map((line) => (
                    <div key={line} className="flex gap-3 text-slate-200">
                      <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400/80" />
                      <p className="leading-6 text-sm sm:text-base text-slate-300">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DocsPage() {
  return <InfoLayout variant="docs" />;
}

export function TutorialsPage() {
  return <InfoLayout variant="tutorials" />;
}

export function ExamplesPage() {
  return <InfoLayout variant="examples" />;
}

export function SecurityPage() {
  return <InfoLayout variant="security" />;
}
