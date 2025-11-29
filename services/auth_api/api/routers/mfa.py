
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.security import require_user
from ...db.session import get_db
from ...utils.totp import create_totp_secret, make_otpauth_uri, verify_totp
from ...schemas.misc import MFAEnrollOut, MFAVerifyIn
from ...models.user import User

router = APIRouter(prefix="/auth/mfa/totp", tags=["mfa"])

@router.post("/enroll", response_model=MFAEnrollOut)
def enroll(user: User = Depends(require_user), db: Session = Depends(get_db)):
    if user.totp_secret:
        # re-enroll: overwrite
        pass
    secret = create_totp_secret()
    user.totp_secret = secret
    db.add(user); db.commit()
    return MFAEnrollOut(secret=secret, otpauth=make_otpauth_uri(secret, user.email, "PolyLab"))

@router.post("/verify")
def verify(body: MFAVerifyIn, db: Session = Depends(get_db)):
    user: User | None = db.query(User).filter(User.id==db.scalar("select user_id from tokens where token=:t and purpose='mfa'", {"t": body.mfa_token})).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid MFA token")
    if not user.totp_secret or not verify_totp(user.totp_secret, body.code):
        raise HTTPException(status_code=400, detail="Invalid code")
    # consume the MFA token
    db.execute("delete from tokens where token=:t and purpose='mfa'", {"t": body.mfa_token}); db.commit()
    return {"ok": True}
