
from fastapi import APIRouter, Depends
from ...core.security import require_user
from ...schemas.user import UserOut
from ...models.user import User

router = APIRouter(prefix="/me", tags=["me"])

@router.get("", response_model=UserOut)
def me(user: User = Depends(require_user)):
    return user
