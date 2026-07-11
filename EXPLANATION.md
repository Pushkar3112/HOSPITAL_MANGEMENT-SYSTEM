# Hospital Management System - In-Depth Architecture Explanation

A comprehensive guide to the complete architecture of the Hospital Management System, excluding Google Gemini Bot and Nginx.

---

## Table of Contents

1. [High-Level Architecture Overview](#1-high-level-architecture-overview)
2. [Technology Stack Breakdown](#2-technology-stack-breakdown)
3. [Project Directory Structure](#3-project-directory-structure)
4. [Backend Architecture (Deep Dive)](#4-backend-architecture-deep-dive)
   - 4.1 [Entry Point — `src/index.js`](#41-entry-point--srcindexjs)
   - 4.2 [Configuration Layer](#42-configuration-layer)
   - 4.3 [Database Layer — PostgreSQL + Prisma ORM](#43-database-layer--postgresql--prisma-orm)
   - 4.4 [Database Schema (Entity-Relationship Design)](#44-database-schema-entity-relationship-design)
   - 4.5 [Middleware Pipeline](#45-middleware-pipeline)
   - 4.6 [Route Layer](#46-route-layer)
   - 4.7 [Controller Layer (Business Logic)](#47-controller-layer-business-logic)
   - 4.8 [Utility Layer](#48-utility-layer)
   - 4.9 [Caching Layer — Redis](#49-caching-layer--redis)
   - 4.10 [Payment Integration — Razorpay](#410-payment-integration--razorpay)
   - 4.11 [Database Seeding](#411-database-seeding)
5. [Frontend Architecture (Deep Dive)](#5-frontend-architecture-deep-dive)
   - 5.1 [React Application Entry](#51-react-application-entry)
   - 5.2 [Routing Architecture](#52-routing-architecture)
   - 5.3 [State Management — Redux Toolkit](#53-state-management--redux-toolkit)
   - 5.4 [Service Layer — Axios API Client](#54-service-layer--axios-api-client)
   - 5.5 [Custom Hooks Layer](#55-custom-hooks-layer)
   - 5.6 [Reusable Component Library](#56-reusable-component-library)
   - 5.7 [Page Components (Views)](#57-page-components-views)
   - 5.8 [Utility Functions](#58-utility-functions)
   - 5.9 [Styling Architecture — TailwindCSS + Custom CSS](#59-styling-architecture--tailwindcss--custom-css)
6. [Authentication & Authorization System](#6-authentication--authorization-system)
7. [Containerization — Docker Architecture](#7-containerization--docker-architecture)
8. [Data Flow: End-to-End Request Lifecycle](#8-data-flow-end-to-end-request-lifecycle)
9. [Role-Based Access Control (RBAC)](#9-role-based-access-control-rbac)
10. [Appointment Slot Engine](#10-appointment-slot-engine)

---

## 1. High-Level Architecture Overview

This is a **full-stack, containerized Hospital Management System (HMS)** built with a clean separation between frontend and backend, communicating exclusively over a RESTful JSON API.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DOCKER COMPOSE                           │
│                                                                 │
│  ┌──────────┐   ┌──────────────┐   ┌──────────┐   ┌─────────┐ │
│  │ Frontend │──▶│   Backend    │──▶│PostgreSQL│   │  Redis  │ │
│  │ React    │   │  Express.js  │──▶│   v15    │   │   v7    │ │
│  │ (port    │   │  (port 5000) │   │(port 5432)│  │(port    │ │
│  │  3000)   │   │              │   │          │   │ 6379)   │ │
│  └──────────┘   └──────────────┘   └──────────┘   └─────────┘ │
│                        │                                        │
│                  ┌─────┴──────┐                                 │
│                  │ Prisma ORM │                                  │
│                  └────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Architecture Pattern:** The project follows a **layered MVC (Model-View-Controller)** pattern:
- **Model** → Prisma schema + PostgreSQL database
- **View** → React frontend (SPA)
- **Controller** → Express.js controllers handling business logic

---

## 2. Technology Stack Breakdown

### Backend Technologies

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18 | JavaScript runtime for the server |
| **Express.js** | 4.18 | HTTP framework for building REST APIs |
| **Prisma** | 5.10 | Type-safe ORM for PostgreSQL |
| **PostgreSQL** | 15 (Alpine) | Primary relational database |
| **Redis** | 7 (Alpine) | In-memory cache for search results |
| **JWT (jsonwebtoken)** | 9.x | Token-based authentication |
| **bcryptjs** | 2.4 | Password hashing with salted rounds |
| **express-validator** | 7.x | Request body validation middleware |
| **Razorpay SDK** | 2.9 | Payment gateway integration |
| **Axios** | 1.6 | HTTP client (used internally) |
| **dotenv** | 16.x | Environment variable management |
| **nodemon** | 3.x | Hot-reload during development |

### Frontend Technologies

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.2 | UI component library (SPA) |
| **React Router DOM** | 6.20 | Client-side routing |
| **Redux Toolkit** | 1.9 | Global state management |
| **React-Redux** | 8.1 | React bindings for Redux |
| **Axios** | 1.6 | HTTP client for API communication |
| **TailwindCSS** | 3.3 | Utility-first CSS framework |
| **Recharts** | 2.10 | Data visualization / charts |
| **React Icons** | 4.12 | Icon library (Material Design) |
| **React Calendar** | 4.2 | Calendar widget for date picking |
| **React Toastify** | 9.1 | Toast notification library |
| **React Markdown** | 9.0 | Markdown renderer (symptom checker) |
| **date-fns** | 2.30 | Date formatting utilities |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker** | Container runtime |
| **Docker Compose** | Multi-container orchestration |

---

## 3. Project Directory Structure

```
HOSPITAL_MANAGEMENT-SYSTEM/
│
├── docker-compose.yml          # Orchestrates all 4 containers
│
├── backend/                    # Express.js REST API
│   ├── Dockerfile              # Backend container build instructions
│   ├── package.json            # Node.js dependencies & scripts
│   ├── prisma.config.ts        # Prisma configuration (TypeScript)
│   ├── seed.js                 # Database seeding script
│   ├── .env                    # Environment variables (DATABASE_URL)
│   ├── prisma/
│   │   ├── schema.prisma       # ⭐ DATABASE SCHEMA (all models & enums)
│   │   └── migrations/         # SQL migration files (auto-generated)
│   └── src/
│       ├── index.js            # ⭐ APP ENTRY POINT
│       ├── config/
│       │   ├── database.js     # Prisma client connection
│       │   └── redis.js        # Redis client connection
│       ├── middlewares/
│       │   ├── authMiddleware.js    # JWT auth + role authorization
│       │   ├── errorHandler.js      # Global error handler
│       │   └── validation.js        # Request validation rules
│       ├── controllers/
│       │   ├── authController.js         # Register/Login/Refresh/Logout
│       │   ├── patientController.js      # Patient CRUD operations
│       │   ├── doctorController.js       # Doctor CRUD + prescriptions
│       │   ├── adminController.js        # Admin dashboard + user mgmt
│       │   ├── appointmentController.js  # Booking + payment flow
│       │   ├── doctorSearchController.js # Public doctor search (cached)
│       │   └── symptomCheckerController.js # AI symptom analysis
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── patientRoutes.js
│       │   ├── doctorRoutes.js
│       │   ├── adminRoutes.js
│       │   ├── appointmentRoutes.js
│       │   ├── doctorSearchRoutes.js
│       │   └── symptomCheckerRoutes.js
│       └── utils/
│           ├── apiError.js          # Custom error class
│           ├── apiResponse.js       # Standardized response format
│           ├── passwordUtils.js     # bcrypt hash/compare
│           ├── tokenUtils.js        # JWT generation/verification
│           ├── appointmentUtils.js  # Slot generation algorithm
│           └── razorpayService.js   # Payment order creation & verification
│
├── frontend/                   # React Single Page Application
│   ├── Dockerfile              # Frontend container build instructions
│   ├── package.json            # React dependencies & scripts
│   ├── tailwind.config.js      # TailwindCSS configuration
│   ├── postcss.config.js       # PostCSS plugins
│   └── src/
│       ├── index.js            # React DOM render entry
│       ├── index.css           # Global + Tailwind CSS styles
│       ├── App.jsx             # ⭐ ROOT COMPONENT (all routes)
│       ├── components/         # Reusable UI components
│       │   ├── Card.jsx        # Card + StatCard components
│       │   ├── Loading.jsx     # Loading spinner + skeleton loader
│       │   ├── Modal.jsx       # Reusable modal dialog
│       │   ├── ProtectedRoute.jsx  # Auth guard wrapper
│       │   ├── Sidebar.jsx     # Navigation sidebar
│       │   ├── TopBar.jsx      # Header bar with user info
│       │   └── ToastContainer.jsx  # Toast notification system
│       ├── features/           # Redux Toolkit slices
│       │   ├── store.js        # Redux store configuration
│       │   ├── authSlice.js    # Auth state (user, tokens)
│       │   ├── patientSlice.js # Patient data state
│       │   ├── doctorSlice.js  # Doctor data state
│       │   ├── adminSlice.js   # Admin data state
│       │   └── uiSlice.js      # UI state (modals, toasts)
│       ├── services/           # API service layer
│       │   ├── api.js          # Axios instance + interceptors
│       │   └── index.js        # Service functions for all endpoints
│       ├── hooks/              # Custom React hooks
│       │   ├── useAuth.js      # Authentication operations
│       │   ├── usePatient.js   # Patient data fetching
│       │   └── useDoctor.js    # Doctor data fetching
│       ├── pages/              # 18 page components (views)
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── PatientDashboard.jsx
│       │   ├── PatientProfile.jsx
│       │   ├── MedicalHistory.jsx
│       │   ├── Prescriptions.jsx
│       │   ├── Invoices.jsx
│       │   ├── AppointmentBooking.jsx
│       │   ├── DoctorBookingPage.jsx
│       │   ├── SymptomChecker.jsx
│       │   ├── DoctorDashboard.jsx
│       │   ├── DoctorProfile.jsx
│       │   ├── DoctorAppointments.jsx
│       │   ├── DoctorAvailability.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── AdminUsers.jsx
│       │   └── AdminAppointments.jsx
│       └── utils/
│           └── dateUtils.js    # Date formatting helpers
│
└── nginx/                      # Reverse proxy configuration
    └── nginx.conf
```

---

## 4. Backend Architecture (Deep Dive)

### 4.1 Entry Point — `src/index.js`

This is the **heart of the backend server**. Here is exactly what happens when the server starts:

1. **Environment Loading** — `dotenv` reads the `.env` file and loads variables like `DATABASE_URL`, `JWT_SECRET` into `process.env`.

2. **Express App Initialization** — Creates an Express application instance.

3. **Middleware Registration** (in order):
   - `cors()` — Configures Cross-Origin Resource Sharing. Only the URL specified in `FRONTEND_URL` is allowed to make requests. `credentials: true` ensures cookies and auth headers are forwarded.
   - `express.json()` — Parses incoming JSON request bodies so `req.body` is populated.

4. **Database Connections**:
   - `connectRedis()` — Establishes a TCP connection to the Redis server.
   - `connectDB()` — Establishes a connection to PostgreSQL via Prisma's connection pool.

5. **Route Mounting** — Each route group is mounted under `/api/*`:
   ```
   /api/auth           → authRoutes        (public)
   /api/patients       → patientRoutes     (PATIENT only)
   /api/doctors        → doctorRoutes      (DOCTOR only)
   /api/admin          → adminRoutes       (ADMIN only)
   /api/doctor-search  → doctorSearchRoutes (public)
   /api/appointments   → appointmentRoutes (PATIENT only)
   /api/symptom-checker → symptomCheckerRoutes (public)
   ```

6. **Health Check** — `GET /api/health` returns `{ status: 'Server is running' }`.

7. **Error Handling** — The global `errorHandler` middleware catches all errors and returns consistent JSON responses.

8. **404 Handler** — Any unmatched route returns `{ success: false, message: 'Route not found' }`.

9. **Server Start** — Listens on `PORT` (default 5000).

---

### 4.2 Configuration Layer

#### `config/database.js` — Prisma Connection

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

**How it works:**
- Creates a **singleton PrismaClient** instance that manages a connection pool to PostgreSQL.
- `prisma.$connect()` explicitly opens the connection. If the database is unreachable, the process exits with code 1 (fatal error).
- The `prisma` object is exported and used by every controller to run queries.
- Prisma uses a **connection pool** internally (default 5 connections) to efficiently multiplex database queries across concurrent requests.

#### `config/redis.js` — Redis Connection

```javascript
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380',
});
```

**How it works:**
- Creates a Redis client using the `redis` npm package (v4+).
- The client emits `connect` and `error` events for observability.
- `connectRedis()` is called once during startup. **If Redis fails to connect, the app continues running** — Redis is treated as optional. The `doctorSearchController` checks `redisClient.isReady` before attempting cache operations, falling back to direct database queries.

**Why Redis is used:**
- **Doctor search results** are cached for 1 hour (3600 seconds) using `setEx()`.
- **Doctor detail pages** are also cached for 1 hour.
- This dramatically reduces database load for the most frequent public queries.

---

### 4.3 Database Layer — PostgreSQL + Prisma ORM

#### What is Prisma?

Prisma is a **next-generation ORM** that replaces raw SQL with a type-safe query builder. Instead of writing:
```sql
SELECT * FROM "User" WHERE email = 'foo@bar.com';
```
You write:
```javascript
await prisma.user.findUnique({ where: { email: 'foo@bar.com' } });
```

#### How Prisma Works in This Project

1. **Schema Definition** → `prisma/schema.prisma` declares all models, enums, and relations in Prisma's DSL (Domain Specific Language).

2. **Migration** → When you run `npx prisma migrate dev`, Prisma:
   - Compares the schema file against the current database state.
   - Generates a SQL migration file (stored in `prisma/migrations/`).
   - Executes the SQL against PostgreSQL to create/alter tables.

3. **Client Generation** → `npx prisma generate` reads the schema and generates a type-safe JavaScript client in `node_modules/@prisma/client`. This client is what controllers import.

4. **Query Execution** → At runtime, Prisma translates method calls into optimized SQL queries, sends them through a connection pool, and returns structured JavaScript objects.

#### `prisma.config.ts`

This TypeScript configuration file tells Prisma where to find the schema, migrations directory, and the database URL. It imports `dotenv/config` to ensure environment variables are available during CLI operations.

---

### 4.4 Database Schema (Entity-Relationship Design)

The database has **6 models** and **7 enums**:

#### Enums (Constrained Value Types)

| Enum | Values | Purpose |
|---|---|---|
| `Role` | PATIENT, DOCTOR, ADMIN | User role types |
| `Gender` | MALE, FEMALE, OTHER | Patient gender |
| `BloodGroup` | A+, A-, B+, B-, AB+, AB-, O+, O- | Blood type (mapped with `@map`) |
| `AppointmentStatus` | PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW | Appointment lifecycle |
| `VisitType` | ONLINE, OFFLINE | Telemed vs in-person |
| `PaymentStatus` | UNPAID, PENDING, PAID, REFUNDED | Payment lifecycle |
| `PaymentMode` | RAZORPAY, WALLET, CASH | Payment method |

#### Entity-Relationship Diagram

```
┌───────────┐       1:1        ┌─────────────────┐
│   User    │──────────────────│ PatientProfile   │
│           │                  │ (gender, DOB,    │
│ id (UUID) │                  │  bloodGroup,     │
│ name      │                  │  address [JSON], │
│ email     │       1:1        │  allergies,      │
│ phone     │──────────────┐   │  chronicConds)   │
│ password  │              │   └─────────────────┘
│ role      │              │
│ isActive  │    ┌─────────┴──────────┐
└───────────┘    │  DoctorProfile      │
     │           │  (specialization,   │
     │           │   qualifications,   │
     │           │   yearsOfExp,       │
     │           │   hospitalName,     │
     │           │   consultationFee,  │
     │           │   availableDays,    │
     │           │   dailyStartTime,   │
     │           │   dailyEndTime,     │
     │           │   slotDuration,     │
     │           │   customBreaks,     │
     │           │   isVerified,       │
     │           │   rating)           │
     │           └────────────────────┘
     │
     │ 1:N (as patient)          1:N (as doctor)
     ▼                           ▼
┌──────────────────────────────────────┐
│            Appointment               │
│ id, patientId, doctorId, date,       │
│ startTime, endTime, status,          │
│ visitType, reasonForVisit,           │
│ consultationFee, paymentStatus,      │
│ razorpayOrderId, razorpayPaymentId   │
│            │          │              │
│     1:1    │    1:N   │   1:N        │
│     ▼      │    ▼     │   ▼          │
│ Prescription  MedicalRecord  Invoice │
└──────────────────────────────────────┘
```

#### Model Details

**User** — Central identity table. Every person (patient, doctor, admin) is a User first. The `role` field determines what profile and permissions they have. Uses UUID primary keys (`@default(uuid())`). The `isActive` flag enables admin to block/unblock users.

**PatientProfile** — One-to-one extension of User. Stores medical metadata:
- `address` and `emergencyContact` are **JSON columns** — flexible embedded documents without needing separate tables.
- `allergies` and `chronicConditions` are **String arrays** (`String[]`) — PostgreSQL native arrays.
- `onDelete: Cascade` means deleting the User automatically deletes the PatientProfile.

**DoctorProfile** — One-to-one extension of User. Stores scheduling and professional info:
- `availableDays` is an `Int[]` array — `[1,2,3,4,5]` = Mon–Fri (JS Date `getDay()` convention).
- `customBreaks` is a `Json[]` array — each break is `{startTime, endTime, reason}`.
- `isVerified` — Doctors must be verified by an admin before they appear in search results.
- `maxPatientsPerSlot` — Supports future multi-patient slots (default 1).

**Appointment** — The core transactional entity. Links a patient to a doctor at a specific date/time:
- Has a **composite unique constraint**: `@@unique([doctorId, date, startTime, status])` — prevents double-booking.
- `prescriptionId` is a **1:1 optional relation** — an appointment may or may not have a prescription.
- Stores Razorpay payment identifiers directly for traceability.

**MedicalRecord** — Clinical documentation for a visit:
- `diagnoses` and `testsOrdered` are `String[]` arrays.
- `testResults` is a `Json[]` array — each entry is `{testName, result, date, attachmentUrl}`.
- Linked to both patient and doctor, and optionally to an appointment.

**Prescription** — Medication orders:
- `medications` is a `Json[]` array — each entry is `{name, dosage, frequency, duration, notes}`.
- Includes `lifestyleAdvice` and `followUpDate`.

**Invoice** — Financial records:
- `items` is a `Json[]` array — `{label, amount}` line items.
- Tracks Razorpay payment IDs for reconciliation.

---

### 4.5 Middleware Pipeline

Every incoming HTTP request passes through middleware in this order:

```
Request → CORS → JSON Parser → Route Matcher → [Auth] → [Authorize] → [Validation] → Controller → Error Handler → Response
```

#### `authMiddleware.js` — Authentication & Authorization

**`authenticate` middleware:**
1. Extracts the JWT token from the `Authorization: Bearer <token>` header.
2. Calls `verifyToken(token, "access")` which uses `jwt.verify()` with the `JWT_SECRET`.
3. If valid, attaches the decoded payload (`{ userId, role }`) to `req.user`.
4. If invalid/expired, throws a `401 Unauthorized` error.

**`authorize(...allowedRoles)` middleware (factory function):**
1. Takes a list of allowed roles (e.g., `authorize("DOCTOR")`).
2. Returns a middleware that checks if `req.user.role` is in the allowed list.
3. If not, throws `403 Forbidden`.

**Why this is a "factory function":** Using `(...allowedRoles) => (req, res, next) => { ... }` allows different routes to specify different role requirements while sharing the same authorization logic.

#### `errorHandler.js` — Global Error Handler

Express recognizes a middleware with **4 parameters** `(err, req, res, next)` as an error handler. This catches all errors thrown or passed via `next(error)` anywhere in the pipeline:

```javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    data: null,
  });
};
```

Every response follows the same shape: `{ success, message, errors, data }`.

#### `validation.js` — Request Validation

Uses `express-validator` to define validation chains for specific routes:

- **Register**: Validates name (non-empty), email (format), phone (10-15 digits regex), password (min 6 chars), role (PATIENT or DOCTOR).
- **Login**: Validates email format and non-empty password.
- **Create Appointment**: Validates doctorId, ISO8601 date, HH:MM time format, visit type.

The `handleValidationErrors` middleware runs after validators and throws a `400` error with all validation failures if any exist.

---

### 4.6 Route Layer

Routes follow the **RESTful convention** and are organized by domain:

#### Auth Routes (`/api/auth`) — Public
| Method | Endpoint | Action |
|---|---|---|
| POST | `/register` | Create new user + profile |
| POST | `/login` | Authenticate & get tokens |
| POST | `/refresh` | Get new access token |
| POST | `/logout` | Client-side token removal |

#### Patient Routes (`/api/patients`) — PATIENT role only
| Method | Endpoint | Action |
|---|---|---|
| GET | `/profile` | Get patient profile |
| PUT | `/profile` | Update patient profile |
| GET | `/appointments` | List patient's appointments |
| DELETE | `/appointments/:id` | Cancel an appointment |
| GET | `/history` | Get medical records |
| GET | `/prescriptions` | Get prescriptions |
| GET | `/invoices` | Get invoices |

#### Doctor Routes (`/api/doctors`) — DOCTOR role only
| Method | Endpoint | Action |
|---|---|---|
| GET | `/profile` | Get doctor profile |
| PUT | `/profile` | Update profile + schedule |
| GET | `/appointments` | List doctor's appointments |
| PATCH | `/appointments/:id/confirm` | Confirm appointment |
| PATCH | `/appointments/:id/complete` | Mark as completed |
| GET | `/slots` | Get available time slots |
| POST | `/prescriptions` | Create prescription |
| GET | `/prescriptions` | List prescriptions |
| POST | `/medical-records` | Create medical record |

#### Admin Routes (`/api/admin`) — ADMIN role only
| Method | Endpoint | Action |
|---|---|---|
| GET | `/stats` | Dashboard statistics |
| GET | `/users` | List all users (paginated) |
| PATCH | `/users/:id/block` | Block a user |
| PATCH | `/users/:id/unblock` | Unblock a user |
| PATCH | `/doctors/:id/approve` | Verify a doctor |
| DELETE | `/doctors/:id/reject` | Reject & delete doctor |
| GET | `/appointments` | All appointments (paginated) |
| GET | `/invoices` | All invoices (paginated) |

#### Doctor Search Routes (`/api/doctor-search`) — Public
| Method | Endpoint | Action |
|---|---|---|
| GET | `/search` | Search doctors (cached in Redis) |
| GET | `/:doctorId` | Get doctor detail (cached) |
| GET | `/:doctorId/slots` | Get available slots for a date |

#### Appointment Routes (`/api/appointments`) — PATIENT role
| Method | Endpoint | Action |
|---|---|---|
| POST | `/` | Create appointment + payment order |
| POST | `/verify-payment` | Verify Razorpay payment |
| POST | `/webhook` | Razorpay webhook (public) |

---

### 4.7 Controller Layer (Business Logic)

#### `authController.js` — Registration & Login

**Registration Flow:**
1. Check if email already exists → `409 Conflict` if so.
2. Hash the password using bcrypt with **10 salt rounds**.
3. Execute a **Prisma transaction** (`prisma.$transaction`):
   - Create the `User` record.
   - If role is PATIENT → create a `PatientProfile` linked to the user.
   - If role is DOCTOR → create a `DoctorProfile` with placeholder defaults (`isVerified: false`).
4. Generate both access token (15min) and refresh token (7 days).
5. Return user data + both tokens.

**Why transactions?** If User creation succeeds but Profile creation fails, the transaction rolls back both — ensuring data consistency (no orphan users without profiles).

**Login Flow:**
1. Find user by email.
2. Check `isActive` flag → `403` if blocked.
3. Compare submitted password against stored bcrypt hash.
4. Generate and return tokens.

**Token Refresh Flow:**
1. Receive refresh token in request body.
2. Verify it using the `JWT_REFRESH_SECRET`.
3. Look up the user to confirm they still exist.
4. Generate a new access token (but NOT a new refresh token — avoids token rotation attacks in this simple implementation).

#### `patientController.js` — Patient Operations

**`getProfile`:** Fetches both the `User` (name, email, phone) and `PatientProfile` (medical data) and returns them combined.

**`updateProfile`:** Uses Prisma's `upsert` — if a profile exists, it updates; if not, it creates one. This handles edge cases where a profile might not have been created during registration.

**`cancelAppointment`:** Implements a **2-hour cancellation policy**:
1. Verify the appointment belongs to the requesting patient.
2. Only PENDING or CONFIRMED appointments can be cancelled.
3. Calculate time difference between now and appointment time.
4. If less than 2 hours away → reject with `400`.
5. If appointment was PAID → automatically set payment status to `REFUNDED`.

#### `doctorController.js` — Doctor Operations

**`updateProfile`:** Allows doctors to configure their entire schedule:
- Working days, start/end times, slot duration, custom breaks.
- This data drives the slot generation algorithm.

**`getAvailableSlots`:** Calls the slot engine (see Section 10) to compute available time slots for a given date.

**`createPrescription`:** Creates a prescription record and optionally links it to an appointment via the `prescriptionId` foreign key on the Appointment model.

**`createMedicalRecord`:** Creates a clinical record with diagnoses, tests ordered, test results (JSON), and notes.

#### `adminController.js` — Admin Operations

**`getStats`:** Runs 5 parallel database queries:
1. Count of patients (`role = PATIENT`).
2. Count of doctors (`role = DOCTOR`).
3. Total appointments.
4. Today's appointments (using date range filter).
5. Total revenue (aggregate sum of paid invoice amounts using `prisma.invoice.aggregate`).

**`getUsers`:** Supports **pagination** (`skip`/`take`) and **search** across name and email using Prisma's `contains` with `mode: 'insensitive'` for case-insensitive matching.

**`approveDoctor` / `rejectDoctor`:** Approve sets `isVerified: true`. Reject deletes the user entirely — the `onDelete: Cascade` in the Prisma schema ensures the DoctorProfile is automatically cleaned up.

**`blockUser` / `unblockUser`:** Toggles the `isActive` flag. Blocked users cannot log in (checked in the login flow).

#### `appointmentController.js` — Booking & Payment

**`createAppointment`:** The most complex flow:
1. **Slot validation**: Checks if the exact slot (doctor + date + startTime) is already booked with PENDING or CONFIRMED status.
2. **Fee lookup**: Fetches the doctor's consultation fee from their profile.
3. **Appointment creation**: Creates in PENDING status with UNPAID payment.
4. **Razorpay order**: Creates a payment order (or mock order if Razorpay isn't configured).
5. **Invoice creation**: Auto-generates an invoice with the consultation fee as a line item.
6. **Response**: Returns the appointment + Razorpay order details so the frontend can open the payment dialog.

**`verifyPayment`:**
1. Receives Razorpay's `orderId`, `paymentId`, and `signature`.
2. Verifies the HMAC-SHA256 signature against the Razorpay key secret.
3. Updates both the appointment (CONFIRMED + PAID) and invoice (PAID).

**`handleWebhook`:** Receives Razorpay server-side webhooks for events like `payment.authorized`. Updates appointment and invoice status. This is a **backup** — if the client-side verification fails, the webhook still processes the payment.

#### `doctorSearchController.js` — Public Search with Redis Caching

**`searchDoctors`:**
1. Builds a **cache key** from the serialized query parameters.
2. Checks Redis first — if found, returns cached data immediately (cache hit).
3. If cache miss, queries PostgreSQL with filters:
   - `specialization` (case-insensitive partial match)
   - `name` (through relation to User table)
   - `hospital` (case-insensitive partial match)
   - `minFee` / `maxFee` (range filter on `consultationFee`)
   - Only `isVerified: true` doctors are returned.
4. Results are sorted by rating descending and paginated.
5. Stores the result in Redis with a **1-hour TTL** (`setEx` with 3600 seconds).

**Why cache doctor search?** Doctor profiles change infrequently but are queried frequently by patients. Caching eliminates repetitive database joins.

---

### 4.8 Utility Layer

#### `apiError.js` — Custom Error Class
Extends JavaScript's native `Error` class with `statusCode`, `data`, `errors`, and `success` fields. This allows throwing errors like:
```javascript
throw new ApiError(404, "Doctor not found");
```
The global error handler then extracts `statusCode` and `message` to form the response.

#### `apiResponse.js` — Standardized Response
Every successful response uses:
```javascript
sendResponse(res, 200, data, "Success message");
// Returns: { statusCode: 200, data: {...}, message: "...", success: true }
```
This ensures the frontend always receives a consistent response shape.

#### `passwordUtils.js` — bcrypt Wrapper
- **`hashPassword`**: Generates a random salt (10 rounds) and hashes the password. 10 rounds means ~10ms computation time — balances security and performance.
- **`comparePassword`**: Compares a plaintext password against a stored hash. bcrypt internally extracts the salt from the hash to perform the comparison.

#### `tokenUtils.js` — JWT Management
- **`generateToken`**: Creates a JWT containing `{ userId, role }` signed with either `JWT_SECRET` (access) or `JWT_REFRESH_SECRET` (refresh). Access tokens expire in 15 minutes; refresh tokens in 7 days.
- **`verifyToken`**: Decodes and verifies a JWT. Throws `401` if expired or tampered.
- **`generateAuthTokens`**: Convenience function that generates both token types at once.

**Why two different secrets?** If the access token secret is compromised, the refresh tokens (signed with a different secret) remain secure, limiting the blast radius.

---

### 4.9 Caching Layer — Redis

Redis serves as a **read-through cache** for doctor search and detail endpoints:

```
Client Request → Check Redis → [HIT] → Return cached data
                              → [MISS] → Query PostgreSQL → Store in Redis → Return data
```

**Cache Strategy:**
- **TTL-based expiration**: All cache entries expire after 1 hour (3600s).
- **No cache invalidation**: When a doctor updates their profile, the cache is NOT invalidated. The stale data will naturally expire. This is acceptable because doctor profile changes are infrequent and a 1-hour delay is tolerable for search results.
- **Graceful degradation**: If Redis is down, the application falls back to direct database queries. The `redisClient.isReady` check prevents errors.

---

### 4.10 Payment Integration — Razorpay

#### Architecture
```
Frontend                    Backend                     Razorpay
   │                          │                            │
   │──Create Appointment────▶│──createOrder()────────────▶│
   │                          │◀──Order {id, amount}──────│
   │◀──Order Details──────────│                            │
   │                          │                            │
   │──Open Razorpay Checkout─▶│                            │
   │◀─Payment {id, signature}─│                            │
   │                          │                            │
   │──Verify Payment────────▶│──verifySignature()──────── │
   │                          │  (HMAC-SHA256 check)       │
   │◀──Confirmed─────────────│                            │
```

**Mock Payment Support:** If Razorpay API keys are not configured (e.g., in development), the service creates **mock orders** with IDs like `order_mock_1234567890`. Mock payments automatically pass signature verification. This allows the full booking flow to work without real Razorpay credentials.

**Signature Verification:** Uses HMAC-SHA256:
```
body = orderId + "|" + paymentId
expectedSignature = HMAC-SHA256(body, RAZORPAY_KEY_SECRET)
```
If the computed signature matches the one sent by Razorpay, the payment is authentic.

---

### 4.11 Database Seeding

The `seed.js` script populates the database with realistic demo data:

**Created Data:**
- 1 Admin user
- 3 Doctors (Cardiologist, Neurologist, Orthopedist) — all verified
- 3 Patients (with complete medical profiles)
- 6 Appointments (4 completed, 1 confirmed, 1 pending)
- 4 Prescriptions (linked to completed appointments)
- 4 Medical Records (with test results)
- 5 Invoices (with Razorpay mock payment data)

**Process:** First clears ALL existing data in dependency order (invoices → records → appointments → prescriptions → profiles → users), then recreates everything. Uses `prisma.$transaction` implicitly through nested creates.

---

## 5. Frontend Architecture (Deep Dive)

### 5.1 React Application Entry

**`index.js`** — Renders the root `<App />` component into the DOM element with id `root`. Uses React 18's `createRoot` API.

**`App.jsx`** — The root component wraps everything in:
1. `<Provider store={store}>` — Makes Redux store accessible to all components.
2. `<Router>` — Enables client-side routing.
3. `<Routes>` — Defines all route-to-component mappings.
4. `<ToastContainer />` — Global toast notification layer.

---

### 5.2 Routing Architecture

The app uses **React Router v6** with three route categories:

#### Public Routes (No auth required)
| Path | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Marketing homepage |
| `/login` | `LoginPage` | User authentication |
| `/register` | `RegisterPage` | New user signup |

#### Patient Routes (PATIENT role required)
| Path | Component | Purpose |
|---|---|---|
| `/patient/dashboard` | `PatientDashboard` | Overview & stats |
| `/patient/appointments` | `AppointmentBooking` | Book appointments |
| `/patient/profile` | `PatientProfile` | View/edit profile |
| `/patient/medical-history` | `MedicalHistory` | Past records |
| `/patient/symptom-checker` | `SymptomChecker` | AI symptom analysis |
| `/patient/prescriptions` | `Prescriptions` | View prescriptions |
| `/patient/invoices` | `Invoices` | View invoices |

#### Doctor Routes (DOCTOR role required)
| Path | Component | Purpose |
|---|---|---|
| `/doctor/dashboard` | `DoctorDashboard` | Overview & stats |
| `/doctor/appointments` | `DoctorAppointments` | Manage appointments |
| `/doctor/profile` | `DoctorProfile` | View/edit profile |
| `/doctor/availability` | `DoctorAvailability` | Configure schedule |

#### Admin Routes (ADMIN role required)
| Path | Component | Purpose |
|---|---|---|
| `/admin/dashboard` | `AdminDashboard` | System-wide stats |
| `/admin/users` | `AdminUsers` | User management |
| `/admin/appointments` | `AdminAppointments` | All appointments |

**Route Protection:** Every protected route is wrapped in `<ProtectedRoute requiredRole="ROLE">`. This component:
1. Checks if `accessToken` and `user` exist in Redux state.
2. If not → redirects to `/login` (preserving the intended destination in `location.state`).
3. If authenticated but wrong role → redirects to `/unauthorized`.

---

### 5.3 State Management — Redux Toolkit

The Redux store has **5 slices**, each managing a domain:

```
Redux Store
├── auth     → { user, accessToken, refreshToken, isLoading, error }
├── patient  → { profile, appointments, medicalHistory, prescriptions, invoices, isLoading, error }
├── doctor   → { profile, appointments, prescriptions, isLoading, error }
├── admin    → { stats, users, appointments, invoices, isLoading, error }
└── ui       → { modals: {}, toasts: [], loading: false }
```

#### `authSlice.js`
- **`loginStart`**: Sets `isLoading: true`, clears errors.
- **`loginSuccess`**: Stores user + tokens in state AND `localStorage` (for persistence across page reloads).
- **`loginFailure`**: Sets error message.
- **`logout`**: Clears everything from state AND `localStorage`.
- **`setUser`**: Updates user data (used after token refresh).

**Token Persistence:** On app load, the initial state reads tokens from `localStorage`. This means if the user refreshes the page, they remain authenticated (as long as tokens are valid).

#### `patientSlice.js`
Stores all patient-related data (profile, appointments, history, prescriptions, invoices) with setters for each. Includes `isLoading` and `error` states for each data domain.

#### `doctorSlice.js`
Similar to patient slice. Additionally has an `updateAppointment` reducer that finds and replaces a specific appointment in the array (used after confirming/completing an appointment).

#### `adminSlice.js`
Stores system-wide stats, user list, appointments, and invoices.

#### `uiSlice.js`
Manages generic UI state:
- **Modals**: A key-value map where `modals['createPrescription'] = true/false`.
- **Toasts**: An array of `{ id, type, message }` objects. New toasts are pushed with `Date.now()` as a unique ID.
- **Loading**: A global loading flag.

---

### 5.4 Service Layer — Axios API Client

#### `services/api.js` — Axios Instance

Creates a configured Axios instance with:
- **Base URL**: `REACT_APP_API_URL` or `http://localhost:5000/api`.
- **Default headers**: `Content-Type: application/json`.

**Request Interceptor:** Automatically attaches the JWT access token from `localStorage` to every outgoing request:
```javascript
config.headers.Authorization = `Bearer ${token}`;
```

**Response Interceptor — Automatic Token Refresh:**
1. If any request returns `401 Unauthorized` AND it hasn't been retried yet:
2. Fetch the refresh token from `localStorage`.
3. Call `POST /api/auth/refresh` to get a new access token.
4. Store the new access token in `localStorage` and update Axios defaults.
5. **Retry the original failed request** with the new token.
6. If refresh also fails → clear tokens and redirect to `/login`.

This creates a **seamless experience** — users never see 401 errors unless their session has truly expired (refresh token expired after 7 days).

#### `services/index.js` — Service Functions

Groups all API calls into domain-specific objects:

```javascript
authService.login(email, password)
patientService.getProfile()
doctorService.confirmAppointment(id)
adminService.getStats()
doctorSearchService.searchDoctors(filters)
appointmentService.createAppointment(data)
symptomCheckerService.checkSymptoms(data)
```

Each function returns an Axios promise. Components don't need to know about URLs or HTTP methods.

---

### 5.5 Custom Hooks Layer

Custom hooks **bridge the gap** between Redux state management and React components:

#### `useAuth.js`
Combines Redux dispatch, React Router navigation, and API calls:
- **`login(email, password)`**: Dispatches `loginStart` → calls API → dispatches `loginSuccess` or `loginFailure`.
- **`register(userData)`**: Same flow as login but calls register endpoint.
- **`logout()`**: Calls API logout → dispatches `logout()` → navigates to `/login`.
- **`refreshAccessToken()`**: Silently refreshes the access token.
- Returns the full auth state (`user`, `accessToken`, `isLoading`, `error`).

#### `usePatient.js`
Provides `useCallback`-wrapped functions for lazy data loading:
- `loadProfile()`, `loadAppointments(status)`, `loadMedicalHistory()`, `loadPrescriptions()`, `loadInvoices()`.
- Each function dispatches `setLoading(true)` → calls API → dispatches the appropriate setter → dispatches `setLoading(false)`.
- `useCallback` with `[dispatch]` dependency ensures stable function references across re-renders.

#### `useDoctor.js`
Similar pattern for doctor data. Additionally provides `confirmAppointment(id)` which optimistically updates the Redux state after the API call.

---

### 5.6 Reusable Component Library

#### `ProtectedRoute.jsx`
A wrapper component that implements **route-level authentication guards**. Uses Redux's `useSelector` to check auth state, and React Router's `Navigate` for redirects.

#### `Sidebar.jsx`
A **data-driven navigation component**. Receives an `items` array prop where each item has `{ path, label, icon }`. Renders navigation buttons with:
- **Active state highlighting**: Compares `location.pathname` against item path.
- **Visual indicators**: Active items get a blue left border and bold text.
- **Logout button**: Dispatches Redux `logout()` and navigates to login.

#### `TopBar.jsx`
Displays the page title, user name/email, and a dropdown menu with logout. Uses React local state (`useState`) for the dropdown toggle.

#### `Card.jsx` & `StatCard`
- **Card**: Simple container with white background, border radius, shadow, and optional title.
- **StatCard**: Dashboard metric card with icon, label, and large value. Supports color themes (primary, success, warning, danger).

#### `Modal.jsx`
Reusable dialog with backdrop overlay. Supports three sizes (sm: 400px, md: 600px, lg: 800px). Click on the overlay closes the modal. Click on the modal content stops propagation (prevents accidental close).

#### `Loading.jsx` & `SkeletonLoader`
- **Loading**: Simple centered text message.
- **SkeletonLoader**: Renders pulsing gray rectangles as placeholders while content loads.

#### `ToastContainer.jsx`
Renders active toasts from Redux state. Each toast auto-removes after 3 seconds using `setTimeout` in a `useEffect`. Supports four types with corresponding Material Design icons: success, error, warning, info.

---

### 5.7 Page Components (Views)

The frontend has **18 page components**, organized by role:

**Public Pages:** LandingPage (marketing), LoginPage (auth form), RegisterPage (signup form with role selection).

**Patient Pages:** PatientDashboard (stats + upcoming appointments), PatientProfile (editable medical profile), MedicalHistory (chronological records), Prescriptions (medication history), Invoices (payment records), AppointmentBooking (doctor search + scheduling), SymptomChecker (AI-powered).

**Doctor Pages:** DoctorDashboard (stats + today's appointments), DoctorProfile (professional info), DoctorAppointments (manage/confirm/complete), DoctorAvailability (schedule configuration with custom breaks).

**Admin Pages:** AdminDashboard (system metrics + revenue), AdminUsers (user list + block/approve), AdminAppointments (all appointments system-wide).

---

### 5.8 Utility Functions

#### `dateUtils.js`
- **`formatDate(date)`**: Formats to Indian locale (`en-IN`): "15 Apr, 2026".
- **`formatTime(time)`**: Extracts HH:MM from time string.
- **`formatDateTime(date, time)`**: Combines both: "15 Apr, 2026 at 10:00".
- **`daysUntilAppointment(date)`**: Calculates days remaining.
- **`isCancelable(date, time)`**: Returns `true` if appointment is more than 2 hours away.

---

### 5.9 Styling Architecture — TailwindCSS + Custom CSS

The frontend uses TailwindCSS for utility classes combined with custom CSS in `index.css`. TailwindCSS is configured via `tailwind.config.js` and processes through PostCSS (`postcss.config.js`). Custom CSS defines:
- Card styles, modal overlays, toast notifications, skeleton animations.
- Button variants (`.btn`, `.btn-primary`, `.btn-secondary`).
- Form input styles.
- Responsive layout utilities.

---

## 6. Authentication & Authorization System

```
          ┌──────────────────────────────────────┐
          │         AUTHENTICATION FLOW          │
          └──────────────────────────────────────┘

  [Register/Login]
        │
        ▼
  Backend generates TWO JWTs:
  ┌─────────────────────────────────────────────────┐
  │ Access Token (15 min)                           │
  │ Payload: { userId, role }                       │
  │ Signed with: JWT_SECRET                         │
  ├─────────────────────────────────────────────────┤
  │ Refresh Token (7 days)                          │
  │ Payload: { userId, role }                       │
  │ Signed with: JWT_REFRESH_SECRET                 │
  └─────────────────────────────────────────────────┘
        │
        ▼
  Frontend stores BOTH in localStorage
        │
        ▼
  Every API request includes: Authorization: Bearer <accessToken>
        │
        ▼
  If 401 → Axios interceptor auto-refreshes using refresh token
        │
        ▼
  If refresh fails → Clear tokens → Redirect to /login
```

**Authorization layers:**
1. **Route-level (frontend)**: `ProtectedRoute` component checks role before rendering.
2. **API-level (backend)**: `authenticate` + `authorize` middleware on every protected route.
3. **Data-level (backend)**: Controllers verify ownership (e.g., patient can only cancel THEIR appointments).

---

## 7. Containerization — Docker Architecture

### `docker-compose.yml` — Orchestration

Defines **4 services** (excluding Nginx) with dependency ordering:

```
postgres (no deps) ─┐
redis (no deps) ────┤──▶ backend (depends on postgres, redis) ──▶ frontend (depends on backend)
```

**Service Details:**

| Service | Image | Exposed Port | Volume |
|---|---|---|---|
| `postgres` | `postgres:15-alpine` | 5433→5432 | `postgres_data` (persistent) |
| `redis` | `redis:7-alpine` | 6380→6379 | None (ephemeral) |
| `backend` | Custom (Dockerfile) | 5000→5000 | None |
| `frontend` | Custom (Dockerfile) | 3000 (internal) | None |

**Named Volume:** `postgres_data` ensures database data survives container restarts. Redis is intentionally ephemeral — cache data can be regenerated.

### Backend Dockerfile
```dockerfile
FROM node:18-slim                    # Slim Debian-based Node.js
RUN apt-get install -y openssl       # Required by Prisma's query engine
COPY package*.json ./                # Install deps first (cache layer)
COPY prisma ./prisma/                # Schema needed for generation
RUN npm install                      # Install all dependencies
COPY . .                             # Copy source code
RUN touch .env                       # Prevent dotenv path errors
RUN npx prisma generate              # Generate Prisma Client
CMD ["npm", "start"]                 # node src/index.js
```

**Docker build optimization:** Copying `package.json` and running `npm install` BEFORE copying source code creates a cached Docker layer. Source code changes don't trigger `npm install` re-runs.

### Frontend Dockerfile
```dockerfile
# Stage 1: Build
FROM node:18-alpine as build
COPY . .
ENV REACT_APP_API_URL=/api           # Bake API URL into build
RUN npm run build                    # Create optimized production build

# Stage 2: Serve
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]  # Serve static files
```

**Multi-stage build:** The `serve` package is a lightweight static file server. The React app is pre-built into static HTML/JS/CSS.

---

## 8. Data Flow: End-to-End Request Lifecycle

**Example: Patient books an appointment**

```
1. [Frontend] Patient fills form → calls appointmentService.createAppointment(data)
2. [Axios]    Adds Authorization header → POST /api/appointments
3. [Express]  CORS check → JSON parse → Route match
4. [Auth MW]  Extract JWT → Verify → Attach req.user = {userId, role: "PATIENT"}
5. [Auth MW]  authorize("PATIENT") → role matches → next()
6. [Controller] appointmentController.createAppointment:
   a. Check slot availability (Prisma query)
   b. Get doctor's consultation fee (Prisma query)
   c. Create appointment record (Prisma insert)
   d. Create Razorpay order (HTTP to Razorpay API or mock)
   e. Create invoice record (Prisma insert)
   f. Return { appointment, order }
7. [apiResponse] Wraps in { success: true, data: {...}, message: "..." }
8. [Express]  Sends HTTP 201 response
9. [Axios]    Returns response to service layer
10. [Hook]    Dispatches Redux action with response data
11. [React]   Component re-renders with new state
12. [Frontend] Opens Razorpay payment dialog with order details
```

---

## 9. Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────┐
│                    PERMISSION MATRIX                     │
├──────────────┬──────────┬──────────┬──────────┬─────────┤
│ Action       │ PATIENT  │ DOCTOR   │ ADMIN    │ PUBLIC  │
├──────────────┼──────────┼──────────┼──────────┼─────────┤
│ Register     │    —     │    —     │    —     │   ✅    │
│ Login        │    —     │    —     │    —     │   ✅    │
│ Search Docs  │    —     │    —     │    —     │   ✅    │
│ View Profile │   ✅     │   ✅     │    —     │   ❌    │
│ Edit Profile │   ✅     │   ✅     │    —     │   ❌    │
│ Book Appt    │   ✅     │    ❌    │    ❌    │   ❌    │
│ Cancel Appt  │   ✅     │    ❌    │    ❌    │   ❌    │
│ Confirm Appt │    ❌    │   ✅     │    ❌    │   ❌    │
│ Complete Appt│    ❌    │   ✅     │    ❌    │   ❌    │
│ Write Rx     │    ❌    │   ✅     │    ❌    │   ❌    │
│ View History │   ✅     │    ❌    │    ❌    │   ❌    │
│ Manage Users │    ❌    │    ❌    │   ✅     │   ❌    │
│ View Stats   │    ❌    │    ❌    │   ✅     │   ❌    │
│ Block Users  │    ❌    │    ❌    │   ✅     │   ❌    │
│ Approve Docs │    ❌    │    ❌    │   ✅     │   ❌    │
└──────────────┴──────────┴──────────┴──────────┴─────────┘
```

---

## 10. Appointment Slot Engine

The `appointmentUtils.js` implements the **slot generation algorithm**, which is the core scheduling logic:

### Algorithm (Step by Step)

```
Input: DoctorProfile, targetDate, existingAppointments
Output: Array of { startTime, endTime, available: true }

1. Get day-of-week from targetDate (0=Sun, 1=Mon, ... 6=Sat)
2. If day NOT in doctor.availableDays → return empty array

3. Parse doctor.dailyStartTime and dailyEndTime into minutes
   Example: "09:00" → 540 minutes, "17:00" → 1020 minutes

4. Set cursor = startMinutes (540)
5. While cursor + slotDuration <= endMinutes:
   a. Convert cursor to "HH:MM" format → slotStart
   b. Convert (cursor + slotDuration) to "HH:MM" → slotEnd

   c. CHECK BREAKS:
      For each customBreak in doctor.customBreaks:
        If slotStart >= break.startTime AND slotStart < break.endTime:
          → Skip this slot (it falls within a break)

   d. CHECK EXISTING BOOKINGS:
      Filter appointments for this date with status PENDING or CONFIRMED
      For each booked slot:
        If NOT (slotEnd <= booked.startTime OR slotStart >= booked.endTime):
          → Skip this slot (time overlap detected)

   e. If not in break AND not booked:
      → Add { startTime: slotStart, endTime: slotEnd, available: true }

   f. cursor += slotDuration

6. Return all available slots
```

### Example

```
Doctor: Available Mon-Fri, 09:00-17:00, 30-min slots
Break: 13:00-14:00 (Lunch)
Booked: 10:00-10:30 (Confirmed)

Generated slots for a Monday:
09:00-09:30 ✅    12:00-12:30 ✅
09:30-10:00 ✅    12:30-13:00 ✅
10:00-10:30 ❌    13:00-13:30 ❌ (break)
10:30-11:00 ✅    13:30-14:00 ❌ (break)
11:00-11:30 ✅    14:00-14:30 ✅
11:30-12:00 ✅    ... and so on until 16:30-17:00
```

---

> **This document covers every architectural component of the Hospital Management System except Google Gemini Bot and Nginx, as requested.**
