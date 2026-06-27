# NxtWave Student Management & Learning Management System (LMS)

A modern, responsive, production-ready full-stack application built for NxtWave. This portal provides an integrated solution for Student Management, Learning Management, Fee Ledgering, Online Live Lectures, MCQs, and Admin Analytics.

---

## 🛠️ Technology Stack

- **Frontend:** React.js, Vite, TypeScript, Tailwind CSS, React Router DOM, Framer Motion, Recharts, Axios, Socket.IO Client.
- **Backend:** Node.js, Express.js, TypeScript, Socket.IO, JWT Auth, Bcrypt, Multer, Prisma ORM.
- **Database:** PostgreSQL.
- **Deployment & Containers:** Docker, Docker Compose.

---

## 📂 Project Architecture

```text
nxtwave-lms/
├── backend/                  # Node.js TypeScript API Service
│   ├── prisma/               # Prisma Config, Schema and Database Seeds
│   ├── src/
│   │   ├── controllers/      # Handlers: auth, students, fees, classes, quizzes, chats
│   │   ├── middleware/       # JWT guards, logger, global error handler
│   │   ├── routes/           # REST Router mapping
│   │   ├── services/         # Prisma connection, S3, payment and notification mocks
│   │   ├── sockets/          # Socket.io handlers (chat typing, read receipts)
│   │   └── types/            # AuthRequest definitions
├── frontend/                 # React Vite TypeScript Client
│   ├── src/
│   │   ├── components/       # Shared UI (Sidebar, Navbar, Skeletons, Toasts)
│   │   ├── context/          # Theme (Google Dark/Light), Auth, Socket
│   │   ├── layouts/          # Dashboard templates
│   │   ├── pages/            # View components (Login, Student, Mentor, Admin dashboards, Chat, Quiz)
│   │   └── services/         # Axios config with JWT auto-refresh interceptor
├── docker-compose.yml        # Multi-container orchestration config
├── start.bat                 # One-click startup script for Windows
└── README.md                 # System documentation
```

---

## 🔑 Default Login Credentials (Pre-Hashed in Seed)

| Role | Username / Identity | Password | Description |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@nxtwave.in` | `superadmin123` | Master control privileges. |
| **Admin** | `admin@nxtwave.in` | `admin123` | Student / Mentor CRUD & payment approvals. |
| **Mentor** | `mentor@nxtwave.in` | `mentor123` | Class scheduler, attendance marker, grading. |
| **Student** | `student@nxtwave.in` | `student123` | Video player, EMI payouts, real-time quizzes. |

*Note: You can log in using either the email addresses listed above or the respective generated Student/Employee IDs (`NW-STUD-1001` or `NW-EMP-5001`).*

---

## 🚀 How to Run the Application

We have provided a one-click startup batch script for Windows. Double-click **`start.bat`** in the root directory to open the interactive menu:

### Option 1: Run with Docker Compose (Recommended)
This runs the entire system (PostgreSQL Database, Node.js Backend, and React Client) in isolated containers automatically.
- Requires: **Docker Desktop** installed and running on your machine.
- CMD: `docker-compose up --build`

### Option 2: Run Locally (NPM)
Runs the services directly on your local Node environment.
1. Requires **Node.js v18+** and a running **PostgreSQL** instance.
2. Update the connection string under `DATABASE_URL` in `backend/.env`.
3. Select `[2]` in `start.bat`. This will run `npm install`, trigger Prisma migrations, seed demo records, and start the development servers.

---

## 📋 Core Module Specifications

### 1. Fee & EMI Ledgering
- When an Admin creates a new student, the system calculates the remaining balance:
  $$\text{Remaining Balance} = \text{Total Fee} - \text{Scholarship} - \text{Discount}$$
- It automatically generates 5 monthly EMI installments (due on the 5th of each month).
- Payouts simulate a Razorpay order. On success:
  - Deducts the paid amount from the student's `remainingBalance`.
  - Sets the EMI status to `PAID`, records a timestamp, and generates a downloadable PDF receipt.
  - Updates audit logs and shoots a mock SMS reminder to the student's contact.

### 2. Live Class Timetable
- Mentors schedule classes for specific batches.
- The student dashboard tracks live items and renders an active "Join Class" button which links directly to the Zoom / Meet workshop URL.

### 3. Quiz Module (MCQ)
- Online examination supports MCQs.
- Includes a live counting timer. If the timer expires before completion, answers are auto-submitted.
- **Negative Marking:** Every wrong answer choice deducts the quiz's `negativeMark` penalty from the score.
- Results update a live Quiz Leaderboard, ordering students by score (and tie-breaking by completion time).

### 4. Real-time doubt chat (Socket.IO)
- Socket.IO establishes a persistent bridge.
- Emits typing status triggers ("Rahul sir is typing...").
- Toggles ticks for read receipts on the database layer when the recipient opens the room (`messages_read`).
- Text messages and attachments (mock file URLs) are written permanently to the database so that chat history is never lost.

---

## 🌐 REST API Endpoint Specifications

### Authentication (`/api/auth`)
- `POST /auth/register` - Create user and profile.
- `POST /auth/login` - Verify identity (Email/ID) and issue JWT + Refresh Token.
- `POST /auth/refresh` - Refresh access token using cookie credential.
- `POST /auth/logout` - Clear session.
- `PUT /auth/profile` - Update customizable details.
- `PUT /auth/change-password` - Reset account password.

### Student Management (`/api/students`)
- `GET /students/dashboard` - Detailed metrics compilation for Student view.
- `POST /students` - Admit new student and auto-generate EMI logs.
- `GET /students` - List students.
- `POST /students/assign` - Reassign batch / mentor.
- `DELETE /students/:id` - Permanently delete student record.

### Mentor Management (`/api/mentors`)
- `GET /mentors/dashboard` - Metrics aggregates for Mentor view.
- `POST /mentors` - Register new mentor employee.
- `GET /mentors` - List mentors.

### Attendance Module (`/api/attendance`)
- `POST /attendance/mark` - Mark attendance logs.
- `GET /attendance/student` - Summarize attendance records for Student charts.
- `GET /attendance/batch` - Query batch sheet for a specific date.

### Timetable & Materials (`/api/classes`)
- `POST /classes/schedule` - Schedule a live class.
- `GET /classes/timetable/:batchId` - Timetable list.
- `POST /classes/record` - Upload recorded video.
- `GET /classes/resources/:courseId` - Retrieve recorded video lectures list.

### Assignments (`/api/assignments`)
- `POST /assignments/create` - Create assignment (with spec upload).
- `POST /assignments/submit` - Upload submission ZIP/PDF.
- `POST /assignments/grade` - Grade submission and add feedback.

### Quizzes (`/api/quizzes`)
- `POST /quizzes/create` - Create quiz MCQ.
- `POST /quizzes/submit` - Submit answers and auto-grade.
- `GET /quizzes/leaderboard/:quizId` - Quiz leaderboard scores.

### Realtime Chats (`/api/chats`)
- `GET /chats/messages/:chatId` - Messages log.
- `POST /chats/direct` - Connect room.
- `GET /chats/active` - List rooms.

### Administrative Audits & Reports (`/api/reports`)
- `GET /reports/dashboard` - Analytics metrics and chart series.
- `POST /reports/certificate` - Generate completion certificates.
- `GET /reports/certificate/verify/:certificateId` - Verify certificates.
- `GET /reports/audit-logs` - Retrieve logs history.
