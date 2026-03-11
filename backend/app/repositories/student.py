from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from ..models.student import Student, AttendanceRecord, AttendanceStatus


class StudentRepository:

    @staticmethod
    def create_student(
        db: Session,
        student_id: str,
        full_name: str,
        email: str,
        course: str,
        year_level: int,
        created_by: int,
    ) -> Student:
        student = Student(
            student_id=student_id,
            full_name=full_name,
            email=email,
            course=course,
            year_level=year_level,
            created_by=created_by,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def get_student_by_id(db: Session, student_id: int) -> Student | None:
        """Get student by internal ID."""
        return db.query(Student).filter(Student.id == student_id).first()

    @staticmethod
    def get_student_by_student_id(db: Session, student_id: str) -> Student | None:
        """Get student by student_id (institutional ID)."""
        return db.query(Student).filter(Student.student_id == student_id).first()

    @staticmethod
    def get_all_students(db: Session, skip: int = 0, limit: int = 100) -> list[Student]:
        """Get all students with pagination."""
        return db.query(Student).offset(skip).limit(limit).all()

    @staticmethod
    def update_student(db: Session, student_id: int, **kwargs) -> Student | None:
        """Update a student record (partial update supported)."""
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return None

        for key, value in kwargs.items():
            if value is not None and hasattr(student, key):
                setattr(student, key, value)

        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def delete_student(db: Session, student_id: int) -> bool:
        """Delete a student (cascades to attendance records)."""
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return False

        db.delete(student)
        db.commit()
        return True

    @staticmethod
    def get_student_by_email(db: Session, email: str) -> Student | None:
        """Get student by email."""
        return db.query(Student).filter(Student.email == email).first()


class AttendanceRepository:
    @staticmethod
    def mark_attendance(
        db: Session,
        student_id: int,
        date: date,
        status: AttendanceStatus,
        marked_by: int,
        remarks: str | None = None,
    ) -> AttendanceRecord:
        """
        Mark attendance (upsert by student_id + date).
        If a record exists for the same student and date, update it.
        Otherwise, create a new record.
        """
        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.date == date,
        ).first()

        if record:
            # Update existing
            record.status = status
            record.remarks = remarks
            record.marked_by = marked_by
        else:
            # Create new
            record = AttendanceRecord(
                student_id=student_id,
                date=date,
                status=status,
                remarks=remarks,
                marked_by=marked_by,
            )
            db.add(record)

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_attendance_by_student(
        db: Session,
        student_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AttendanceRecord]:
        """Get all attendance records for a student, newest first."""
        return (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.student_id == student_id)
            .order_by(AttendanceRecord.date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_attendance_by_date(
        db: Session,
        date: date,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AttendanceRecord]:
        """Get all attendance records for a specific date."""
        return (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.date == date)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_student_attendance_stats(
        db: Session,
        student_id: int,
        month: int | None = None,
        year: int | None = None,
    ) -> tuple[int, int, int, int]:
        """
        Get attendance statistics for a student.
        Returns: (total_days, present_count, absent_count, late_count)

        If month and year are provided, filter by that month.
        """
        query = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id
        )

        if month and year:
            # Filter by month and year
            query = query.filter(
                func.extract("month", AttendanceRecord.date) == month,
                func.extract("year", AttendanceRecord.date) == year,
            )

        records = query.all()

        total_days = len(records)
        present_count = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        absent_count = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        late_count = sum(1 for r in records if r.status == AttendanceStatus.LATE)

        return total_days, present_count, absent_count, late_count

    @staticmethod
    def get_all_students_monthly_stats(
        db: Session,
        month: int,
        year: int,
    ) -> list[tuple[Student, int, int, int, int]]:
        """
        Get attendance stats for all students for a given month/year.
        Returns list of (Student, total_days, present, absent, late).
        """
        students = db.query(Student).all()
        result = []

        for student in students:
            total, present, absent, late = AttendanceRepository.get_student_attendance_stats(
                db, student.id, month, year
            )
            result.append((student, total, present, absent, late))

        return result

    @staticmethod
    def get_students_below_threshold(
        db: Session,
        threshold: float = 75.0,
        month: int | None = None,
        year: int | None = None,
    ) -> list[tuple[Student, float]]:
        """
        Get students whose attendance percentage is below threshold.
        Returns list of (Student, attendance_percentage).
        """
        students = db.query(Student).all()
        below_threshold = []

        for student in students:
            total, present, absent, late = AttendanceRepository.get_student_attendance_stats(
                db, student.id, month, year
            )

            if total > 0:
                percentage = ((present + late) / total) * 100
            else:
                percentage = 0.0

            if percentage < threshold:
                below_threshold.append((student, percentage))

        return below_threshold
