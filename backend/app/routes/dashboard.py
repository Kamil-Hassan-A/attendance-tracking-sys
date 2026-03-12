from fastapi import APIRouter, Depends
from app.services.dashboard import get_dashboard_stats
from app.services.dashboard import get_today_stats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def stats():
    return get_dashboard_stats()

@router.get("/today")
def today():
    return get_today_stats()