
from pydantic import BaseModel
from typing import Literal, Optional

class BasicOK(BaseModel):
    ok: bool = True

class MFAStartOut(BaseModel):
    mfa_token: str

class MFAVerifyIn(BaseModel):
    mfa_token: str
    code: str

class MFAEnrollOut(BaseModel):
    secret: str
    otpauth: str

class InstructorRequestOut(BaseModel):
    id: int
    user_id: int
    status: Literal["pending","approved","rejected"]
    note: str | None = None
    file_path: str
