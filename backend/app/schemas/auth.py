from pydantic import BaseModel, EmailStr


class Teacher(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class TeacherIn(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TeacherOut(BaseModel):
    """Schema for teacher response."""
    model_config = {"from_attributes": True}
    
    teacher_id: int
    full_name: str
    email: str
