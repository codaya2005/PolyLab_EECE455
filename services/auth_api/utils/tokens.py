
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.token import Token
from ..models.user import User

def make_token(db: Session, user: User, purpose: str, minutes: int) -> str:
    t = secrets.token_urlsafe(32)
    tok = Token(user_id=user.id, token=t, purpose=purpose, expires_at=datetime.utcnow()+timedelta(minutes=minutes))
    db.add(tok); db.commit()
    return t

def consume_token(db: Session, tok: str, purpose: str) -> User | None:
    row = db.query(Token).filter(Token.token==tok, Token.purpose==purpose).first()
    if not row or row.expires_at < datetime.utcnow():
        return None
    user = db.query(User).filter(User.id==row.user_id).first()
    db.delete(row); db.commit()
    return user
