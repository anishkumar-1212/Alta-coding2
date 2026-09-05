# 🚀 CodeForge AI

> **An AI-powered coding practice, assessment, and contest platform built for students, faculty, and organizations.**

CodeForge AI is a full-stack coding platform designed to provide students with a complete programming practice and assessment environment while giving faculty and administrators the tools to manage questions, submissions, contests, analytics, and integrity signals.

The platform is being developed phase-by-phase, with a strong focus on **reliable code execution, secure authentication, organization-level isolation, scalable submissions, real-time contests, and responsible AI integration**.

---

## 🎯 Vision

CodeForge AI aims to create a unified coding ecosystem where students can:

* Practice programming problems
* Write and execute code in an online editor
* Submit solutions against test cases
* Track their coding progress
* Participate in coding contests
* Receive AI-assisted hints and feedback
* Understand their strengths and weaknesses

Faculty and administrators can:

* Create and manage coding questions
* Configure test cases
* Conduct coding contests
* Monitor contest activity
* Analyze student performance
* Review integrity signals
* Manage organization-level users and roles

---

## ✨ Core Features

### 🔐 Authentication & Organization Management

* Google OAuth authentication
* User sessions and authentication
* Role-based access
* Student / Faculty / Admin roles
* Organization-level data isolation
* Protected routes and APIs

### 📚 Question Bank

Faculty can create and manage coding problems containing:

* Problem statements
* Constraints
* Examples
* Tags
* Difficulty
* Test cases
* Visible and hidden test cases
* Question versions
* Publish / unpublish states

### 💻 Online Code Editor

Students can solve problems using an online coding environment with:

* Monaco Editor
* Language selection
* Starter code
* Custom input
* Code execution
* Console output
* Compile-error handling
* Runtime-error handling
* Timeout handling

### ⚡ Code Execution

CodeForge AI uses **Judge0** as the code execution engine.

The frontend communicates with the platform's execution service rather than directly communicating with Judge0.

This provides a safer abstraction between users and the execution infrastructure.

### 📤 Submission Pipeline

The submission system is designed around an asynchronous execution pipeline:

```text
Student
   ↓
Submit Code
   ↓
Submission API
   ↓
Queue
   ↓
Worker
   ↓
Judge0
   ↓
Test Cases
   ↓
Verdict
   ↓
Database
```

Supported verdicts include:

* Accepted
* Wrong Answer
* Compile Error
* Time Limit Exceeded
* Runtime Error

The architecture also includes idempotency and retry handling to prevent duplicate processing and stuck submissions.

### 📈 Practice & Progress Tracking

Students can track:

* Problems solved
* Recent submissions
* Streaks
* Topic progress
* Difficulty-wise performance
* Question acceptance rates

### 🏆 Coding Contests

Faculty can create and manage time-bound coding contests.

Contest lifecycle:

```text
DRAFT
  ↓
SCHEDULED
  ↓
REGISTRATION_OPEN
  ↓
LIVE
  ↓
ENDED
  ↓
EVALUATED
  ↓
ARCHIVED
```

Contest timing is server-authoritative to prevent client-side clock manipulation.

### 🥇 Real-Time Leaderboard

The platform is designed to provide live contest updates using WebSockets.

Planned capabilities include:

* Live leaderboard
* Real-time submission results
* Contest rooms
* Live ranking updates
* Redis-backed leaderboard performance

### 🛡️ Integrity Shield

CodeForge AI collects transparent contest integrity signals such as:

* Focus loss
* Tab/visibility changes
* Paste events
* Fullscreen exits
* Connection/disconnection events

These signals are intended as **informational signals for faculty**, not automatic punishment or verdict modification.

### 🤖 AI Features

AI is designed as an enhancement layer rather than a dependency for core judging.

Planned AI capabilities include:

* AI-assisted question drafting
* AI-generated test cases
* Progressive hints
* Code review
* Complexity estimation
* AI-powered learning recommendations

AI-generated test cases require faculty review before becoming official hidden test cases.

### 📊 Analytics

The analytics layer will provide:

#### Faculty

* Class performance
* Topic-wise performance
* Difficult questions
* Student weaknesses
* Cohort reports

#### Students

* Skill profile
* Topic strengths and weaknesses
* Progress tracking
* Weekly recommendations

---

# 🏗️ System Architecture

The project follows a modular full-stack architecture.

```text
                    ┌─────────────────────┐
                    │      Frontend       │
                    │     Web Client      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Backend        │
                    │      API Layer      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         PostgreSQL          Redis          AI Service
              │                │
              │                ▼
              │             BullMQ
              │                │
              │                ▼
              │             Worker
              │                │
              │                ▼
              │             Judge0
              │
              ▼
        Application Data
```

---

# 🛠️ Technology Stack

## Frontend

* React / Next.js
* JavaScript / TypeScript
* Monaco Editor
* CSS / UI components
* WebSockets

## Backend

* Node.js
* Backend API
* Authentication
* Role-based authorization
* Execution service
* Submission service
* Contest service

## Database

* PostgreSQL
* Prisma ORM
* Redis

## Code Execution

* Judge0

## Queue & Background Processing

* BullMQ
* Redis
* Worker-based submission processing

## Authentication

* Google OAuth
* JWT / session-based authentication

## DevOps

* Docker
* Docker Compose
* GitHub
* CI/CD

---

# 📁 Project Structure

The project is organized as a monorepo.

