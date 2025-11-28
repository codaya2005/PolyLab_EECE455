"""
Compatibility shim that re-uses the consolidated Backend FastAPI app.

Running `uvicorn services.auth_api.app:app` now serves the same application
as `uvicorn Backend.main:app`, so there is a single source of truth for
routers, settings, models, and middleware.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure project root is importable when launched from within services/
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from Backend.main import app  # noqa: E402  (import after sys.path tweak)

__all__ = ["app"]
