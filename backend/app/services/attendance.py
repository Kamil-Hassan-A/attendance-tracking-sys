from sqlalchemy.orm import Session
from datetime import date, datetime
from ..repositories.student import StudentRepository, AttendanceRepository
from ..models.student import AttendanceStatus
from ..schemas.student import (
    AttendanceStats,
    MonthlyReport,
    MonthlyReportDetail,
)


class AttendanceService:
    @staticmethod
    def calculate_attendance_percentage(
        present_count: int,
        late_count: int,
        total_days: int,
    ) -> float:
        """
        Calculate attendance percentage.
        Formula: (present + late) / total × 100
        """
        if total_days == 0:
            return 0.0
        return ((present_count + late_count) / total_days) * 100

    @staticmethod
    def get_student_stats(
        db: Session,
        student_id: int,
        teacher_id: int,
        month: int | None = None,
        year: int | None = None,
    ) -> AttendanceStats | None:
        """
        Get attendance statistics for a single student (must belong to teacher).
        Returns AttendanceStats or None if student not found or doesn't belong to teacher.
        """
        student = StudentRepository.get_student_by_id(db, student_id, teacher_id)
        if not student:
            return None

        total_days, present, absent, late = (
            AttendanceRepository.get_student_attendance_stats(
                db, student_id, month, year
            )
        )

        percentage = AttendanceService.calculate_attendance_percentage(
            present, late, total_days
        )
        is_below_threshold = percentage < 75.0

        return AttendanceStats(
            student_id=student_id,
            full_name=student.full_name,
            total_days=total_days,
            present=present,
            absent=absent,
            late=late,
            percentage=round(percentage, 2),
            is_below_threshold=is_below_threshold,
        )

    @staticmethod
    def get_monthly_report(
        db: Session,
        month: int,
        year: int,
        teacher_id: int,
    ) -> MonthlyReport:
        """
        Generate monthly attendance report for students of the given teacher.
        """
        students = StudentRepository.get_students(db, teacher_id)

        students_data = []
        total_percentage = 0.0
        below_threshold_count = 0

        for student in students:
            total_days, present, absent, late = (
                AttendanceRepository.get_student_attendance_stats(
                    db, student.id, month, year
                )
            )
            
            percentage = AttendanceService.calculate_attendance_percentage(
                present, late, total_days
            )
            is_below_threshold = percentage < 75.0

            if is_below_threshold:
                below_threshold_count += 1

            total_percentage += percentage

            students_data.append(
                MonthlyReportDetail(
                    id=student.id,
                    student_id=student.student_id,
                    full_name=student.full_name,
                    total_days=total_days,
                    present=present,
                    absent=absent,
                    late=late,
                    percentage=round(percentage, 2),
                    is_below_threshold=is_below_threshold,
                )
            )

        total_students = len(students_data)
        avg_percentage = (
            (total_percentage / total_students) if total_students > 0 else 0.0
        )

        return MonthlyReport(
            month=month,
            year=year,
            total_students=total_students,
            average_attendance_percentage=round(avg_percentage, 2),
            below_threshold_count=below_threshold_count,
            students=students_data,
        )

    @staticmethod
    def get_below_threshold_students(
        db: Session,
        teacher_id: int,
        threshold: float = 75.0,
        month: int | None = None,
        year: int | None = None,
    ) -> list[MonthlyReportDetail]:
        """
        Get students of the given teacher whose attendance is below the threshold.
        """
        students = StudentRepository.get_students(db, teacher_id)

        result = []
        for student in students:
            total_days, present, absent, late = (
                AttendanceRepository.get_student_attendance_stats(
                    db, student.id, month, year
                )
            )
            
            percentage = AttendanceService.calculate_attendance_percentage(
                present, late, total_days
            )
            
            # Only include if below threshold
            if percentage < threshold:
                result.append(
                    MonthlyReportDetail(
                        id=student.id,
                        student_id=student.student_id,
                        full_name=student.full_name,
                        total_days=total_days,
                        present=present,
                        absent=absent,
                        late=late,
                        percentage=round(percentage, 2),
                        is_below_threshold=True,
                    )
                )

        return result
