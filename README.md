# Smart Attendance Tracking System

A full-stack attendance management platform for educational institutions. Teachers can manage students, mark daily attendance, and generate monthly reports. Students can sign in and view their own attendance records.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, React Router, Axios, TailwindCSS, shadcn/ui
- Backend: FastAPI, SQLAlchemy, Pydantic Settings, python-jose, passlib/bcrypt
- Database: PostgreSQL
- Auth: JWT access tokens + refresh token in HttpOnly cookie

## Monorepo Structure

- `frontend/`: React app
- `backend/`: FastAPI app
- `docs/`: Product documentation (`Smart_Attendance_PRD.md`)
- `package.json` (root): helper scripts to install/run frontend and backend together

## Features

- Teacher authentication (register/login/logout/refresh)
- Student CRUD management
- Attendance marking with statuses: `present`, `absent`, `late`
- Attendance statistics by student and date range inputs
- Monthly reports and below-threshold filtering
- Student login and self-view attendance endpoint

## Prerequisites

- Node.js 18+
- Python 3.13+
- PostgreSQL 12+
- `uv` Python package manager

## Quick Start

### 1) Install dependencies (all apps)

From repository root:

```bash
npm run setup
```

This runs:

- frontend install: `cd frontend && npm install`
- backend install: `pip install uv && cd backend && uv sync`

### 2) Configure environment variables

Create files from examples:

- `backend/.env` from `backend/.env.example`
- `frontend/.env` from `frontend/.env.example`

Backend expected values:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/attendance_db
SECRET_KEY=change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]
ENV=development
DEBUG=True
```

Frontend expected values:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3) Create database

```bash
psql -U postgres -c "CREATE DATABASE attendance_db;"
```

### 4) Run apps

From repository root:

```bash
npm run start
```

This starts both:

- frontend on `http://localhost:5173`
- backend on `http://localhost:8000`

Or run separately:

```bash
# terminal 1
cd backend
uv run uvicorn app.main:app --reload

# terminal 2
cd frontend
npm run dev
```

## Seed Data

From `backend/`:

```bash
uv run python seed1.py
# or
uv run python seeds.py
```

`seed1.py` creates one teacher and a larger student list.
`seeds.py` creates multiple teachers and a distributed student set.

## API Base URL

- Base: `http://localhost:8000/api`

## Main API Endpoints

### Auth (`/api/auth`)

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`

### Student Auth (`/api/student-auth`)

- `POST /login`

### Students (`/api/students`)

- `GET /api/students`
- `POST /api/students`
- `GET /api/students/{id}`
- `PUT /api/students/{id}`
- `DELETE /api/students/{id}`

### Attendance (`/api/attendance`)

- `POST /api/attendance`
- `GET /api/attendance/student/{id}`
- `GET /api/attendance/date/{date}`
- `GET /api/attendance/stats/{id}`
- `GET /api/attendance/report`
- `GET /api/attendance/below-threshold`
- `GET /api/attendance/me`

## Frontend Routes

Public:

- `/login`
- `/register`
- `/student-login`
- `/student-dashboard`

Teacher-protected:

- `/` (root)
- `/students`
- `/students/:id`
- `/attendance`
- `/reports`

## Root Scripts

From root `package.json`:

- `npm run setup`
- `npm run setup-frontend`
- `npm run setup-backend`
- `npm run start`
- `npm run start-frontend`
- `npm run start-backend`
