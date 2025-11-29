
from pydantic import BaseModel, EmailStr, Field

class SignupIn(BaseModel):
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str
    totp: str | None = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    email_verified: bool
    class Config:
        from_attributes = True
