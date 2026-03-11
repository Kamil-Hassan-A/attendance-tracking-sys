"""
Service layer for authentication business logic.
"""

from sqlalchemy.orm import Session
from ..repositories.auth import TeacherRepository
from ..utils.password import hash_password, verify_password
from ..utils.jwt import create_access_token, create_refresh_token, verify_token
from ..schemas.auth import (
    Teacher,
    TeacherIn,
    TokenResponse,
    TeacherOut,
)


class AuthService:

    @staticmethod
    def register_teacher(
        db: Session,
        request: Teacher,
    ) -> TeacherOut:
        """Register a new teacher."""
        # Check if email already exists
        existing = TeacherRepository.get_teacher_by_email(db, request.email)
        if existing:
            raise ValueError("Email already registered")

        # Hash password and create teacher
        hashed_pwd = hash_password(request.password)
        teacher = TeacherRepository.create_teacher(
            db,
            full_name=request.full_name,
            email=request.email,
            hashed_password=hashed_pwd,
        )

        return TeacherOut.model_validate(teacher)

    @staticmethod
    def login_teacher(
        db: Session,
        request: TeacherIn,
    ) -> TokenResponse:
        """Login a teacher and return tokens."""
        teacher = TeacherRepository.get_teacher_by_email(db, request.email)
        if not teacher or not verify_password(
            request.password, teacher.hashed_password
        ):
            raise ValueError("Invalid email or password")

        # Create tokens
        access_token = create_access_token({"sub": str(teacher.teacher_id)})
        refresh_token = create_refresh_token({"sub": str(teacher.teacher_id)})

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    @staticmethod
    def refresh_access_token(refresh_token: str) -> TokenResponse:
        """
        Generate new access token from a valid refresh token.

        Raises:
            ValueError: If refresh token is invalid or expired.
        """
        payload = verify_token(refresh_token)
        if not payload or "sub" not in payload:
            raise ValueError("Invalid or expired refresh token")

        teacher_id = payload["sub"]
        new_access_token = create_access_token({"sub": teacher_id})

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=refresh_token,
        )

    @staticmethod
    def verify_access_token(token: str) -> int | None:
        """
        Verify access token and return teacher_id.

        Args:
            token: The access token to verify.

        Returns:
            Teacher ID if valid, None otherwise.
        """
        payload = verify_token(token)
        if not payload or "sub" not in payload:
            return None

        try:
            return int(payload["sub"])
        except (ValueError, TypeError):
            return None
