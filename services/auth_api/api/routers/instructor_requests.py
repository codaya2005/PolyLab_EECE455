
import os, uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from ...core.security import require_user, require_role
from ...db.session import get_db
from ...models.instructor_request import InstructorRequest
from ...schemas.misc import InstructorRequestOut

UPLOAD_DIR = "/mnt/data/uploads"

router = APIRouter(tags=["instructor-requests"])

@router.post("/roles/requests", response_model=InstructorRequestOut)
def submit_request(
    note: str | None = Form(default=None),
    file: UploadFile = File(...),
    user = Depends(require_user),
    db: Session = Depends(get_db),
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        f.write(file.file.read())
    ir = InstructorRequest(user_id=user.id, note=note, file_path=path, status="pending")
    db.add(ir); db.commit(); db.refresh(ir)
    return ir

@router.get("/admin/roles/requests")
def list_requests(status: str | None = None, admin = Depends(require_role("admin")), db: Session = Depends(get_db)):
    q = db.query(InstructorRequest)
    if status in ("pending","approved","rejected"):
        q = q.filter(InstructorRequest.status==status)
    return [{
        "id": r.id, "user_id": r.user_id, "status": r.status, "note": r.note, "file_path": r.file_path, "created_at": r.created_at
    } for r in q.order_by(InstructorRequest.id.desc()).all()]

@router.post("/admin/roles/requests/{req_id}/approve")
def approve_request(req_id: int, admin = Depends(require_role("admin")), db: Session = Depends(get_db)):
    from ...models.user import User
    ir = db.query(InstructorRequest).filter(InstructorRequest.id==req_id).first()
    if not ir: raise HTTPException(status_code=404, detail="Not found")
    ir.status = "approved"; ir.decision_by = admin.id
    user = db.query(User).filter(User.id==ir.user_id).first()
    if user: user.role = "instructor"; db.add(user)
    db.add(ir); db.commit()
    return {"ok": True, "new_role": "instructor"}

@router.post("/admin/roles/requests/{req_id}/reject")
def reject_request(req_id: int, admin = Depends(require_role("admin")), db: Session = Depends(get_db)):
    ir = db.query(InstructorRequest).filter(InstructorRequest.id==req_id).first()
    if not ir: raise HTTPException(status_code=404, detail="Not found")
    ir.status = "rejected"; ir.decision_by = admin.id
    db.add(ir); db.commit()
    return {"ok": True}
