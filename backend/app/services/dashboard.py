from datetime import datetime, date

from app.database import SessionLocal
from app.models.student import Student, AttendanceStatus
from app.services.attendance import AttendanceService
from app.repositories.student import AttendanceRepository


def get_dashboard_stats():

    db = SessionLocal()

    teacher_id = 1  # temporary (later from JWT auth)

    now = datetime.now()
    month = now.month
    year = now.year

    # total students
    total_students = db.query(Student).count()

    # monthly report
    monthly_report = AttendanceService.get_monthly_report(
        db=db,
        month=month,
        year=year,
        teacher_id=teacher_id,
    )

    # below attendance threshold students
    below_threshold = AttendanceService.get_below_threshold_students(
        db=db,
        teacher_id=teacher_id,
        month=month,
        year=year,
    )

    db.close()

    return {
        "total_students": total_students,
        "monthly_total_students": monthly_report.total_students,
        "average_attendance": monthly_report.average_attendance_percentage,
        "below_threshold_count": len(below_threshold),
    }


def get_today_stats():

    db = SessionLocal()

    teacher_id = 1  # temporary until auth implemented

    today = date.today()

    records = AttendanceRepository.get_attendance_by_date(
        db,
        today,
        teacher_id,
    )

    present = 0
    absent = 0
    late = 0

    for r in records:
        if r.status == AttendanceStatus.PRESENT:
            present += 1
        elif r.status == AttendanceStatus.ABSENT:
            absent += 1
        elif r.status == AttendanceStatus.LATE:
            late += 1

    total = len(records)

    db.close()

    return {
        "date": str(today),
        "present": present,
        "absent": absent,
        "late": late,
        "total": total,
    }