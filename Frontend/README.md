PolyLab Frontend
=================

## Prerequisites

- Node.js 18+ (LTS recommended)
- Auth API running locally (see `services/auth_api/README.md`)

## Setup

1. Install dependencies  
   ```bash
   cd Frontend
   npm install
   ```
2. Configure environment variables  
   Create `Frontend/.env` (or `.env.local`) with at least:
   ```
   VITE_API_BASE_URL_AUTH=http://localhost:8000
   ```
   Keep the host consistent with the backend to avoid CSRF/cookie issues.
3. Start the dev server  
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
   App runs on http://localhost:5173 (or your host) and calls the API at `VITE_API_BASE_URL_AUTH`.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS
- framer-motion, lucide-react

## Path aliases

- `@` → `src`
