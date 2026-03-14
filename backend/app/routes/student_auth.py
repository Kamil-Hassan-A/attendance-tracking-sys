from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.student import Student
from app.utils.jwt import create_access_token

router = APIRouter(prefix="/api/student-auth", tags=["student-auth"])


@router.post("/login")
def student_login(
    email: str,
    student_id: str,
    db: Session = Depends(get_db),
):

    student = (
        db.query(Student)
        .filter(
            Student.email == email,
            Student.student_id == student_id,
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=401,
            detail="Invalid student credentials",
        )

    token = create_access_token(data={"sub": str(student.id), "role": "student"})

    return {
        "message": "login success",
        "student_id": student.id,
        "access_token": token,
    }