
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..db.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    email_verified = Column(Boolean, default=False)
    role = Column(String, default="student")  # student|instructor|admin
    totp_secret = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
