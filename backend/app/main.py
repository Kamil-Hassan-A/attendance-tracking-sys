from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import auth, students, attendance, docs, student_auth

app = FastAPI(
    title="Attendance Tracking System",
    description="API for managing student attendance",
    version="1.0.0",
    docs_url="/docs/swagger",
    redoc_url="/docs/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(docs.docs_router)
app.include_router(student_auth.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
