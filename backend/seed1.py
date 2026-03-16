import sys
from datetime import date, timedelta
from app.database import SessionLocal, engine
from app.models.teacher import Teacher
from app.models.student import Student, AttendanceRecord, AttendanceStatus
from app.utils.password import hash_password

TEACHER = {
    "full_name": "Kamil Hassan",
    "email": "kamilhassan@gmail.com",
    "password": "password123",
}

STUDENTS = [
    {"student_id": "STU-001", "full_name": "Aisha Patel", "email": "aisha.patel@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-002", "full_name": "Benjamin Lee", "email": "benjamin.lee@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-003", "full_name": "Camila Rodriguez", "email": "camila.rodriguez@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-004", "full_name": "David Chen", "email": "david.chen@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-005", "full_name": "Emma Johnson", "email": "emma.johnson@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-006", "full_name": "Faisal Ahmed", "email": "faisal.ahmed@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-007", "full_name": "Grace Williams", "email": "grace.williams@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-008", "full_name": "Harsha Kumar", "email": "harsha.kumar@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-009", "full_name": "Isabella Martinez", "email": "isabella.martinez@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-010", "full_name": "James Wilson", "email": "james.wilson@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-011", "full_name": "Keisha Brown", "email": "keisha.brown@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-012", "full_name": "Liam O'Connor", "email": "liam.oconnor@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-013", "full_name": "Maya Sharma", "email": "maya.sharma@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-014", "full_name": "Nora Anderson", "email": "nora.anderson@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-015", "full_name": "Oliver Taylor", "email": "oliver.taylor@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-016", "full_name": "Priya Singh", "email": "priya.singh@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-017", "full_name": "Quinn Davis", "email": "quinn.davis@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-018", "full_name": "Raj Verma", "email": "raj.verma@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-019", "full_name": "Sophia White", "email": "sophia.white@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-020", "full_name": "Thomas Garcia", "email": "thomas.garcia@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-021", "full_name": "Uma Desai", "email": "uma.desai@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-022", "full_name": "Victor Lopez", "email": "victor.lopez@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-023", "full_name": "Weitao Wang", "email": "weitao.wang@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-024", "full_name": "Zainab Hassan", "email": "zainab.hassan@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-025", "full_name": "Alexander Smith", "email": "alexander.smith@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-026", "full_name": "Brittany Jones", "email": "brittany.jones@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-027", "full_name": "Chiara Rossi", "email": "chiara.rossi@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-028", "full_name": "Diego Morales", "email": "diego.morales@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-029", "full_name": "Elena Popov", "email": "elena.popov@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-030", "full_name": "Francesca Romano", "email": "francesca.romano@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-031", "full_name": "Gustavo Silva", "email": "gustavo.silva@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-032", "full_name": "Helena Kovacs", "email": "helena.kovacs@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-033", "full_name": "Ismail Aziz", "email": "ismail.aziz@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-034", "full_name": "Jasmine Wong", "email": "jasmine.wong@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-035", "full_name": "Karim Mahmoud", "email": "karim.mahmoud@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-036", "full_name": "Lucia Fernandez", "email": "lucia.fernandez@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-037", "full_name": "Marcos Alves", "email": "marcos.alves@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-038", "full_name": "Natalia Volkova", "email": "natalia.volkova@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-039", "full_name": "Oscar Hernandez", "email": "oscar.hernandez@example.com", "course": "B.Tech CSE", "year_level": 4},
    {"student_id": "STU-040", "full_name": "Paloma Cruz", "email": "paloma.cruz@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-041", "full_name": "Quincy Thompson", "email": "quincy.thompson@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-042", "full_name": "Ravi Bansal", "email": "ravi.bansal@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-043", "full_name": "Saira Malik", "email": "saira.malik@example.com", "course": "B.Tech CSE", "year_level": 1},
    {"student_id": "STU-044", "full_name": "Tobias Mueller", "email": "tobias.mueller@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-045", "full_name": "Ume Nakamura", "email": "ume.nakamura@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-046", "full_name": "Valerie Meyer", "email": "valerie.meyer@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-047", "full_name": "Wagner Costa", "email": "wagner.costa@example.com", "course": "B.Tech CSE", "year_level": 2},
    {"student_id": "STU-048", "full_name": "Xiomara Lopez", "email": "xiomara.lopez@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-049", "full_name": "Yasmin Noor", "email": "yasmin.noor@example.com", "course": "B.Tech CSE", "year_level": 3},
    {"student_id": "STU-050", "full_name": "Zara Mirza", "email": "zara.mirza@example.com", "course": "B.Tech CSE", "year_level": 3},
]


def seed_database():
    """Populate the database with 1 teacher and 50 students."""
    db = SessionLocal()
    try:
        print("Seeding database with 1 teacher and 50 students...\n")

        # Clear existing data
        db.query(AttendanceRecord).delete()
        db.query(Student).delete()
        db.query(Teacher).delete()
        db.commit()
        print("✓ Cleared existing data")

        # Create teacher
        teacher = Teacher(
            full_name=TEACHER["full_name"],
            email=TEACHER["email"],
            hashed_password=hash_password(TEACHER["password"]),
        )
        db.add(teacher)
        db.flush()  # Flush to get teacher.teacher_id
        print(f"✓ Created teacher: {TEACHER['email']}")

        db.commit()

        # Create students and attendance records
        total_students = 0
        total_attendance = 0

        for student_data in STUDENTS:
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

                # Vary attendance patterns per student based on student_id
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
        print(f"  Email: {TEACHER['email']}")
        print(f"  Password: {TEACHER['password']}")

    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding database: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
