# PolyLab Project - EECE455

## Option 1: Using the `.bat` file (Recommended)
1. Open the project folder.
2. If you have a suitable Python version installed:
   - Run **Start-PolyLab.bat** from the project root.  
   - This will automatically start the backend and show you the local link.
3. If not:
   - Use the bundled Python by running **Start-PolyLab.bat** inside the `bundle` folder.
   - The script will use the embedded Python to run the project.

---

## Option 2: Running it locally (Standard Setup)

## Backend Setup
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
npm run dev
```
4) Login/signup at http://localhost:5173 . CSRF cookie + header are managed automatically by the frontend API client.


