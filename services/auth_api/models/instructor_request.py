
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..db.session import Base

class InstructorRequest(Base):
    __tablename__ = "instructor_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note = Column(String, nullable=True)
    file_path = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending|approved|rejected
    decision_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
