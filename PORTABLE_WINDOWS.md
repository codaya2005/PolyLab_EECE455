# Portable Windows bundle (unzip & double-click)

Goal: produce a zip that includes portable Python, the backend, and the built frontend in `Backend/static`, so a user can unzip and run `Start-PolyLab.bat` to start everything on http://localhost:8000.

## Prerequisites
- Windows
- Node.js 18+ for the frontend build
- Python 3.11+ (only for building; the bundle ships its own portable Python)
- PowerShell

## 1) Build the frontend into Backend/static
```powershell
cd Frontend
npm ci
npm run build         # outputs to Frontend/dist
cd ..

Remove-Item Backend/static -Recurse -Force -ErrorAction SilentlyContinue
New-Item Backend/static -ItemType Directory | Out-Null
Copy-Item Frontend/dist/* Backend/static -Recurse
```

## 2) Prepare portable Python
1. Download the **Windows embeddable package** for your Python version (e.g., `python-3.11.x-embed-amd64.zip`) from python.org.
2. Extract it to `bundle/python/` (create `bundle/` if missing).
3. Open `bundle/python/python311._pth` (or matching version) and uncomment the `import site` line so site-packages are loaded.
4. Download `get-pip.py` and run:
   ```powershell
   bundle/python/python.exe get-pip.py
   ```

## 3) Install backend deps into the embedded site-packages
```powershell
bundle/python/python.exe -m pip install -r Backend/requirements.txt `
  --target bundle/python/Lib/site-packages `
  --no-cache-dir
```

## 4) Stage the app files
```powershell
$bundle = Join-Path $PWD "bundle"
Remove-Item $bundle -Recurse -Force -ErrorAction SilentlyContinue
New-Item $bundle -ItemType Directory | Out-Null

# Backend + config
Copy-Item Backend $bundle -Recurse
Copy-Item .env $bundle/.env -Force   # edit for production secrets if needed
New-Item "$bundle/Backend/uploads" -ItemType Directory -Force | Out-Null

# Startup script
Copy-Item Start-PolyLab.bat $bundle/ -Force
```

Bundle contents should now look like:
```
bundle/
  Backend/
    static/          # from Frontend/dist/*
    uploads/         # empty ok
    ...backend code...
  python/            # portable Python
  .env
  Start-PolyLab.bat
```

## 5) Package & test
```powershell
Compress-Archive -Path (Join-Path $bundle '*') -DestinationPath PolyLab-portable.zip -Force
```
Test by unzipping `PolyLab-portable.zip` to a fresh folder, double-click `Start-PolyLab.bat`, and open http://localhost:8000.

## Notes
- The batch file prefers `python\python.exe` beside it; if missing, it falls back to system `python`.
- Keep the Python version in the embeddable zip aligned with your dev version to avoid ABI surprises.
- After installing with pip you can remove `get-pip.py` and any `%LocalAppData%\pip\Cache` entries to shrink the zip.
