from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.jwt import get_current_user

from app.services.attendance import AttendanceService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/monthly")
def monthly_report(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    return AttendanceService.get_monthly_report(
        db=db,
        month=month,
        year=year,
        teacher_id=current_user,
    )


@router.get("/below-threshold")
def below_threshold(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    return AttendanceService.get_below_threshold_students(
        db=db,
        teacher_id=current_user,
    )