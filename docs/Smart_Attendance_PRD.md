# Smart Attendance Tracking System
## Product Requirements Document

**Project:** Smart Attendance Tracking System

**Stack:** React + Vite · FastAPI · PostgreSQL

**Auth:** JWT — Access Token (memory) + Refresh Token (HttpOnly cookie)

**Deadline:** 1 Week

**Team:** 2 Trainees (full-stack, feature split)

**Version:** 1.0 · March 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Authentication Architecture](#3-authentication-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Data Models](#5-data-models)
6. [API Endpoints](#6-api-endpoints)
7. [Frontend Pages](#7-frontend-pages)
8. [Business Logic](#8-business-logic)
9. [Error Handling](#9-error-handling)
10. [Work Split & Timeline](#10-work-split--timeline)
11. [README Documentation Requirements](#11-readme-documentation-requirements)
12. [Acceptance Criteria](#12-acceptance-criteria)

---

## 1. Project Overview

---

### 1.1 Background

Educational institutions face a persistent challenge in tracking student attendance accurately and generating actionable insights. Manual registers are error-prone, time-consuming, and make it nearly impossible to identify at-risk students early. A digital system that automates attendance tracking, calculates statistics in real time, and surfaces students falling below acceptable thresholds can significantly improve institutional outcomes.

### 1.2 Objective

Build a full-stack web application where authenticated users — administrators or faculty — can manage student records, mark daily attendance, view individual statistics, and generate monthly reports. The system must flag students whose attendance falls below a configurable minimum threshold.

### 1.3 Scope

- User authentication with secure JWT (access + refresh token pattern)
- Full CRUD for student records
- Daily attendance marking (Present / Absent / Late)
- Automatic attendance percentage calculation per student
- Below-threshold detection with configurable threshold
- Monthly attendance report generation
- Responsive React frontend consuming FastAPI backend

### 1.4 Out of Scope

- Email / SMS notifications
- Mobile native application
- Role-based access control (single role: authenticated user)
- Integration with external LMS or HR systems

---

## 2. Tech Stack

---

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | UI framework and build tool |
| | React Router v6 | Client-side routing and protected routes |
| | Axios | HTTP client with interceptors for token refresh |
| | TailwindCSS | Utility-first responsive styling |
| Backend | FastAPI | REST API framework with async support |
| | SQLAlchemy 2.0 | ORM for database interaction |
| | Pydantic v2 | Request/response validation and schemas |
| | Alembic | Database migrations |
| Database | PostgreSQL | Relational database for persistent storage |
| Auth | python-jose + passlib | JWT generation and bcrypt password hashing |

---

## 3. Authentication Architecture

---

The application uses a dual-token JWT strategy designed to balance security and user experience. Access tokens are short-lived and stored only in memory. Refresh tokens are long-lived and stored exclusively in an HttpOnly cookie, making them inaccessible to JavaScript and therefore immune to XSS attacks.

### 3.1 Token Specifications

| Token | Lifetime | Storage | Transport |
|---|---|---|---|
| Access Token | 15 minutes | React state / memory only | Authorization header |
| Refresh Token | 7 days | HttpOnly cookie | Cookie (auto-sent) |

### 3.2 Auth Flow

1. Teacher submits login credentials (email + password).
2. FastAPI validates credentials, generates both tokens.
3. Access token returned in JSON response body.
4. Refresh token set as HttpOnly, Secure, SameSite=Lax cookie with `path=/api/auth/refresh`.
5. React stores access token in AuthContext (memory). Never in localStorage or sessionStorage.
6. All subsequent API requests include `Authorization: Bearer <access_token>` header.
7. On app boot, React silently calls `POST /api/auth/refresh` with `credentials: 'include'`.
8. If valid cookie exists, backend returns a new access token — session is restored without re-login.
9. When a protected API call receives 401, Axios interceptor calls `/api/auth/refresh`, updates token in context, then retries the original request.
10. On logout, `POST /api/auth/logout` clears the HttpOnly cookie server-side.

### 3.3 Cookie Configuration

| Attribute | Value & Reason |
|---|---|
| HttpOnly | Prevents JavaScript access — blocks XSS token theft |
| Secure | Transmitted over HTTPS only |
| SameSite=Lax | Prevents CSRF while allowing top-level navigation |
| path=/api/auth/refresh | Cookie is only sent to the refresh endpoint — not every request |
| max_age | 604800 seconds (7 days) |

---

## 4. Folder Structure

---

### 4.1 Backend

```
backend/
├── main.py                          # App entry point, CORS, router registration
├── config.py                        # Pydantic Settings — reads .env variables
├── database.py                      # SQLAlchemy engine, SessionLocal, get_db dependency
├── requirements.txt
├── .env.example
├── alembic/                         # Database migrations
│   ├── versions/                    # Migration script files
│   ├── env.py                       # Alembic runtime configuration
│   └── script.py.mako               # Migration template
├── models/
│   ├── teacher.py                   # Teacher ORM model
│   └── student.py                   # Student + AttendanceRecord ORM models, AttendanceStatus enum
├── schemas/
│   ├── teacher.py                   # TeacherRegister, TeacherLogin, TeacherResponse, TokenResponse
│   └── student.py                   # StudentCreate/Update/Response, AttendanceCreate, AttendanceStats, MonthlyReport
├── repositories/
│   ├── teacher_repository.py        # DB queries for Teacher model only
│   └── student_repository.py        # DB queries for Student and AttendanceRecord models
├── services/
│   ├── auth_service.py              # Teacher registration and login business logic
│   └── attendance_service.py        # Percentage calculation, threshold detection, report generation
├── routes/
│   ├── auth.py                      # Auth endpoints — calls service, no logic
│   ├── students.py                  # Student CRUD endpoints
│   └── attendance.py                # Attendance mark, stats, reports endpoints
└── utils/
    ├── jwt_handler.py               # create_access_token, create_refresh_token, verify_token, get_current_user
    └── password.py                  # hash_password, verify_password
```

| Path | Responsibility |
|---|---|
| main.py | App entry point, CORS, router registration |
| config.py | Pydantic Settings — reads .env variables |
| database.py | SQLAlchemy engine, SessionLocal, get_db dependency |
| models/teacher.py | Teacher ORM model |
| models/student.py | Student + AttendanceRecord ORM models, AttendanceStatus enum |
| schemas/teacher.py | Pydantic schemas: TeacherRegister, TeacherLogin, TeacherResponse, TokenResponse |
| schemas/student.py | Pydantic schemas: StudentCreate/Update/Response, AttendanceCreate, AttendanceStats, MonthlyReport |
| repositories/teacher_repository.py | DB queries for Teacher model only |
| repositories/student_repository.py | DB queries for Student and AttendanceRecord models |
| services/auth_service.py | Teacher registration and login business logic |
| services/attendance_service.py | Percentage calculation, threshold detection, report generation |
| routes/auth.py | Auth endpoints — calls service, no logic |
| routes/students.py | Student CRUD endpoints |
| routes/attendance.py | Attendance mark, stats, reports endpoints |
| utils/jwt_handler.py | create_access_token, create_refresh_token, verify_token, get_current_user |
| utils/password.py | hash_password, verify_password |

### 4.2 Frontend

```
frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx          # Access token in state, silentRefresh on boot, login/logout methods
│   ├── services/
│   │   └── api.js                   # Axios instance, Authorization header injection, 401 interceptor + retry
│   ├── components/
│   │   ├── ProtectedRoute.jsx       # Waits for silent refresh, redirects to /login if unauthenticated
│   │   ├── Navbar.jsx               # Navigation bar with active route highlighting and logout
│   │   └── StudentCard.jsx          # Reusable student info card
│   └── pages/
│       ├── Login.jsx                # Login form
│       ├── Register.jsx             # Registration form
│       ├── Dashboard.jsx            # Summary cards: total students, avg attendance %, below-threshold count
│       ├── Students.jsx             # Student list, add/edit/delete student forms
│       ├── MarkAttendance.jsx       # Date picker, mark present/absent/late per student
│       └── Reports.jsx              # Monthly report table, below-threshold filter view
```

| Path | Responsibility |
|---|---|
| src/context/AuthContext.jsx | Access token in state, silentRefresh on boot, login/logout methods |
| src/services/api.js | Axios instance, Authorization header injection, 401 interceptor + retry |
| src/components/ProtectedRoute.jsx | Waits for silent refresh, redirects to /login if unauthenticated |
| src/components/Navbar.jsx | Navigation bar with active route highlighting and logout |
| src/pages/Login.jsx | Login form |
| src/pages/Register.jsx | Registration form |
| src/pages/Dashboard.jsx | Summary cards: total students, avg attendance %, below-threshold count |
| src/pages/Students.jsx | Student list, add/edit/delete student forms |
| src/pages/MarkAttendance.jsx | Date picker, list all students, mark Present / Absent / Late per student |
| src/pages/Reports.jsx | Month/year selector, monthly report table, below-threshold filter view |

---

## 5. Database Migrations (Alembic)

---

Database schema is version-controlled via Alembic. Migrations allow team members to sync schema changes and deploy to production reliably.

### 5.1 Migration Workflow

**Initial Setup (Day 1):**
1. Run `alembic init alembic` to scaffold Alembic directory.
2. Configure `alembic/env.py` to use the SQLAlchemy engine from `database.py`.
3. Set `sqlalchemy.url` in `alembic.ini` to read from `.env` (DATABASE_URL).

**During Development:**
1. Define/modify ORM models in `models/` files.
2. Run `alembic revision --autogenerate -m "descriptive message"` to create a migration script.
   - Example: `alembic revision --autogenerate -m "create teachers and students tables"`
3. Review the generated migration in `alembic/versions/`.
4. Run `alembic upgrade head` to apply migration to local database.
5. Commit migration file to git so teammates can apply it.

**For Team Synchronization:**
1. When pulling code with new migrations, run `alembic upgrade head` to sync schema.
2. Never manually edit generated migration files unless fixing critical bugs.

### 5.2 Key Migrations

| Migration | Who Creates | When | Command |
|---|---|---|---|
| Create Teachers, Students, AttendanceRecords | Person A | Day 1 (after models) | `alembic revision --autogenerate -m "initial schema"` |
| Add indexes on email, student_id, date | Person A | Day 2 | `alembic revision --autogenerate -m "add indexes"` |
| (Future) Add created_by to Students table | N/A | v1.1 | `alembic revision --autogenerate -m "add student audit fields"` |

---

## 5.3 Data Models
### 5.3.1 Teachers Table

| Column | Type | Constraints | Notes |
|---|---|---|---|
| teacher_id | Integer | PK, auto-increment | |
| full_name | String(150) | NOT NULL | |
| email | String(255) | UNIQUE, NOT NULL | Indexed |
| hashed_password | String(255) | NOT NULL | bcrypt hash |
| created_at | DateTime | server_default | UTC timestamp |

### 5.3.2 Students Table

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | Integer | PK, auto-increment | |
| student_id | String(50) | UNIQUE, NOT NULL | Institutional ID e.g. STU-001. Indexed. |
| full_name | String(150) | NOT NULL | |
| email | String(255) | UNIQUE, NOT NULL | Indexed |
| course | String(150) | NOT NULL | e.g. B.Tech CSE |
| year_level | Integer | NOT NULL, 1–6 | |
| created_by | Integer | FK → teachers.teacher_id | Who added the student |
| created_at | DateTime | server_default | UTC timestamp |

### 5.3.3 Attendance Records Table

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | Integer | PK, auto-increment | |
| student_id | Integer | FK → students.id | Cascade delete. Indexed. |
| date | Date | NOT NULL | YYYY-MM-DD |
| status | Enum | NOT NULL | present \| absent \| late |
| remarks | String(255) | NULLABLE | Optional note |
| marked_by | Integer | FK → teachers.teacher_id | Who marked this entry |
| created_at | DateTime | server_default | |

---

## 6. API Endpoints

---

### 6.1 Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | None | Register new teacher. Returns TeacherResponse. |
| POST | /api/auth/login | None | Login. Returns access token in body, sets refresh cookie. |
| POST | /api/auth/refresh | Cookie | Reads HttpOnly cookie, returns new access token. |
| POST | /api/auth/logout | Cookie | Clears refresh cookie. |
| GET | /api/auth/me | Bearer | Returns currently authenticated teacher. |

### 6.2 Student Routes — `/api/students`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/students | Bearer | Get all students. Supports ?skip=0&limit=100. |
| POST | /api/students | Bearer | Create a new student record. |
| GET | /api/students/{id} | Bearer | Get single student by internal ID. |
| PUT | /api/students/{id} | Bearer | Update student details (partial update supported). |
| DELETE | /api/students/{id} | Bearer | Delete student and all associated attendance records. |

### 6.3 Attendance Routes — `/api/attendance`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/attendance | Bearer | Mark attendance for one student. Upserts by student+date. |
| GET | /api/attendance/student/{id} | Bearer | All attendance records for a student, newest first. |
| GET | /api/attendance/date/{date} | Bearer | All records for a specific date (YYYY-MM-DD). |
| GET | /api/attendance/stats/{id} | Bearer | Attendance stats for one student. Optional ?month=&year= filters. |
| GET | /api/attendance/report | Bearer | Monthly report for all students. ?month=3&year=2026 |
| GET | /api/attendance/below-threshold | Bearer | Students below threshold. ?threshold=75&month=&year= |

---

## 7. Frontend Pages

---

| Page | Route | Features |
|---|---|---|
| Login | /login | Email + password form, stores access token in context on success, redirects to dashboard |
| Register | /register | Teacher name, email, password form, redirects to login on success |
| Dashboard | / | Summary cards: total students, overall avg attendance %, count of below-threshold students, recent activity |
| Students | /students | Searchable student list, add student modal, edit/delete actions per row, click to view individual stats |
| Mark Attendance | /attendance | Date picker (defaults to today), table of all students, present/absent/late toggle per student, bulk submit |
| Reports | /reports | Month/year selector, full monthly report table, sortable columns, below-threshold highlighted in red, threshold configurable via input |

### 7.1 Protected Route Behaviour

- All routes except `/login` and `/register` are wrapped in `ProtectedRoute`.
- On first load, `ProtectedRoute` calls `/api/auth/refresh` silently before rendering.
- While refresh is in-flight, a loading spinner is shown — no premature redirect.
- If refresh fails (no valid cookie), user is redirected to `/login`.
- If refresh succeeds, access token is set in context and the page renders normally.

### 7.2 Axios Interceptor Logic

1. Request interceptor attaches `Authorization: Bearer <accessToken>` to every request.
2. Response interceptor checks for 401 status.
3. On 401: calls `POST /api/auth/refresh` with `credentials: 'include'`.
4. If refresh succeeds: updates token in AuthContext, retries original request once.
5. If refresh fails: clears token from context, redirects to `/login`.

---

## 8. Business Logic

---

### 8.1 Attendance Percentage Calculation

Attendance percentage is computed per student over a given date range (all-time or filtered by month/year):

```
Attendance % = (Present Days + Late Days) / Total Days × 100
```

Late days count toward attendance because the student was present, even if tardy. This mirrors common institutional policy and can be adjusted in the service layer if requirements change.

### 8.2 Below-Threshold Detection

- Default threshold is 75%.
- Threshold is configurable via query parameter on the `/api/attendance/below-threshold` endpoint.
- A student is flagged if their `attendance_percentage < threshold`.
- The frontend highlights flagged students in red on the Reports page.

### 8.3 Attendance Upsert Rule

A student can only have one attendance record per calendar date. If a record already exists for that student+date, the `POST /api/attendance` endpoint updates the existing record rather than creating a duplicate. This prevents double-marking errors.

### 8.4 Monthly Report Structure

- Accepts `month` (1–12) and `year` as query parameters.
- Returns `total_students`, `average_attendance_percentage`, `below_threshold_count`.
- Includes per-student breakdown: `total_days`, `present`, `absent`, `late`, `percentage`, `is_below_threshold`.

---

## 9. Error Handling

---

| HTTP Status | Scenario | Response Detail |
|---|---|---|
| 400 | Validation error | Pydantic validation failure — field-level error messages |
| 401 | Invalid / expired token | "Invalid or expired token" — triggers refresh interceptor on frontend |
| 401 | Wrong credentials | "Invalid email or password" |
| 404 | Student not found | "Student not found" |
| 409 | Duplicate email/ID | "Email already registered" / "Student ID already exists" |
| 422 | Unprocessable entity | FastAPI default for malformed request body |
| 500 | Unexpected server error | Generic error handler — logs traceback, returns safe message |

---

## 10. Work Split & Timeline

---

### 10.1 Feature Split (Both Trainees Full-Stack)

| Area | Person A | Person B |
|---|---|---|
| Database & Migrations | DB setup, config, database.py, Alembic init | Same — shared setup tasks |
| Auth | Register, Login endpoints (for teachers), JWT utils, refresh/logout, AuthContext, Login & Register pages, ProtectedRoute, Axios interceptor | — |
| Students | Student CRUD backend (model, schema, repo, service, route) + Students page frontend | — |
| Dashboard | Dashboard page (consumes stats APIs) | — |
| Attendance | — | Attendance model, schemas, repo, service (upsert logic, percentage calc), attendance routes |
| Mark Page | — | Mark Attendance page frontend |
| Reports | — | Monthly report + below-threshold endpoint + Reports page frontend |
| Migrations & Docs | Generate initial migration, run `alembic upgrade head` | README, API docs, final integration testing |

### 10.2 Day-by-Day Timeline

| Day | Person A | Person B |
|---|---|---|
| 1 | Repo setup, PostgreSQL, config.py, database.py, Alembic init, Teacher + Student models | Same — shared setup tasks |
| 2 | Auth backend: register, login, JWT utils, refresh/logout; generate + run initial migration | Student model → repo, service, CRUD routes; Attendance model + schema |
| 3 | React scaffold, AuthContext, Axios + interceptor, Login + Register pages | Attendance repo, mark endpoint (upsert logic), attendance routes |
| 4 | ProtectedRoute, Navbar, Dashboard page, Students page | Stats endpoint, % calculation, below-threshold endpoint, report endpoint |
| 5 | Polish Dashboard, CRUD actions in Students UI | Mark Attendance page, Reports page frontend |
| 6 | Full integration: connect frontend to all APIs, fix CORS, test auth end-to-end | Same — integration, migration sync test, verify schema |
| 7 | Error handling polish, responsive checks, schema/API docs | README (with migration instructions), final demo prep |

---

## 11. README Documentation Requirements

---

The `README.md` must be present in the project root and cover all of the following sections:

1. **Project Title & Description** — one paragraph explaining what the system does.
2. **Tech Stack** — list all technologies used.
3. **Prerequisites** — Node.js, Python, PostgreSQL versions required.
4. **Environment Setup** — `.env.example` walkthrough for both backend and frontend.
5. **Database Migrations** — How to run Alembic migrations (`alembic upgrade head`), what to do if migrations fail.
6. **How to Run** — step-by-step for backend (uvicorn) and frontend (vite dev) separately.
7. **Folder Structure** — annotated tree of both `backend/` and `frontend/` directories.
8. **API Endpoints** — full table matching Section 6 of this PRD.
9. **Auth Flow** — brief explanation of the dual-token strategy for reviewers.

---

## 12. Acceptance Criteria

---

### 12.1 Authentication

- Teacher can register with full name, email, password.
- Teacher can log in and receive an access token.
- Access token is stored in React state only — not localStorage.
- Refresh token is set as an HttpOnly cookie.
- On app reload, session is silently restored via `/api/auth/refresh` if cookie is valid.
- On 401, Axios interceptor refreshes token and retries request transparently.
- Logout clears the refresh cookie and removes token from context.
- All routes except `/login` and `/register` are protected.

### 12.2 Student Management

- Teacher can create, read, update, and delete student records.
- Duplicate `student_id` or email is rejected with 409.
- Deleting a student cascades to all their attendance records.

### 12.3 Attendance

- Attendance can be marked as present, absent, or late for any student on any date.
- Re-marking the same student+date updates the existing record (no duplicates).
- Attendance percentage is calculated correctly: (present + late) / total × 100.
- Students below the configured threshold are correctly identified.

### 12.4 Reports

- Monthly report returns correct per-student stats filtered by month and year.
- Report includes `total_students`, `average_attendance_percentage`, `below_threshold_count`.
- Below-threshold students are visually highlighted in the frontend.

### 12.5 General

- All API responses use proper HTTP status codes.
- Pydantic validation errors surface field-level messages.
- Business logic is never written inside route files.
- Application is responsive on mobile and desktop screen sizes.
- README is present and complete per Section 11.
