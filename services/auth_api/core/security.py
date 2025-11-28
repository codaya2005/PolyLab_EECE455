
import secrets, uuid, time
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import Response, Request, HTTPException, status, Depends
from .config import settings
from ..db.session import get_db 
from sqlalchemy.orm import Session
from ..models.user import User
from ..models.session import Session as DBSession

from passlib.hash import argon2

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def set_session_cookie(response: Response, session_id: str):
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.SESSION_TTL_MINUTES * 60,
        path="/",
    )

def clear_session_cookie(response: Response):
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")

def create_session(db: Session, user: User) -> str:
    now = datetime.utcnow()
    sid = str(uuid.uuid4())
    exp = now + timedelta(minutes=settings.SESSION_TTL_MINUTES)
    sess = DBSession(id=sid, user_id=user.id, created_at=now, expires_at=exp)
    db.add(sess); db.commit()
    return sid

def require_user(request: Request, db: Session = Depends(get_db)) -> User:
    sid = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not sid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    sess = db.query(DBSession).filter(DBSession.id==sid).first()
    if not sess or sess.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    user = db.query(User).filter(User.id==sess.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_role(role: str):
    def _dep(user: User = Depends(require_user)) -> User:
        roles = ["student","instructor","admin"]
        if role == "admin":
            if user.role != "admin":
                raise HTTPException(status_code=403, detail="Admin only")
        elif role == "instructor":
            if user.role not in ("instructor","admin"):
                raise HTTPException(status_code=403, detail="Instructor or Admin only")
        return user
    return _dep

PASSWORD_POLICY = {
    "min_len": 8,
    "max_len": 256,
    "require_upper": True,
    "require_lower": True,
    "require_digit": True,
    "require_symbol": True,
}

def password_policy_ok(pw: str) -> bool:
    if len(pw) < PASSWORD_POLICY["min_len"]:
        return False
    if len(pw) > PASSWORD_POLICY["max_len"]:
        return False
    upp = any(c.isupper() for c in pw)
    low = any(c.islower() for c in pw)
    dig = any(c.isdigit() for c in pw)
    sym = any(not c.isalnum() for c in pw)
    checks = [upp if PASSWORD_POLICY["require_upper"] else True,
              low if PASSWORD_POLICY["require_lower"] else True,
              dig if PASSWORD_POLICY["require_digit"] else True,
              sym if PASSWORD_POLICY["require_symbol"] else True]
    return all(checks)