```text
CodeForge-AI/
│
├── apps/
│   ├── web/
│   │   └── # Frontend application
│   │
│   └── api/
│       └── # Backend application
│
├── packages/
│   ├── types/
│   │   └── # Shared types
│   │
│   ├── ui/
│   │   └── # Shared UI components
│   │
│   └── config/
│       └── # Shared configuration
│
├── docker-compose.yml
├── README.md
└── package.json
```

> The current repository structure may evolve as development progresses through the implementation phases.

---

# 🔑 User Roles

## 👨‍🎓 Student

Students can:

* Browse coding problems
* Solve problems
* Run code
* Submit solutions
* Track progress
* Participate in contests
* View leaderboards
* Receive AI assistance during practice

## 👨‍🏫 Faculty

Faculty can:

* Create coding questions
* Manage test cases
* Publish questions
* Create contests
* Monitor contests
* Review integrity signals
* Analyze student performance

## 👨‍💼 Admin

Administrators can:

* Manage organizations
* Manage users
* Assign roles
* Manage permissions
* Access administrative functionality

---

# 🔒 Security Principles

Security is considered throughout the architecture.

### Organization Isolation

Every organization-owned resource should be scoped using an `organizationId`.

### Server-Side Authorization

Roles and permissions are validated on the backend rather than trusting values supplied by the frontend.

### Secure Code Execution

User code is executed through Judge0 rather than directly through backend `child_process` execution.

### Hidden Test Cases

Hidden test cases must never be exposed to students.

### Asynchronous Submission Processing

Submission execution is handled through a queue and worker architecture rather than blocking HTTP requests.

### AI Isolation

AI functionality must never determine or modify the official judging verdict.

---

# 🗺️ Development Roadmap

CodeForge AI is being developed in phases.

| Phase    | Module                             | Status |
| -------- | ---------------------------------- | ------ |
| Phase 0  | Foundation & Setup                 | 🔄     |
| Phase 1  | Authentication & Organization Core | 🔄     |
| Phase 2  | Question Bank                      | ⏳      |
| Phase 3  | Editor + Code Execution            | ⏳      |
| Phase 4  | Submission Pipeline                | ⏳      |
| Phase 5  | Practice Module                    | ⏳      |
| Phase 6  | Contest Engine                     | ⏳      |
| Phase 7  | Leaderboard + WebSockets           | ⏳      |
| Phase 8  | Integrity Shield                   | ⏳      |
| Phase 9  | AI Features                        | ⏳      |
| Phase 10 | Analytics                          | ⏳      |
| Phase 11 | Testing, Security & Load           | ⏳      |
| Phase 12 | Pilot Deployment                   | ⏳      |

The development process follows a strict rule:

> **A phase should not begin until the exit criteria of the previous phase are satisfied.**

This keeps the core execution and submission pipeline reliable before adding higher-level features.

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd CodeForge-AI
```

## 2. Install dependencies

```bash
npm install
```

If the project uses separate frontend and backend applications:

```bash
cd FrontEnd
npm install
```

and:

```bash
cd Backend
npm install
```

## 3. Configure environment variables

Create your environment files according to the project's environment configuration.

Example:

```env
PORT=5000

MONGO_URI=your_database_url

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_google_redirect_uri
```

**Never commit real secrets or `.env` files to GitHub.**

Use `.env.example` files to document required variables.

## 4. Start the backend

```bash
npm run dev
```

## 5. Start the frontend

```bash
npm run dev
```

The exact commands may change as the project moves toward the planned monorepo architecture.

---

# 🧪 Testing

Testing is planned across multiple levels:

### Unit Tests

Used for:

* Authentication
* Authorization
* Business logic
* Services
* Guards

### Integration Tests

Used for:

* Submission pipeline
* Queue processing
* Database interactions
* Contest functionality

### End-to-End Tests

Example:

```text
Login
  ↓
Protected Dashboard
  ↓
Open Question
  ↓
Write Code
  ↓
Run
  ↓
Submit
  ↓
Worker
  ↓
Verdict
```

### Load Testing

The platform is designed to eventually test increasing concurrent-user loads before pilot deployment.

---

# 📌 Engineering Principles

CodeForge AI follows several core engineering rules:

1. **Reliability before features**
2. **Server-side authorization**
3. **Organization-level data isolation**
4. **Frontend never communicates directly with Judge0**
5. **Submission execution should not block HTTP requests**
6. **Hidden test cases remain protected**
7. **AI must never be load-bearing for judging correctness**
8. **Sensitive faculty/admin actions should be auditable**
9. **Every phase must satisfy its Definition of Done**
10. **"Works on my machine" is not considered completion**

These principles are carried across all development phases.

---

# 🤝 Contribution

Contributions are welcome.

### Development workflow

```text
Create Branch
     ↓
Develop Feature
     ↓
Test
     ↓
Commit
     ↓
Push
     ↓
Create Pull Request
     ↓
Code Review
     ↓
Merge
```

Please keep commits focused and use meaningful commit messages.

Example:

```bash
git checkout -b feature/question-bank

git add .

git commit -m "Add question bank module"

git push origin feature/question-bank
```

---

# 📜 Project Status

🚧 **CodeForge AI is currently under active development.**

The project is being built incrementally according to the phase-wise engineering plan, starting from the foundation and authentication layers before progressing toward code execution, submissions, contests, AI, analytics, and pilot deployment.

---

# 🌟 Long-Term Goal

The long-term goal of CodeForge AI is to provide an end-to-end coding education and assessment ecosystem for organizations and educational institutions.

```text
Learn
  ↓
Practice
  ↓
Code
  ↓
Run
  ↓
Submit
  ↓
Analyze
  ↓
Compete
  ↓
Improve
```

**CodeForge AI — Build. Practice. Compete. Improve. 🚀**
