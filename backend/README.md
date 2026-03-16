# Attendance Tracking System - Backend

FastAPI-based REST API for attendance management with JWT authentication.

## Prerequisites

- Python 3.13+
- PostgreSQL 12+
- `uv` package manager ([install uv](https://docs.astral.sh/uv/getting-started/installation/))

## Setup Instructions

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd attendance-tracking-sys/backend
```

### 2. Create Virtual Environment & Install Dependencies

```bash
uv sync
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/attendance_db
SECRET_KEY=your-random-secret-key-here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ENV=development
DEBUG=True
```

### 4. Create PostgreSQL Database

via psql:
```sql
CREATE DATABASE attendance_db;
```

### 6. Start the Development Server

```bash
uv run uvicorn app.main:app --reload
```

Server runs at: `http://localhost:8000`

API docs at: `http://localhost:8000/docs` (interactive Swagger UI)

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new teacher
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Clear refresh token
