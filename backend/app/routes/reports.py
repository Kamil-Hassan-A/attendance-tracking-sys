from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.services.attendance import AttendanceService

router = APIRouter(prefix="/reports", tags=["Reports"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/monthly")
def monthly_report(db: Session = Depends(get_db)):

    now = datetime.now()

    report = AttendanceService.get_monthly_report(
        db=db,
        month=now.month,
        year=now.year,
        teacher_id=1,
    )

    return report


@router.get("/below-threshold")
def below_threshold(db: Session = Depends(get_db)):

    now = datetime.now()

    students = AttendanceService.get_below_threshold_students(
        db=db,
        teacher_id=1,
        month=now.month,
        year=now.year,
    )

    return students