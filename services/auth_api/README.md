# Auth API (now points to `Backend/`)

FastAPI service that powers signup/login, MFA, CSRF-protected sessions, and instructor verification workflows.  
This package now re-exports the consolidated app in `Backend/main.py`, so running:

```bash
uvicorn services.auth_api.app:app --reload --port 8000
```

is equivalent to running:

```bash
uvicorn Backend.main:app --reload --port 8000
```

There is one code path for routers/models/config; keep env values in the repo-level `.env`.

## Prerequisites

- Python 3.12+ (3.13 tested)
- SQLite (default) or another SQLAlchemy-supported database

## Setup

```bash
cd services/auth_api
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then edit values
```

Key `.env` values:

- `SECRET_KEY` – random string used to sign sessions.
- `DATABASE_URL` – defaults to `sqlite:///./auth.db`.
- `FRONTEND_ORIGIN` / `CORS_ORIGINS` – e.g. `http://localhost:5173`.
- `SESSION_COOKIE_NAME`, `CSRF_COOKIE_NAME`, `SESSION_TTL_MINUTES`.

## Running locally

From the repo root (so the `services` package is importable):

```bash
uvicorn services.auth_api.app:app --reload --host 0.0.0.0 --port 8000
```

This issues:

- `session_id` HttpOnly `Secure` cookie
- `csrf_token` readable cookie (mirrored to `x-csrf-token` by the frontend for unsafe requests)

## Email verification

`/auth/signup` generates a verification token and calls `utils.email.send_verification_email`. The default implementation prints the link to the server console. Replace it with SMTP/SendGrid/etc. so every user receives the link via email in production.

## Key endpoints

- `POST /auth/signup`, `POST /auth/verify-email`
- `POST /auth/login`, `POST /auth/logout`
- `POST /auth/reset`, `POST /auth/reset/confirm`
- `POST /roles/requests` (student uploads proof)
- Admin review: `GET /admin/roles/requests`, `POST /admin/roles/requests/{id}/approve|reject`

Additional features:

- CSP + security headers, optional HSTS
- Basic per-IP rate limiting (dev)
- File uploads currently saved to `/mnt/data/uploads`; change `UPLOAD_DIR` in `api/routers/instructor_requests.py` for your deploy target.
