@echo off
setlocal EnableDelayedExpansion

REM Root of the unzipped bundle (this file lives here)
set "ROOT=%~dp0"
set "APP_DIR=%ROOT%Backend"

REM Prefer the portable Python placed at %ROOT%python\python.exe; fall back to system python
if exist "%ROOT%python\python.exe" (
    set "PYTHON_EXE=%ROOT%python\python.exe"
    set "PYTHONHOME=%ROOT%python"
    REM Ensure the embedded build can find the app code
    set "PYTHONPATH=%APP_DIR%;%ROOT%"
) else (
    set "PYTHON_EXE=python"
)

REM Customize defaults if needed
set "HOST=localhost"
set "PORT=8000"
REM Example: set "DATABASE_URL=sqlite:///./auth.db"
REM Example: set "ADMIN_EMAIL=admin@polylab.app" & set "ADMIN_PASSWORD=AdminPass123!"

pushd "%ROOT%"
echo Starting PolyLab on localhost:!PORT! ...
"%PYTHON_EXE%" -m uvicorn Backend.main:app --host !HOST! --port !PORT!
popd

echo.
echo Server stopped. Close this window or press any key.
pause >nul
endlocal
