from sqlalchemy.orm import Session
from ..models.teacher import Teacher


class TeacherRepository:
    @staticmethod
    def create_teacher(
        db: Session,
        full_name: str,
        email: str,
        hashed_password: str,
    ) -> Teacher:
        teacher = Teacher(
            full_name=full_name,
            email=email,
            hashed_password=hashed_password,
        )
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
        return teacher

    @staticmethod
    def get_teacher_by_email(db: Session, email: str) -> Teacher | None:
        return db.query(Teacher).filter(Teacher.email == email).first()

    @staticmethod
    def get_teacher_by_id(db: Session, teacher_id: int) -> Teacher | None:
        return db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
