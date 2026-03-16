from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.student import Student
from app.utils.jwt import create_access_token, create_refresh_token

router = APIRouter(prefix="/api/student-auth", tags=["student-auth"])

class StudentLoginRequest(BaseModel):
    email: str
    student_id: str

@router.post("/login")
def student_login(
    request: StudentLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):

    student = (
        db.query(Student)
        .filter(
            Student.email == request.email,
            Student.student_id == request.student_id,
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=401,
            detail="Invalid student credentials",
        )

    access_token = create_access_token(data={"sub": str(student.id), "role": "student"})
    refresh_token = create_refresh_token(data={"sub": str(student.id), "role": "student"})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    return {
        "message": "login success",
        "student_id": student.id,
        "access_token": access_token,
    }