from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.jwt import get_current_user
from app.services.dashboard import get_dashboard_stats, get_today_stats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def stats(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    return get_dashboard_stats(db, current_user)


@router.get("/today")
def today(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    return get_today_stats(db, current_user)