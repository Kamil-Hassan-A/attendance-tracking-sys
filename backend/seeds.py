import sys
from datetime import date, timedelta
from app.database import SessionLocal, engine
from app.models.teacher import Teacher
from app.models.student import Student, AttendanceRecord, AttendanceStatus
from app.utils.password import hash_password

# Sample teachers
SAMPLE_TEACHERS = [
    {
        "full_name": "John Doe",
        "email": "john@test.com",
        "password": "password123",
    },
    {
        "full_name": "Sarah Johnson",
        "email": "sarah@test.com",
        "password": "password123",
    },
    {
        "full_name": "Michael Brown",
        "email": "michael@test.com",
        "password": "password123",
    },
]

# Sample students grouped by teacher
SAMPLE_STUDENTS_BY_TEACHER = {
    "john@test.com": [
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
            "course": "B.Tech CSE",
            "year_level": 2,
        },
        {
            "student_id": "STU-004",
            "full_name": "David Brown",
            "email": "david@example.com",
            "course": "B.Tech CSE",
            "year_level": 2,
        },
    ],
    "sarah@test.com": [
        {
            "student_id": "STU-005",
            "full_name": "Eva Davis",
            "email": "eva@example.com",
            "course": "B.Tech ECE",
            "year_level": 2,
        },
        {
            "student_id": "STU-006",
            "full_name": "Frank Miller",
            "email": "frank@example.com",
            "course": "B.Tech ECE",
            "year_level": 2,
        },
        {
            "student_id": "STU-007",
            "full_name": "Grace Lee",
            "email": "grace@example.com",
            "course": "B.Tech ECE",
            "year_level": 3,
        },
    ],
    "michael@test.com": [
        {
            "student_id": "STU-008",
            "full_name": "Henry Wilson",
            "email": "henry@example.com",
            "course": "B.Tech ME",
            "year_level": 3,
        },
        {
            "student_id": "STU-009",
            "full_name": "Iris Martin",
            "email": "iris@example.com",
            "course": "B.Tech ME",
            "year_level": 3,
        },
        {
            "student_id": "STU-010",
            "full_name": "Jack Taylor",
            "email": "jack@example.com",
            "course": "B.Tech CE",
            "year_level": 4,
        },
    ],
}


def seed_database():
    """Populate the database with sample data."""
    db = SessionLocal()
    try:
        print("Seeding database...")

        # Clear existing data (optional - uncomment to reseed)
        db.query(AttendanceRecord).delete()
        db.query(Student).delete()
        db.query(Teacher).delete()
        db.commit()
        print("✓ Cleared existing data")

        # Create teachers
        teachers_map = {}  # email -> Teacher object
        for teacher_data in SAMPLE_TEACHERS:
            teacher = Teacher(
                full_name=teacher_data["full_name"],
                email=teacher_data["email"],
                hashed_password=hash_password(teacher_data["password"]),
            )
            db.add(teacher)
            db.flush()  # Flush to get teacher.teacher_id
            teachers_map[teacher_data["email"]] = teacher
            print(f"✓ Created teacher: {teacher_data['email']}")

        db.commit()

        # Create students and attendance records
        total_students = 0
        total_attendance = 0

        for teacher_email, students_list in SAMPLE_STUDENTS_BY_TEACHER.items():
            teacher = teachers_map[teacher_email]

            for student_data in students_list:
                student = Student(
                    **student_data,
                    created_by=teacher.teacher_id,
                )
                db.add(student)
                total_students += 1

            db.flush()

            # Get all students created by this teacher
            teacher_students = db.query(Student).filter(
                Student.created_by == teacher.teacher_id
            ).all()

            # Create attendance records for the past 60 days
            today = date.today()

            for student in teacher_students:
                for day_offset in range(60):
                    record_date = today - timedelta(days=day_offset)

                    # Skip weekends (Saturday=5, Sunday=6)
                    if record_date.weekday() >= 5:
                        continue

                    # Vary attendance patterns per student
                    student_id_num = int(student.student_id.split("-")[1])

                    if student_id_num % 5 == 0:
                        # Good attendance (85%)
                        status = (
                            AttendanceStatus.PRESENT
                            if day_offset % 7 != 0
                            else AttendanceStatus.ABSENT
                        )
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
                            AttendanceStatus.PRESENT
                            if day_offset % 2 == 0
                            else AttendanceStatus.LATE
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
                        marked_by=teacher.teacher_id,
                    )
                    db.add(record)
                    total_attendance += 1

        db.commit()
        print(f"✓ Created {total_students} students")
        print(f"✓ Created {total_attendance} attendance records")
        print("\n✓ Database seeding completed successfully!")
        print(f"\nTest teacher credentials:")
        for teacher_data in SAMPLE_TEACHERS:
            print(f"  Email: {teacher_data['email']}")
            print(f"  Password: {teacher_data['password']}")
            print()

    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding database: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
