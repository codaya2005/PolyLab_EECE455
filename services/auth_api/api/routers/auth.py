
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse
from ...db.session import get_db, Base, engine
from ...models.user import User
from ...models.session import Session as DBSession
from ...core.security import hash_password, verify_password, create_session, set_session_cookie, clear_session_cookie, password_policy_ok
from ...core.csrf import csrf_protect, issue_csrf
from ...core.config import settings
from ...schemas.user import SignupIn, LoginIn, UserOut
from ...utils.email import send_verification_email
from ...utils.tokens import consume_token, make_token

Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/csrf")
def get_csrf(response: Response):
    token = issue_csrf(response)
    return {"csrf": token}

@router.post("/signup")
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    if not password_policy_ok(payload.password):
        raise HTTPException(status_code=400, detail="Weak password")
    exists = db.query(User).filter(User.email==payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user); db.commit(); db.refresh(user)
    send_verification_email(db, user)   # 👉 call happens HERE
    return {"ok": True}

def _verify_email_token(token: str, db: Session) -> None:
    user = consume_token(db, token, "verify")
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user.email_verified = True
    db.add(user)
    db.commit()


@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    JSON API version – used by the frontend if it wants to POST the token.
    """
    _verify_email_token(token, db)
    return {"ok": True}


@router.get("/verify-email", response_class=HTMLResponse)
def verify_email_page(token: str, db: Session = Depends(get_db)):
    """
    Link clicked from the email: GET /auth/verify-email?token=...
    Shows a simple HTML page instead of a blank JSON response.
    """
    _verify_email_token(token, db)
    return """
    <html>
      <head><title>Email verified</title></head>
      <body style="font-family: system-ui; text-align:center; margin-top:4rem;">
        <h1>Email verified 🎉</h1>
        <p>You can now return to the PolyLab app and log in.</p>
      </body>
    </html>
    """

@router.post("/login")
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email==payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    if user.totp_secret:
        from ...utils.totp import verify_totp
        if not payload.totp or not verify_totp(user.totp_secret, payload.totp):
            raise HTTPException(status_code=401, detail="MFA TOTP required")
    sid = create_session(db, user)
    set_session_cookie(response, sid)
    issue_csrf(response)
    return {"ok": True}

@router.post("/logout")
def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    sid = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if sid:
        db.query(DBSession).filter(DBSession.id==sid).delete()
        db.commit()
    clear_session_cookie(response)
    return {"ok": True}

@router.post("/reset")
def reset_start(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email==email).first()
    if user:
        from ...utils.email import send_reset_email
        send_reset_email(db, user)
    return {"ok": True}

@router.post("/reset/confirm")
def reset_confirm(token: str, new_password: str, db: Session = Depends(get_db)):
    if not password_policy_ok(new_password):
        raise HTTPException(status_code=400, detail="Weak password")
    user = consume_token(db, token, "reset")
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user.password_hash = hash_password(new_password)
    db.add(user); db.commit()
    return {"ok": True}
