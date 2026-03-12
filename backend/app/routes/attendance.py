from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from ..database import get_db
from ..schemas.student import (
    AttendanceCreate,
    AttendanceResponse,
    AttendanceStats,
    MonthlyReport,
    MonthlyReportDetail,
)
from ..repositories.student import StudentRepository, AttendanceRepository
from ..services.attendance import AttendanceService
from ..utils.jwt import get_current_user

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(
    request: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """
    Mark attendance for a student (upserts by student_id + date).
    If a record already exists for the same student and date, it will be updated.
    Student must belong to the current teacher.
    """
    # Verify student exists and belongs to current teacher
    student = StudentRepository.get_student_by_id(db, request.student_id, current_user)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # Mark/update attendance
    record = AttendanceRepository.mark_attendance(
        db,
        student_id=request.student_id,
        date=request.date,
        status=request.status,
        marked_by=current_user,
        remarks=request.remarks,
    )

    return record


@router.get("/student/{id}", response_model=list[AttendanceResponse])
def get_student_attendance(
    id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """Get all attendance records for a student, newest first (must belong to current teacher)."""
    # Verify student exists and belongs to current teacher
    student = StudentRepository.get_student_by_id(db, id, current_user)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    records = AttendanceRepository.get_attendance_by_student(
        db, student_id=id, skip=skip, limit=limit
    )
    return records


@router.get("/date/{date}", response_model=list[AttendanceResponse])
def get_attendance_by_date(
    date: date,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """Get all attendance records for a specific date (for current teacher's students)."""
    records = AttendanceRepository.get_attendance_by_date(
        db, date=date, teacher_id=current_user, skip=skip, limit=limit
    )
    return records


@router.get("/stats/{id}", response_model=AttendanceStats)
def get_attendance_stats(
    id: int,
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """
    Get attendance statistics for a specific student (must belong to current teacher).
    Optional month/year filters for monthly statistics.
    """
    stats = AttendanceService.get_student_stats(
        db, student_id=id, teacher_id=current_user, month=month, year=year
    )

    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    return stats


@router.get("/report", response_model=MonthlyReport)
def get_monthly_report(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """
    Generate monthly attendance report for students of current teacher.
    Requires month (1-12) and year query parameters.
    """
    # Validate month
    if not (1 <= month <= 12):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12",
        )

    report = AttendanceService.get_monthly_report(db, month=month, year=year, teacher_id=current_user)
    return report


@router.get("/below-threshold", response_model=list[MonthlyReportDetail])
def get_below_threshold_students(
    threshold: float = 75.0,
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """
    Get students of current teacher whose attendance is below the specified threshold.
    Threshold defaults to 75%.
    Optional month/year filters.
    """
    # Validate threshold
    if not (0 <= threshold <= 100):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Threshold must be between 0 and 100",
        )

    students = AttendanceService.get_below_threshold_students(
        db, threshold=threshold, month=month, year=year, teacher_id=current_user
    )
    return students
