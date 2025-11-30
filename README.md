# PolyLab – Classroom + Auth Platform

FastAPI backend with session + CSRF protection and MFA (TOTP), SQLite by default. Vite/React frontend with role-based dashboards (student, instructor, admin).

## Quick start
1) Backend env: copy `.env` in repo root (already present) and adjust if needed. Defaults: SQLite `./auth.db`, frontend origin `http://localhost:5173`, API base `http://localhost:8000`.
2) Backend install/run (PowerShell):
```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r Backend/requirements.txt
uvicorn Backend.main:app --reload --host 0.0.0.0 --port 8000
```
Health/docs: http://127.0.0.1:8000/health , http://127.0.0.1:8000/docs

3) Frontend install/run:
```
cd Frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
4) Login/signup at http://localhost:5173 . CSRF cookie + header are managed automatically by the frontend API client.

## Notes
- CSRF: double-submit cookie (`csrf_token`) validated for unsafe methods. Exempt: login/signup/verify/reset/logout, auth/csrf. All other POST/PUT/PATCH/DELETE require the header.
- MFA: TOTP enrollment at `/auth/mfa/totp` (pending secret until verified). Login requires TOTP only when `totp_enabled` is true.
- Seed admin: set `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`; created at backend startup.
- CORS: `CORS_ORIGINS` in `.env` controls allowed frontend hosts.
