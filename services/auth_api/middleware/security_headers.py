
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from ..core.config import settings

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        resp = await call_next(request)
        # Basic headers for dev
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Referrer-Policy"] = "no-referrer"
        # CSP - allow frontend origin for dev
        fe = settings.FRONTEND_ORIGIN
        resp.headers["Content-Security-Policy"] = (
            f"default-src 'self'; script-src 'self' 'unsafe-inline'; "
            f"style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
            f"connect-src 'self' {fe}; frame-ancestors 'none';"
        )
        if settings.HSTS_ENABLED:
            resp.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return resp
