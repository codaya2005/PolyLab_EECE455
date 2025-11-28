
import secrets
from fastapi import Request, Response, Header, HTTPException, status
from .config import settings

SAFE = {"GET","HEAD","OPTIONS"}

def issue_csrf(response: Response) -> str:
    token = secrets.token_urlsafe(32)
    response.set_cookie(
        settings.CSRF_COOKIE_NAME,
        token,
        httponly=False,
        secure=not settings.DEBUG,  # true only in production
        samesite="lax",
        path="/",
    )

    return token

def csrf_protect(request: Request, x_csrf_token: str | None = Header(default=None)):
    if request.method in SAFE:  # skip safe methods
        return
    cookie = request.cookies.get(settings.CSRF_COOKIE_NAME)
    if not cookie or not x_csrf_token or cookie != x_csrf_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF check failed")
