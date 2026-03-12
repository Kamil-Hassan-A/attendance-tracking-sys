import sys
from datetime import date, timedelta
from app.database import SessionLocal, engine
from app.models.teacher import Teacher
from app.models.student import Student, AttendanceRecord, AttendanceStatus
from app.utils.password import hash_password

# Sample data
SAMPLE_TEACHER = {
    "full_name": "John Doe",
    "email": "teacher@test.com",
    "password": "password123",
}

SAMPLE_STUDENTS = [
    {
        "student_id": "STU-001",
        "full_name": "Alice Johnson",
        "email": "alice@example.com",
        "course": "B.Tech CSE",
        "year_level": 1,
    },
    {
        "student_id": "STU-002",
        "full_name": "Bob Smith",
        "email": "bob@example.com",
        "course": "B.Tech CSE",
        "year_level": 1,
    },
    {
        "student_id": "STU-003",
        "full_name": "Carol White",
        "email": "carol@example.com",
        "course": "B.Tech ECE",
        "year_level": 2,
    },
    {
        "student_id": "STU-004",
        "full_name": "David Brown",
        "email": "david@example.com",
        "course": "B.Tech ECE",
        "year_level": 2,
    },
    {
        "student_id": "STU-005",
        "full_name": "Eva Davis",
        "email": "eva@example.com",
        "course": "B.Tech ME",
        "year_level": 3,
    },
    {
        "student_id": "STU-006",
        "full_name": "Frank Miller",
        "email": "frank@example.com",
        "course": "B.Tech ME",
        "year_level": 3,
    },
    {
        "student_id": "STU-007",
        "full_name": "Grace Lee",
        "email": "grace@example.com",
        "course": "B.Tech CE",
        "year_level": 4,
    },
    {
        "student_id": "STU-008",
        "full_name": "Henry Wilson",
        "email": "henry@example.com",
        "course": "B.Tech CE",
        "year_level": 4,
    },
    {
        "student_id": "STU-009",
        "full_name": "Iris Martin",
        "email": "iris@example.com",
        "course": "B.Tech CSE",
        "year_level": 1,
    },
    {
        "student_id": "STU-010",
        "full_name": "Jack Taylor",
        "email": "jack@example.com",
        "course": "B.Tech ECE",
        "year_level": 2,
    },
]


def seed_database():
    """Populate the database with sample data."""
    db = SessionLocal()
    try:
        # Check if data already exists
        existing_teacher = db.query(Teacher).filter(
            Teacher.email == SAMPLE_TEACHER["email"]
        ).first()
        if existing_teacher:
            print("✓ Database already seeded. Skipping...")
            return

        print("Seeding database...")

        # Create teacher
        teacher = Teacher(
            full_name=SAMPLE_TEACHER["full_name"],
            email=SAMPLE_TEACHER["email"],
            hashed_password=hash_password(SAMPLE_TEACHER["password"]),
        )
        db.add(teacher)
        db.flush()  # Flush to get teacher.teacher_id
        teacher_id = teacher.teacher_id
        print(f"✓ Created teacher: {SAMPLE_TEACHER['email']}")

        # Create students
        students = []
        for student_data in SAMPLE_STUDENTS:
            student = Student(
                **student_data,
                created_by=teacher_id,
            )
            db.add(student)
            students.append(student)
        db.flush()
        print(f"✓ Created {len(students)} students")

        # Create attendance records for the past 60 days
        today = date.today()
        attendance_count = 0

        for student in students:
            for day_offset in range(60):
                record_date = today - timedelta(days=day_offset)

                # Skip weekends (Saturday=5, Sunday=6)
                if record_date.weekday() >= 5:
                    continue

                # Vary attendance patterns per student
                # Some students have consistent attendance, others are irregular
                student_id_num = int(student.student_id.split("-")[1])

                if student_id_num % 5 == 0:
                    # Good attendance (85%)
                    status = AttendanceStatus.PRESENT if day_offset % 7 != 0 else AttendanceStatus.ABSENT
                elif student_id_num % 5 == 1:
                    # Moderate attendance (70%)
                    status = (
                        AttendanceStatus.PRESENT
                        if day_offset % 3 != 0
                        else AttendanceStatus.ABSENT
                    )
                elif student_id_num % 5 == 2:
                    # Low attendance (60%)
                    status = (
                        AttendanceStatus.PRESENT
                        if day_offset % 2 == 0
                        else AttendanceStatus.ABSENT
                    )
                elif student_id_num % 5 == 3:
                    # Very low attendance (50%)
                    status = (
                        AttendanceStatus.PRESENT if day_offset % 2 == 0 else AttendanceStatus.LATE
                    )
                else:
                    # Mixed (occasional late)
                    if day_offset % 10 == 0:
                        status = AttendanceStatus.LATE
                    elif day_offset % 5 == 0:
                        status = AttendanceStatus.ABSENT
                    else:
                        status = AttendanceStatus.PRESENT

                record = AttendanceRecord(
                    student_id=student.id,
                    date=record_date,
                    status=status,
                    marked_by=teacher_id,
                )
                db.add(record)
                attendance_count += 1

        db.commit()
        print(f"✓ Created {attendance_count} attendance records")
        print("\n✓ Database seeding completed successfully!")
        print(f"\nTest credentials:")
        print(f"  Email: {SAMPLE_TEACHER['email']}")
        print(f"  Password: {SAMPLE_TEACHER['password']}")

    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding database: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
