# PolyLab Platform – EECE455

A secure, cryptography-focused learning & assignment management system.

PolyLab is a full-stack, security-hardened academic platform for managing classrooms, assignments, submissions, grading, and GF(2ᵐ) cryptography computations. It features robust authentication, CSRF protection, role-based access, and an integrated finite-field calculator—making it ideal for cryptography and network security coursework.

---

# 🚀 Key Features

## 🔐 Security & Authentication
- CSRF-safe login (double-submit cookie pattern)
- HttpOnly + Secure cookies
- Strict session & token validation
- Rate limiting & request throttling
- Secure file upload & sanitized file handling
- Role-based access control: Student • Instructor • Admin

## 🧮 GF(2ᵐ) Polynomial Arithmetic Engine
Supports:
- Addition / subtraction (XOR)
- Multiplication
- Modular reduction
- Division via multiplicative inverse
- AES Rijndael GF(2⁸) operations
- Step-by-step polynomial visualization

## 🏫 Classroom Management
- Instructor-created classrooms
- Students join with a unique join-code
- Upload course materials
- Assignment creation with deadlines
- Built-in polynomial exercise templates

## 📥 Assignments & Submissions
- File or text submissions
- Inline preview for instructors
- Student & instructor review pages
- Auto time conversion to Asia/Beirut
- Grading interface

## 🛠️ Tech Stack

### Backend
- FastAPI (Python)
- SQLite (local dev) / PostgreSQL (deployment)
- Custom session middleware
- CSRF protection
- File validation & streaming

### Frontend
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Context-based Auth state
- Role-aware routing

### Deployment
- Fully Dockerized (Backend + Frontend)
- Multi-stage Dockerfile
- Deployment on Render with:
  - Auto builds
  - Environment variables
  - HTTPS
  - Containerized runtime

---

# 📦 Installation & Local Setup

## Option 1 — Using the `.bat` file (Recommended)

1. Open the project folder.
2. If you have a compatible Python version installed:
   - Run **Start-PolyLab.bat** from the project root.
   - The backend starts automatically and shows the local link.
3. If not:
   - Open the `bundle/` folder
   - Run **Start-PolyLab.bat**
   - It uses the embedded Python to start the backend.

---

## Option 2 — Standard Local Setup

### Backend Setup
1. Environment file: `.env` exists in repo root. Defaults:
   - SQLite → `./auth.db`
   - Frontend origin → `http://localhost:5173`
   - API base → `http://localhost:8000`

2. Install & run backend:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r Backend/requirements.txt
uvicorn Backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend health & docs:
- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

---

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Access the platform at:
👉 http://localhost:5173

---

# 👥 Project Authors

Developed by:

- Joud Senan
- Aya El Hajj
- Ghada Al Danab
- Roaa Hajj Chehade

As part of:
📘 EECE 455: Cryptography and Network Security

---

# ⭐ Acknowledgment

We thank the EECE Department and **Professor Ali l Hussein** for continuous support and guidance throughout the project.

---

# 🌐 Live Demo & Repository

➡️ Live Platform: https://polylab-website.onrender.com  
➡️ Demo Video: https://www.youtube.com/watch?v=tLylCZbrl5U&t=130s  
➡️ GitHub Repository of the deployed version: https://github.com/Joud158/PolyLab.git
