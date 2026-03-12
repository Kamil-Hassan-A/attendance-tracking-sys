"""
Pydantic schemas for student and attendance data.
"""
from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from enum import Enum


class AttendanceStatusEnum(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"


class StudentCreate(BaseModel):
    student_id: str
    full_name: str
    email: EmailStr
    course: str
    year_level: int


class StudentUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    course: str | None = None
    year_level: int | None = None


class StudentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    student_id: str
    full_name: str
    email: str
    course: str
    year_level: int
    created_by: int
    created_at: datetime


class AttendanceCreate(BaseModel):
    student_id: int
    date: date
    status: AttendanceStatusEnum
    remarks: str | None = None


class AttendanceResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    student_id: int
    date: date
    status: AttendanceStatusEnum
    remarks: str | None = None
    marked_by: int
    created_at: datetime


class AttendanceStats(BaseModel):
    student_id: int
    full_name: str
    total_days: int
    present: int
    absent: int
    late: int
    percentage: float
    is_below_threshold: bool


class MonthlyReportDetail(BaseModel):
    id: int
    student_id: str
    full_name: str
    total_days: int
    present: int
    absent: int
    late: int
    percentage: float
    is_below_threshold: bool


class MonthlyReport(BaseModel):
    month: int
    year: int
    total_students: int
    average_attendance_percentage: float
    below_threshold_count: int
    students: list[MonthlyReportDetail]
