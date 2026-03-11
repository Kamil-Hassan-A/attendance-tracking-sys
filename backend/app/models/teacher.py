"""
Teacher ORM model.
"""
from sqlalchemy import Column, Integer, String, DateTime, func
from ..database import Base


class Teacher(Base):
    """Teacher model for authentication and attendance management."""

    __tablename__ = "teachers"

    teacher_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
