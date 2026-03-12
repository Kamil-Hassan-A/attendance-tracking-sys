"""
API routes for student CRUD operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.student import StudentCreate, StudentUpdate, StudentResponse
from ..repositories.student import StudentRepository
from ..utils.jwt import get_current_user

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=list[StudentResponse])
def get_all_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """Get all students created by the current teacher with pagination."""
    students = StudentRepository.get_students(db, current_user, skip=skip, limit=limit)
    return students


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    request: StudentCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """Create a new student record."""
    # Check for duplicate student_id
    existing_student_id = StudentRepository.get_student_by_student_id(
        db, request.student_id
    )
    if existing_student_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student ID already exists",
        )

    # Check for duplicate email
    existing_email = StudentRepository.get_student_by_email(db, request.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create student (current_user is the teacher creating the record)
    student = StudentRepository.create_student(
        db,
        student_id=request.student_id,
        full_name=request.full_name,
        email=request.email,
        course=request.course,
        year_level=request.year_level,
        created_by=current_user,
    )
    return student


@router.get("/{id}", response_model=StudentResponse)
def get_student(
    id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """Get a single student by ID (must belong to current teacher)."""
    student = StudentRepository.get_student_by_id(db, id, current_user)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return student


@router.put("/{id}", response_model=StudentResponse)
def update_student(
    id: int,
    request: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """Update a student record (partial update supported, must belong to current teacher)."""
    student = StudentRepository.get_student_by_id(db, id, current_user)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # Check for duplicate email if being updated
    if request.email and student.email != request.email:
        existing_email = StudentRepository.get_student_by_email(db, request.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

    # Prepare update data (only non-None values)
    update_data = request.model_dump(exclude_unset=True)

    updated_student = StudentRepository.update_student(db, id, **update_data)
    return updated_student


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """Delete a student and all associated attendance records (must belong to current teacher)."""
    success = StudentRepository.delete_student(db, id, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return None
