"""
API routes for authentication endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.auth import (
    Teacher,
    TeacherIn,
    TokenResponse,
    TeacherOut,
)
from ..services.auth import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TeacherOut, status_code=status.HTTP_201_CREATED)
def register(
    request: Teacher,
    db: Session = Depends(get_db),
):
    """Register a new teacher account."""
    try:
        return AuthService.register_teacher(db, request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.post("/login", response_model=TokenResponse)
def login(
    request: TeacherIn,
    response: Response,
    db: Session = Depends(get_db),
):
    """Login teacher and return access + refresh tokens."""
    try:
        token_response = AuthService.login_teacher(db, request)
        # Set refresh_token as httponly cookie
        response.set_cookie(
            key="refresh_token",
            value=token_response.refresh_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=7 * 24 * 60 * 60,  # 7 days
        )
        return token_response
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_token: str | None = Cookie(None),
):
    """Refresh access token using refresh token."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )
    try:
        return AuthService.refresh_access_token(refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )


@router.post("/logout")
def logout(response: Response):
    """Logout teacher by clearing refresh token cookie."""
    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out successfully"}
