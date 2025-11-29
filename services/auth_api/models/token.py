
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from ..db.session import Base

class Token(Base):
    __tablename__ = "tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    purpose = Column(String, nullable=False)  # "verify" | "reset" | "mfa"
    expires_at = Column(DateTime, nullable=False)
