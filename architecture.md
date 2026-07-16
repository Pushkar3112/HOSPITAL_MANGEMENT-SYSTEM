# MedCare Hospital Management System — Technical Architecture & System Design Document

> **Document Purpose:** This document is intended to serve as the single source of truth for the architectural decisions, system design, data flows, and infrastructure of the MedCare Hospital Management System. It is written for engineers onboarding to the project, technical reviewers, and system design evaluations.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Database Design — PostgreSQL + Prisma ORM](#4-database-design--postgresql--prisma-orm)
5. [Caching Layer — Redis](#5-caching-layer--redis)
6. [RAG Pipeline — LangGraph + ChromaDB + Groq LLM](#6-rag-pipeline--langgraph--chromadb--groq-llm)
7. [API Design](#7-api-design)
8. [Real-Time Messaging — Socket.IO WebSockets](#8-real-time-messaging--socketio-websockets)
9. [Security Considerations](#9-security-considerations)
10. [Performance Optimizations](#10-performance-optimizations)
11. [Tech Stack Justification](#11-tech-stack-justification)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Future Improvements](#13-future-improvements)

---

## 1. System Overview

MedCare HMS is a **full-stack, containerized hospital management platform** designed to digitize and streamline clinical workflows across three distinct user personas: **Patients**, **Doctors**, and **Administrators**. The core problem it solves is the fragmentation and inefficiency inherent in paper-based or siloed hospital management tools — appointment books, handwritten prescriptions, disconnected billing systems, and the inability for patients to communicate with their care providers asynchronously.

The platform consolidates appointment scheduling, medical record management, prescription workflows, doctor-patient real-time chat, automated billing, and an AI-powered medical assistant into a single unified interface. Patients can search for specialists by name, hospital, or condition, book time slots, pay consultation fees online, view their full medical history and prescriptions, and chat directly with their doctor. Doctors get a structured dashboard to manage their daily schedule, write prescriptions, complete appointment records, and configure their availability. Administrators gain a bird's-eye view of the entire hospital ecosystem — user management, financial reporting, and doctor verification workflows.

The AI subsystem, powered by a Retrieval-Augmented Generation pipeline built on LangGraph, ChromaDB, and Groq's hosted Llama 3.1 model, enables natural-language health queries against a curated knowledge base — allowing patients to ask questions about medications, conditions, and hospital logistics in plain English.

**Target Users:**
- **Patients** — Book appointments, view medical history, chat with doctors, pay invoices, consult the AI assistant.
- **Doctors** — Manage appointments, write prescriptions and medical records, configure availability and slot durations, chat with patients.
- **Admins** — Approve and reject doctor registrations, block/unblock users, view system-wide statistics and revenue data.

---

## 2. High-Level Architecture

### 2.1 Physical Service Topology

The system is composed of five discrete, independently containerized services. All services communicate over Docker's internal bridge network except for the frontend, which communicates with the backend via the host machine's network interfaces.

```
╔══════════════════════════════════════════════════════════════════╗
║                         HOST MACHINE                            ║
║                                                                  ║
║  ┌────────────────────┐  HTTP/WS   ┌────────────────────────┐   ║
║  │   React SPA        │◄──────────▶│   Express.js Backend   │   ║
║  │   (Port 3000)      │            │   (Port 5000)          │   ║
║  │                    │            │                        │   ║
║  │  - React 18        │            │  - REST API            │   ║
║  │  - Redux Toolkit   │            │  - WebSockets (WS)     │   ║
║  │  - React Router v6 │            │  - Passport.js OAuth   │   ║
║  │  - Axios + WS      │            │  - Prisma ORM          │   ║
║  └────────────────────┘            └────────────┬───────────┘   ║
║                                                  │               ║
║               ┌──────────────────────────────────┤               ║
║               │                  │               │               ║
║               ▼                  ▼               ▼               ║
║  ┌────────────────┐   ┌──────────────────┐  ┌──────────────┐    ║
║  │  FastAPI RAG   │   │  PostgreSQL 15   │  │  Redis 7     │    ║
║  │  Service       │   │  (Port 5433)     │  │  (Port 6380) │    ║
║  │  (Port 8000)   │   │                  │  │              │    ║
║  │                │   │  - Appointments  │  │  - TTL Cache │    ║
║  │  - LangGraph   │   │  - Prescriptions │  │  - Auth Data │    ║
║  │  - ChromaDB    │   │  - MedRecords    │  │  - Sessions  │    ║
║  │  - Groq LLM    │   │  - Chat Sessions │  │              │    ║
║  └───────┬────────┘   └──────────────────┘  └──────────────┘    ║
║          │                                                        ║
║          ▼                                                        ║
║  ┌────────────────┐   ┌────────────────────────────────────┐     ║
║  │  ChromaDB      │   │  Groq Cloud API                    │     ║
║  │  (In-Process)  │   │  - llama-3.1-8b-instant            │     ║
║  │  Vector Store  │   │  - 6000 tokens/min rate limit      │     ║
║  └────────────────┘   └────────────────────────────────────┘     ║
╚══════════════════════════════════════════════════════════════════╝
```

### 2.2 End-to-End Request Lifecycle

To understand how the system processes a user request, consider the canonical flow of a **Patient booking an appointment**:

```
Step 1: Patient opens AppointmentBooking.jsx in the browser.
        ↓
Step 2: React calls doctorSearchService.searchDoctors({ specialization: "Cardiology" })
        via the Axios api.js instance.
        ↓
Step 3: Axios injects the JWT Bearer token from localStorage into the request header.
        ↓
Step 4: HTTP GET request arrives at Express backend — /api/doctor-search/search?specialization=Cardiology
        ↓
Step 5: CORS middleware validates the request origin (allows localhost:3000).
        ↓
Step 6: authenticate() middleware decodes and verifies the JWT token, attaches req.user = { userId, role }.
        ↓
Step 7: doctorSearchController.searchDoctors() is invoked.
        ↓
Step 8: Controller constructs a Redis cache key: "doctor-search:Cardiology"
        Checks Redis → CACHE HIT → returns immediately, skipping the DB.
        OR
        CACHE MISS → queries PostgreSQL via Prisma:
          prisma.user.findMany({ where: { role: "DOCTOR", doctorProfile: { specialization: "Cardiology", isVerified: true } } })
        Stores result in Redis with 3600s TTL.
        ↓
Step 9: Response formatted via sendResponse() and returned as JSON.
        ↓
Step 10: Frontend updates Redux state → Component re-renders with doctor cards.
         ↓
Step 11: Patient selects a doctor → Calls /api/doctor-search/:doctorId/slots?date=2026-07-20
         (also cached in Redis with 60s TTL).
         ↓
Step 12: Patient selects a slot → POST /api/appointments
         Backend: validates slot availability, creates appointment (PENDING), creates Razorpay order,
         creates invoice, returns order details.
         ↓
Step 13: Frontend opens Razorpay payment modal.
         Patient pays → Frontend calls POST /api/appointments/verify-payment.
         Backend verifies HMAC-SHA256 signature → marks appointment CONFIRMED, invoice PAID.
         Cache invalidated: patient:appointments:*, doctor:appointments:*, doctor:slots:*
```

---

## 3. Authentication & Authorization

### 3.1 JWT Token Strategy

The system uses a **dual-token stateless session model** to balance security and usability.

```
                    ┌──────────────────────────────────────────┐
                    │              Token Architecture           │
                    ├──────────────────────────────────────────┤
                    │  Access Token                            │
                    │  ├─ Lifetime    : 15 minutes             │
                    │  ├─ Algorithm   : HS256                  │
                    │  ├─ Secret      : JWT_SECRET env var     │
                    │  └─ Payload    : { userId, role }        │
                    │                                          │
                    │  Refresh Token                           │
                    │  ├─ Lifetime    : 7 days                 │
                    │  ├─ Algorithm   : HS256                  │
                    │  ├─ Secret      : JWT_REFRESH_SECRET     │
                    │  └─ Payload    : { userId, role }        │
                    └──────────────────────────────────────────┘
```

**Why two tokens?** The access token is a short-lived bearer credential. If intercepted in transit, it becomes useless within 15 minutes. The refresh token, with a separate signing secret, is stored securely in `localStorage` and is only sent to the `/auth/refresh` endpoint — never to general API routes. If the access token signing secret were somehow leaked, the refresh tokens (signed with a different key) would remain unaffected.

**Silent Token Refresh Flow (Frontend Axios Interceptor):**
```
Client sends API request with access token
         ↓
Server returns 401 Unauthorized (token expired)
         ↓
Axios response interceptor catches the 401
         ↓
Checks localStorage for refreshToken
         ↓
POST /api/auth/refresh { refreshToken }
         ↓
  ┌──────┴──────┐
  │  Success    │  Failure
  │             │
  ▼             ▼
New access   Clear localStorage
token stored  → Redirect to /login
Retry original
request with
new token
```

This creates a seamless experience — users are never prompted to log in again mid-session unless their 7-day refresh window has expired.

### 3.2 Google OAuth 2.0 Integration (Passport.js)

Google OAuth allows users to skip password creation entirely, using their existing Google account as an identity provider.

```
Browser (3000)          Express (5000)            Google Auth Server
     │                        │                           │
     │──GET /api/auth/google──▶│                           │
     │                        │──Redirect to Google consent│
     │                        │  URL w/ client_id, scope──▶│
     │                        │                           │
     │◄────────────────────────│  Google Consent Screen ──▶│
     │   User logs in & grants │                           │
     │   permissions           │                           │
     │                        │◄─── Auth Code callback ───│
     │                        │   /api/auth/google/callback│
     │                        │                           │
     │                        │──POST token exchange ─────▶│
     │                        │◄── ID token + User profile│
     │                        │                           │
     │                        │  [Passport verify callback]│
     │                        │  1. Find user by googleId  │
     │                        │  2. Or find by email       │
     │                        │  3. Or create new user     │
     │                        │     + PatientProfile       │
     │                        │                           │
     │                        │  Generate JWT tokens       │
     │◄──Redirect to frontend──│                           │
     │  /auth/google/callback  │                           │
     │  ?accessToken=<JWT>     │                           │
     │  &refreshToken=<JWT>    │                           │
     │  &role=PATIENT          │                           │
     │                        │                           │
     │  GoogleOAuthCallback.jsx│                           │
     │  captures URL params    │                           │
     │  → localStorage         │                           │
     │  → Redux dispatch       │                           │
     │  → Dashboard redirect   │                           │
```

**Important:** The Google OAuth callback URL must be explicitly registered in the Google Cloud Console under "Authorized redirect URIs" for the OAuth client ID. Missing this causes a `redirect_uri_mismatch` error. The registered URL must exactly match `GOOGLE_CALLBACK_URL` in the backend `.env` file.

### 3.3 Role-Based Access Control (RBAC)

Three distinct roles define what operations a user may perform.

**Permission Matrix:**

| Action | PATIENT | DOCTOR | ADMIN | PUBLIC |
|---|---|---|---|---|
| Register / Login | — | — | — | ✅ |
| Google OAuth Sign-In | — | — | — | ✅ |
| Search Doctors / View Slots | ✅ | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | — | ❌ |
| Update Own Profile | ✅ | ✅ | — | ❌ |
| Book Appointment | ✅ | ❌ | ❌ | ❌ |
| Cancel Own Appointment | ✅ | ❌ | ❌ | ❌ |
| Confirm Appointment | ❌ | ✅ | ❌ | ❌ |
| Complete Appointment | ❌ | ✅ | ❌ | ❌ |
| Create Prescription | ❌ | ✅ | ❌ | ❌ |
| Save Prescription Template | ❌ | ✅ | ❌ | ❌ |
| View Own Medical History | ✅ | ❌ | ❌ | ❌ |
| Write Medical Record | ❌ | ✅ | ❌ | ❌ |
| Configure Availability | ❌ | ✅ | ❌ | ❌ |
| Initiate / View Chat | ✅ | ✅ | ❌ | ❌ |
| Use AI Assistant | ✅ | ✅ | ❌ | ❌ |
| View System Statistics | ❌ | ❌ | ✅ | ❌ |
| Manage All Users | ❌ | ❌ | ✅ | ❌ |
| Approve / Reject Doctors | ❌ | ❌ | ✅ | ❌ |
| Block / Unblock Users | ❌ | ❌ | ✅ | ❌ |
| View All Appointments | ❌ | ❌ | ✅ | ❌ |
| View All Invoices | ❌ | ❌ | ✅ | ❌ |

**Middleware Enforcement:**

The backend enforces RBAC at two levels: route mounting and controller logic.

```javascript
// Route-level: Only DOCTOR role can access these endpoints
router.use(authenticate, authorize('DOCTOR'));
router.get('/appointments', getAppointments);

// Controller-level: Patient can only cancel THEIR OWN appointments
if (appointment.patientId !== req.user.userId) {
  throw new ApiError(403, 'Forbidden: this is not your appointment');
}
```

**Frontend Route Guard:**

The `ProtectedRoute.jsx` component reads the Redux auth slice state and enforces navigation restrictions at the React Router level:

```
Route requested → Check accessToken in Redux state
                  ├── Not present → Redirect to /login
                  └── Present → Check user.role === requiredRole
                                ├── Mismatch → Redirect to /unauthorized
                                └── Match → Render the page component
```

### 3.4 Role-Specific Dashboard Routing

After login or OAuth callback, the frontend reads the `role` field from the JWT payload or user profile and redirects accordingly:

- `role === "PATIENT"` → `/patient/dashboard`
- `role === "DOCTOR"` → `/doctor/dashboard`
- `role === "ADMIN"` → `/admin/dashboard`

---

## 4. Database Design — PostgreSQL + Prisma ORM

### 4.1 Why PostgreSQL?

PostgreSQL was chosen for its mature support of **JSONB columns** (critical for flexible medical metadata like test results, addresses, and medication JSON arrays), native **array types** (`String[]`, `Int[]`) for fields like allergies and available days, strong **ACID transaction guarantees**, and robust support for composite unique constraints. SQLite was ruled out due to write concurrency limitations, and MongoDB was ruled out because the core entities (users, appointments, invoices) have highly relational, predictable schemas that benefit from FK enforcement.

### 4.2 Normalization Level

The schema adheres to **Third Normal Form (3NF)** for its core transactional entities. Every non-key attribute depends only on the primary key, with no transitive dependencies. Exceptions are intentionally denormalized where joins would be prohibitively expensive:

- `consultationFee` is stored directly on the `Appointment` record (copied from DoctorProfile at booking time) so that changing a doctor's fee later does not retroactively alter historical invoices.
- `medications` is stored as a `Json[]` array on `Prescription` rather than a normalized `Medication` table, because medication configurations are deeply coupled to a single prescription and never queried across prescriptions independently.

### 4.3 Full Entity-Relationship Design

```
┌──────────────┐   1:1   ┌─────────────────┐
│     User     │◄────────│  PatientProfile  │
│              │         │  (gender, DOB,   │
│  id (UUID)   │   1:1   │  bloodGroup,     │
│  name        │◄────────│  address[JSON],  │
│  email       │         │  allergies[])    │
│  passwordHash│         └─────────────────┘
│  googleId    │
│  role        │   1:1   ┌─────────────────┐
│  isActive    │◄────────│  DoctorProfile   │
└──────┬───────┘         │  (spec, fee,     │
       │                 │  availDays[],    │
       │                 │  slots, breaks)  │
       │                 └─────────────────┘
       │
       │ as PATIENT                  as DOCTOR
       │ 1:N Appointments            1:N Appointments
       │
       ▼
┌──────────────────────────────────────────────┐
│                 Appointment                   │
│  id, patientId, doctorId, date, startTime,   │
│  endTime, status, visitType, fee,            │
│  paymentStatus, razorpayOrderId              │
└──────────────────┬───────────────────────────┘
                   │
       ┌───────────┼───────────┬──────────────┐
       │           │           │              │
       ▼           ▼           ▼              ▼
┌────────────┐┌─────────────┐┌───────┐┌───────────────┐
│Prescription││MedicalRecord││Invoice││  ChatSession   │
│            ││             ││       ││  (patientId,   │
│ meds[JSON] ││ diagnoses[] ││ items ││   doctorId)    │
│ notes      ││ testResults ││[JSON] ││               │
│ followUpDt ││ [JSON]      ││       ││  ChatMessage[] │
└────────────┘└─────────────┘└───────┘└───────────────┘
```

### 4.4 Key Model Definitions

**User** — The central identity anchor. Every actor in the system is a User. The `role` enum determines which profile and capabilities they have. `googleId` is nullable and unique, allowing OAuth-linked accounts. `passwordHash` defaults to an empty string for OAuth-only accounts.

**PatientProfile** — One-to-one extension of User. `address` and `emergencyContact` are JSONB columns for flexible nested structures. `allergies` and `chronicConditions` are native PostgreSQL `text[]` arrays. `onDelete: Cascade` ensures profile cleanup when a user is deleted.

**DoctorProfile** — One-to-one extension of User. `availableDays` is an `Int[]` array using JavaScript's `Date.getDay()` convention (0=Sun). `customBreaks` is a `Json[]` array where each element describes a break period: `{ startTime, endTime, reason }`. `isVerified` defaults to `false` — doctors must be admin-approved before appearing in search results.

**Appointment** — The core transactional entity. Enforces a composite unique constraint `@@unique([doctorId, date, startTime, status])` to prevent double-booking at the database level (not just application-level). Contains Razorpay payment tracking fields and links optionally to a `Prescription`.

**ChatSession** — Enforces `@@unique([patientId, doctorId])` so only one session exists per doctor-patient pair. Acts as the conversation container for ChatMessages.

### 4.5 Indexing Strategy

PostgreSQL automatically creates B-Tree indexes on primary keys (`@id`) and unique constraints. Additional indexes are implicitly created on all foreign key columns by Prisma. High-read tables benefit from the following implicit indexes:

- `User.email` — Unique index. Every login queries this field.
- `User.googleId` — Unique index. OAuth lookup on every Google sign-in.
- `Appointment.doctorId + Appointment.date` — The slot availability query filters by both. The composite unique constraint creates this index.
- `ChatMessage.sessionId` — Every chat history fetch filters by session.

---

## 5. Caching Layer — Redis

### 5.1 Why Redis?

Redis provides sub-millisecond read latency for frequently-accessed, slowly-changing data. Without Redis, doctor search queries alone would perform 3–4 table joins across `User`, `DoctorProfile` for every patient browsing. Redis reduces this to a single O(1) key lookup for 98% of search traffic.

**Measured latency impact:** Doctor search queries (3-table Prisma join with filters) execute in ~18–35ms directly from PostgreSQL. From Redis, the same data is returned in ~0.3–1ms — roughly a **30× latency reduction** on cache hits.

### 5.2 Cache Key Naming Convention

All Redis keys follow a deterministic hierarchical naming convention:

```
{entity}:{operation}:{identifier}:{filters}
```

**Examples:**
```
doctor-search:Cardiology                          → All cardiologists (1hr TTL)
doctor-search:query:name_john_hospital_aiims      → Search result set (1hr TTL)
doctor-detail:abc-uuid-123                        → Individual doctor profile (1hr TTL)
doctor-slots:abc-uuid-123:2026-07-20              → Slot availability for a date (60s TTL)
patient:profile:def-uuid-456                      → Patient profile (300s TTL)
patient:appointments:def-uuid-456:all             → All patient appointments (120s TTL)
doctor:appointments:abc-uuid-123:PENDING          → Filtered appointments (120s TTL)
patient:dashboard:def-uuid-456                    → Aggregated dashboard stats (120s TTL)
```

### 5.3 TTL Strategy Per Data Type

| Data Type | TTL | Rationale |
|---|---|---|
| Doctor search results | 3600s (1hr) | Doctor profiles change rarely |
| Doctor detail (single) | 3600s (1hr) | Same reasoning |
| Doctor slot availability | 60s | Slots can be booked at any moment |
| Patient/Doctor profiles | 300s (5min) | Profile updates are infrequent |
| Appointment lists | 120s (2min) | Appointments change with bookings |
| Dashboard stats | 120s (2min) | Balance freshness vs. performance |

### 5.4 Cache-Aside Pattern & Invalidation

The system uses the **cache-aside** (lazy loading) pattern. Data is only loaded into cache when first requested, and cache is explicitly invalidated on writes.

```
┌──────────────────────────────────────┐
│             CACHE-ASIDE PATTERN       │
└──────────────────────────────────────┘

READ PATH:
Client Request
      │
      ▼
  Check Redis
      │
  ┌───┴────┐
  │  HIT   │  MISS
  │        │
  ▼        ▼
Return    Query PostgreSQL
Cache     → Write to Redis w/ TTL
          → Return result


WRITE PATH (Appointment Created):
POST /api/appointments
      │
      ▼
  Prisma INSERT → PostgreSQL
      │
      ▼
  Invalidate related cache keys:
  - patient:appointments:${patientId}:*
  - doctor:appointments:${doctorId}:*
  - doctor:slots:${doctorId}:${date}
  - patient:dashboard:${patientId}
  - doctor:dashboard:${doctorId}
```

**Pattern-Based Invalidation:**

```javascript
const deleteCachePattern = async (pattern) => {
  const keys = await redisClient.keys(pattern);  // e.g., "doctor:slots:abc-uuid-123:*"
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
```

This uses Redis's `KEYS` command for pattern matching. For production at scale, this should be replaced with `SCAN` + `UNLINK` for non-blocking deletion to avoid Redis latency spikes under large key volumes.

**Graceful Degradation:** The entire caching layer is optional. Every `redisClient.get()` and `redisClient.setEx()` call is wrapped in try-catch. If Redis is down, the application transparently falls back to direct PostgreSQL queries.

---

## 6. RAG Pipeline — LangGraph + ChromaDB + Groq LLM

### 6.1 What Problem Does the RAG System Solve?

Standard LLMs (like Llama 3.1) are trained on general-purpose internet text and have no knowledge of:
- This hospital's specific operating hours, departments, or doctor roster.
- Medical condition guides curated specifically for MedCare patients.
- Custom policies like cancellation rules or insurance panels.

Without RAG, the chatbot would either hallucinate specific hospital facts or admit ignorance. With RAG, the model is grounded in a private knowledge base of curated documents — giving accurate, context-specific answers.

### 6.2 Hybrid Retrieval Architecture

The system uses **hybrid retrieval** combining two fundamentally different search modalities:

```
┌─────────────────────────────────────────────────────────┐
│                    HYBRID RETRIEVAL                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Query: "What is the consultation fee for cardiologists?"│
│           │                                              │
│     ┌─────┴──────────────────────┐                       │
│     │                            │                       │
│     ▼                            ▼                       │
│  DENSE RETRIEVAL              SPARSE RETRIEVAL            │
│  (ChromaDB + Embeddings)      (BM25 Okapi)               │
│                                                          │
│  1. Encode query into         1. Tokenize query:         │
│     384-dim vector using         ["consultation",         │
│     SentenceTransformers         "fee", "cardiologist"]  │
│     (all-MiniLM-L6-v2)                                   │
│                               2. BM25 score each chunk   │
│  2. Cosine similarity            based on TF-IDF with    │
│     search in ChromaDB           term saturation and     │
│     vector index                 length normalization    │
│                                                          │
│  3. Returns top 6 chunks      3. Returns top 6 chunks    │
│     by semantic meaning          by keyword relevance    │
│                                                          │
└──────────────┬────────────────────────────┬─────────────┘
               │                            │
               ▼                            ▼
        Dense Results                 Sparse Results
        (Ranked by cosine)           (Ranked by BM25 score)
               │                            │
               └──────────────┬─────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │    RECIPROCAL RANK FUSION     │
              │                               │
              │  RRF(d) = Σ 1 / (k + rank(d)) │
              │  where k = 60 (offset constant)│
              │                               │
              │  Documents appearing high in  │
              │  BOTH lists score highest     │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │    LIGHTWEIGHT RERANKER       │
              │                               │
              │  Scores each fused chunk by   │
              │  counting exact token overlap │
              │  with the original query.     │
              │  Filters out noise chunks.    │
              └───────────────┬───────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │       GROQ LLM GENERATOR      │
              │  Model: llama-3.1-8b-instant  │
              │                               │
              │  System Prompt:               │
              │  "You are a helpful hospital  │
              │   assistant. Use ONLY the     │
              │   provided context to answer. │
              │   Do not hallucinate facts."  │
              │                               │
              │  Input: query + top 3 chunks  │
              │  Output: Natural language     │
              │          answer with sources  │
              └───────────────────────────────┘
```

### 6.3 LangGraph State Machine Architecture

LangGraph models the pipeline as a **directed acyclic graph (DAG)** of processing nodes with shared typed state. This replaces linear chained function calls with a composable, introspectable workflow graph.

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  classify   │   Determines query_type:
                    │    node     │   schedule | doctor_info
                    └──────┬──────┘   | medical | general
                           │
                           ▼
                    ┌─────────────┐
                    │  retrieve   │   Executes dense (ChromaDB)
                    │    node     │   + sparse (BM25) retrieval
                    └──────┬──────┘   Populates: documents[]
                           │
                           ▼
                    ┌─────────────┐
                    │  rerank     │   Applies RRF fusion +
                    │    node     │   token overlap scoring
                    └──────┬──────┘   Produces: reranked_results[]
                           │
                           ▼
                    ┌─────────────┐
                    │  generate   │   Sends context + query
                    │    node     │   to Groq API, gets answer
                    └──────┬──────┘   Produces: answer, sources
                           │
                           ▼
                    ┌─────────────┐
                    │    END      │
                    └─────────────┘
```

**Shared State Object (`AgentState`):**
```python
class AgentState(TypedDict):
    query: str                     # Raw user input
    query_type: str                # Classified intent
    documents: List[Document]      # Raw retrieved chunks
    reranked_results: List[Document] # Post-fusion, post-rerank chunks
    answer: str                    # LLM-generated answer
    sources: List[str]             # Source document names
    confidence: float              # Retrieval confidence score
```

**Why LangGraph over a simple function chain?** LangGraph provides graph-level observability, conditional edge routing (you can add a branch: "if confidence < 0.3, fall back to general response"), and clean separation of concerns. Each node is independently testable and swappable. Future improvements like adding a guardrails node or a memory/context node can be added as graph edges without restructuring existing nodes.

### 6.4 Knowledge Base & Document Ingestion

The knowledge base consists of curated `.txt` files in the `rag_service/documents/` directory:

| File | Contents |
|---|---|
| `hospital_info.txt` | Operating hours, departments, locations, general policies |
| `doctors_directory.txt` | Doctor names, specializations, consultation fees, availability |
| `general_health.txt` | Common health tips, preventive care, when to see a doctor |
| `diabetes_guide.txt` | Diabetes management, medications, diet, symptom monitoring |

**Ingestion Process:** At RAG service startup, documents are split into overlapping chunks (chunk_size=500, overlap=50 tokens) using LangChain's `RecursiveCharacterTextSplitter`. Each chunk is embedded using SentenceTransformers and indexed into ChromaDB's in-process vector store. The BM25 index is built from the same tokenized chunks in memory.

---

## 7. API Design

### 7.1 REST Convention

All endpoints follow RESTful conventions and are prefixed with `/api`. Request bodies are JSON. Responses follow a consistent envelope:

```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": { ... },
  "statusCode": 201
}
```

Errors follow:
```json
{
  "success": false,
  "message": "Slot already booked",
  "errors": [],
  "statusCode": 409
}
```

### 7.2 Endpoint Registry

**Auth (`/api/auth`) — Public:**

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create user + role-specific profile (transaction) |
| POST | `/login` | Validate credentials, return JWT tokens |
| POST | `/refresh` | Exchange refresh token for new access token |
| POST | `/logout` | Client-side token invalidation |
| GET | `/google` | Initiates Google OAuth redirect |
| GET | `/google/callback` | Google OAuth callback handler |
| GET | `/me` | Returns authenticated user profile (protected) |

**Doctor Search (`/api/doctor-search`) — Public:**

| Method | Path | Description |
|---|---|---|
| GET | `/search` | Filtered doctor search (specialization, fee, name) |
| GET | `/:doctorId` | Doctor detail page |
| GET | `/:doctorId/slots` | Available slots for a date |

**Appointments (`/api/appointments`) — PATIENT:**

| Method | Path | Description |
|---|---|---|
| POST | `/` | Book appointment + create Razorpay order + invoice |
| POST | `/verify-payment` | Verify HMAC-SHA256 signature, confirm payment |
| POST | `/webhook` | Razorpay server-side event webhook |

**Patient (`/api/patients`) — PATIENT:**

| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Fetch profile |
| PUT | `/profile` | Update profile |
| GET | `/appointments` | Appointment history |
| DELETE | `/appointments/:id` | Cancel appointment (2hr policy enforced) |
| GET | `/history` | Medical records |
| GET | `/prescriptions` | Prescription history |
| GET | `/invoices` | Invoice history |

**Doctor (`/api/doctors`) — DOCTOR:**

| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Fetch profile |
| PUT | `/profile` | Update profile + schedule |
| GET | `/appointments` | Appointment list |
| PATCH | `/appointments/:id/confirm` | Confirm appointment |
| PATCH | `/appointments/:id/complete` | Complete + link prescription |
| POST | `/prescriptions` | Create prescription + medical record |
| GET | `/prescriptions` | Prescription list |
| GET | `/templates` | Prescription templates |
| POST | `/templates` | Create template |
| PUT | `/templates/:id` | Update template |
| DELETE | `/templates/:id` | Delete template |

**Admin (`/api/admin`) — ADMIN:**

| Method | Path | Description |
|---|---|---|
| GET | `/stats` | System-wide KPIs (patient count, revenue, etc.) |
| GET | `/users` | Paginated user directory |
| PATCH | `/users/:id/block` | Block user |
| PATCH | `/users/:id/unblock` | Unblock user |
| PATCH | `/doctors/:id/approve` | Verify doctor |
| DELETE | `/doctors/:id/reject` | Reject and delete doctor |
| GET | `/appointments` | All appointments (paginated) |
| GET | `/invoices` | All invoices (paginated) |

**Chat (`/api/chat`) — Authenticated:**

| Method | Path | Description |
|---|---|---|
| POST | `/sessions` | Get or create a chat session |
| GET | `/sessions` | List all sessions for current user |
| GET | `/sessions/:sessionId/messages` | Fetch message history |
| PATCH | `/sessions/:sessionId/read` | Mark messages as read |

**RAG Chatbot (`/api/rag-chat`) — Authenticated:**

| Method | Path | Description |
|---|---|---|
| POST | `/chat` | Send user query to RAG pipeline, receive answer |

---

## 8. Real-Time Messaging — Socket.IO WebSockets

### 8.1 Architecture

Socket.IO establishes persistent WebSocket connections on top of the same Express HTTP server (port `5000`), avoiding the need for a separate message broker for this scale.

```
Client (Patient)                  Server (Socket.IO)                Client (Doctor)
     │                                    │                               │
     │──connect(auth: { token })─────────▶│                               │
     │                                    │  1. Verify JWT                │
     │                                    │  2. socket.join("user:${id}") │
     │                                    │                               │
     │──emit: send_message────────────────▶│                               │
     │  { receiverId, message, sessionId } │                               │
     │                                    │  3. Prisma create ChatMessage  │
     │                                    │  4. Update ChatSession         │
     │                                    │     lastMessage, lastMessageAt │
     │                                    │                               │
     │◄──emit: new_message ───────────────│──emit: new_message ──────────▶│
     │  (to room: user:${senderId})       │  (to room: user:${receiverId})│
     │                                    │                               │
     │──emit: mark_read───────────────────▶│                               │
     │  { sessionId }                     │  5. Prisma updateMany         │
     │                                    │     isRead=true               │
     │                                    │     where receiver=userId     │
```

### 8.2 Socket Event Registry

| Event | Direction | Payload | Description |
|---|---|---|---|
| `send_message` | Client → Server | `{ receiverId, message, sessionId }` | Send a chat message |
| `new_message` | Server → Client | Full ChatMessage object | Deliver message to recipient |
| `mark_read` | Client → Server | `{ sessionId }` | Mark session messages as read |
| `disconnect` | Client → Server | — | Clean up room references |

---

## 9. Security Considerations

### 9.1 Input Validation

All API request bodies are validated using `express-validator` chains defined in `src/middlewares/validation.js`. Validations include:
- **Email format**: RFC 5321-compliant regex.
- **Phone**: 10–15 digit regex.
- **Password**: Minimum 6 characters.
- **Dates**: ISO 8601 format.
- **Times**: `HH:MM` 24-hour regex.
- **Role**: Enum whitelist (`PATIENT`, `DOCTOR`).

A common middleware `handleValidationErrors` collects all failures and throws a single `400 Bad Request` with the full error array.

### 9.2 Rate Limiting

The system uses `express-rate-limit` to prevent brute-force attacks and API abuse. Auth endpoints (login, register) are typically rate-limited more aggressively than data endpoints.

### 9.3 Password Security

Passwords are hashed using `bcryptjs` with **10 salt rounds** before storage. BCrypt is intentionally slow (designed to resist GPU-accelerated brute force). 10 rounds produces ~10ms computation time per hash — fast enough for user experience but expensive enough to make offline dictionary attacks impractical. The raw password is never logged or stored.

### 9.4 Transport Security

In production, all traffic is encrypted via HTTPS/TLS. In the local Docker Compose setup, HTTP is used for simplicity, but the frontend and backend are isolated within Docker's bridge network. For any external-facing deployment, a TLS termination proxy (e.g., Nginx, Caddy) should be placed in front.

### 9.5 PII & Medical Record Handling

Medical records (diagnoses, prescriptions, test results) are linked to patient IDs via foreign keys and are only accessible to:
- The **patient themselves** (via patient routes).
- The **treating doctor** (via doctor routes, scoped to their own records).
- **Admins** (with audit accountability).

The controller layer explicitly checks ownership before returning sensitive records. There is no endpoint that returns another patient's medical data — even for admins, records are aggregated statistically, not returned individually.

### 9.6 Secrets Management

API keys (`GROQ_API_KEY`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`) are loaded exclusively from environment variables via `dotenv`. The `.env` files are listed in `.gitignore` and never committed to the repository. For Docker deployments, secrets are passed via environment variable injection in `docker-compose.yml` — the values are read from a root `.env` file that exists only on the host machine.

---

## 10. Performance Optimizations

### 10.1 Caching (Redis)

As described in Section 5, Redis caching reduces PostgreSQL load by serving hot read paths (doctor search, slots, profiles) from an in-memory store. The 30× latency improvement on cache hits directly improves the patient booking experience.

### 10.2 Database Connection Pooling (Prisma)

Prisma maintains a **connection pool** to PostgreSQL. The default pool size is determined by the formula `min(num_physical_cpus * 2 + 1, 10)`. This prevents the system from exhausting PostgreSQL's connection limit under concurrent traffic by reusing established TCP connections rather than creating a new one per request.

### 10.3 Database Query Optimization

- **Selective field fetching:** All Prisma queries use `select` to fetch only the fields needed by the response, avoiding over-fetching large JSON columns.
- **`include` vs `select` consistency:** Prisma does not allow mixing `include` and `select` at the same level. All nested relation fetching uses `select` within the top-level `include` block to avoid runtime Prisma validation errors.
- **Pagination:** Admin and search endpoints use `skip`/`take` to paginate results and avoid full table scans.
- **Parallel query execution:** Admin dashboard stats use `Promise.all([count1, count2, count3, ...])` to fire all aggregation queries in parallel rather than sequentially.

### 10.4 Frontend Optimization

- **Code splitting:** React's component-level lazy loading (or Vite's default chunk splitting) ensures the initial bundle only includes the landing page and auth pages. Dashboard pages are loaded on demand.
- **Redux state persistence:** Auth tokens stored in `localStorage` survive page refreshes, avoiding a round-trip to `/auth/me` on every reload.

---

## 11. Tech Stack Justification

| Technology | Role | Why Chosen | Rejected Alternative |
|---|---|---|---|
| **Node.js / Express** | Backend API server | Non-blocking I/O perfectly suited for I/O-bound hospital API workloads; massive ecosystem; same language as frontend | Django (Python): excellent but would require context-switching between Python backend and JS frontend; heavier framework overhead for API-only services |
| **Prisma ORM** | Database access | Type-safe query builder with excellent migration tooling; `.prisma` schema acts as single source of truth; auto-generated client eliminates raw SQL error surface | TypeORM: more configuration overhead; Sequelize: less type safety; Raw SQL: no schema management, migration tracking |
| **PostgreSQL** | Primary database | ACID transactions; native JSONB + array types; mature ecosystem; superior to MySQL for complex queries and indexing | MongoDB: excellent document DB, but the relational nature of appointments, invoices, and prescriptions would result in complex application-level joins |
| **Redis** | Cache layer | Sub-millisecond key lookups; built-in TTL support; `KEYS` pattern matching for bulk invalidation; battle-tested at massive scale | In-memory JS cache (node-cache): would be lost on process restart, not shared across instances; Memcached: less feature-rich, no Lua scripting or pub/sub |
| **Socket.IO** | Real-time chat | Abstracts WebSocket handshakes, reconnection logic, room management; falls back to long-polling automatically for clients that block WS | Raw WebSockets: more work to implement reconnection, rooms, authentication; Firebase Realtime DB: external dependency and vendor lock-in |
| **ChromaDB** | Vector store | Runs entirely in-process (no separate server), zero infrastructure overhead, straightforward Python API, perfect for embedded local deployments | Pinecone: cloud-hosted, requires network I/O per query, adds latency, costs money at scale; Weaviate: heavier infrastructure footprint |
| **Groq LLM API** | LLM inference | Groq's custom LPU hardware achieves inference speeds 10–25× faster than standard GPU inference (300–800 tokens/sec vs. 30–80 tok/sec); free tier is generous | OpenAI GPT-4: expensive per-token cost; slower inference; Anthropic Claude: similar cost concerns; Local Ollama: would require a GPU machine in the Docker stack |
| **LangGraph** | AI workflow orchestration | Models complex multi-step AI pipelines as composable, inspectable DAGs; supports conditional routing and state management across nodes | LangChain LCEL: less intuitive for multi-step graphs; Custom function chains: harder to introspect, debug, and extend |
| **SentenceTransformers** | Query embedding | `all-MiniLM-L6-v2` produces high-quality 384-dim embeddings, runs on CPU, is open-source with no API cost | OpenAI Embeddings: costs per embedding call; Cohere Embeddings: external dependency, latency overhead |
| **Passport.js** | OAuth middleware | De-facto standard for Node.js authentication strategies; pre-built Google strategy eliminates custom OAuth implementation | Custom OAuth implementation: significant development overhead and security risk |
| **Docker Compose** | Container orchestration | Declarative service definitions; one-command startup for full stack; no need for a full Kubernetes setup at this scale | Kubernetes: extreme overhead for a 5-service local deployment; bare-metal process management: no networking isolation |

---

## 12. Deployment & Infrastructure

### 12.1 Docker Compose Service Topology

```yaml
Services and their relationships:

postgres  (no dependencies)
redis     (no dependencies)
backend   (depends_on: postgres, redis)
rag_service (no dependencies — uses Groq API externally)
frontend  (depends_on: backend)

Port mapping:
- postgres:  5433 (host) → 5432 (container)
- redis:     6380 (host) → 6379 (container)
- backend:   5000 (host) → 5000 (container)
- rag:       8000 (host) → 8000 (container)
- frontend:  3000 (host) → 3000 (container)
```

### 12.2 Backend Dockerfile Strategy

The backend uses a **single-stage Dockerfile** with a build-time optimization: `package.json` and `prisma/` are copied and installed **before** the source code. This creates a stable Docker layer cache — if only source code changes (not dependencies), Docker skips the `npm install` and `prisma generate` steps on rebuild, dramatically speeding up CI/CD cycles.

```dockerfile
FROM node:18-slim
RUN apt-get install -y openssl   # Prisma's query engine binary requires OpenSSL
COPY package*.json ./            # Layer 1: dependency manifest
COPY prisma ./prisma/            # Layer 2: schema (needed for generate)
RUN npm install                  # Layer 3: install deps (cached if no package change)
RUN npx prisma generate          # Layer 4: generate type-safe client
COPY . .                         # Layer 5: source code (rebuilt only when code changes)
CMD ["npm", "start"]
```

### 12.3 Environment Configuration

The system requires two `.env` files:
- `backend/.env` — Used when running the backend directly via `npm run dev` on the host machine.
- `.env` (root) — Used by Docker Compose to interpolate `${VARIABLE}` references in `docker-compose.yml` into container environment variables.

Both files are `.gitignored`. A `.env.example` file should be committed listing all required variable names with placeholder values for onboarding.

### 12.4 Database Initialization

On first startup, the database must be initialized:
```bash
cd backend
npx prisma migrate dev      # Creates schema tables from migrations
node seed.js                # Seeds admin, 3 doctors, 3 patients, appointments
```

### 12.5 Scaling Considerations

The current architecture is designed for a **single-node deployment** (one instance per service). To scale horizontally:

- **Backend scaling**: Multiple Express instances can run behind a load balancer. However, Socket.IO rooms are stored in-process memory — switching to Redis-backed Socket.IO adapter (`socket.io-redis`) would enable session sharing across instances.
- **Database scaling**: PostgreSQL read replicas can be introduced for read-heavy endpoints (search, slot lookup). Prisma supports read replica routing via the `datasources` configuration.
- **Redis scaling**: Redis Cluster or Redis Sentinel for high availability.
- **RAG scaling**: The ChromaDB in-process vector store would need to be replaced with a dedicated ChromaDB server or alternative like Weaviate for multi-instance RAG deployments.

---

## 13. Future Improvements

| Priority | Improvement | Rationale |
|---|---|---|
| High | **HTTPS / TLS termination** | All medical data (PII, diagnoses) must be encrypted in transit for HIPAA/regulatory compliance |
| High | **Redis `SCAN` + `UNLINK`** | Replace `KEYS` + `DEL` with non-blocking `SCAN` + `UNLINK` for production-safe cache invalidation |
| High | **Refresh token rotation** | Issue a new refresh token on each refresh to detect token theft (current implementation re-uses the same refresh token) |
| High | **Audit logging** | Log all medical record accesses, admin actions, and payment events to an immutable audit trail |
| Medium | **Video consultation** | Integrate WebRTC for in-platform video calls (paired with the existing Socket.IO signaling infrastructure) |
| Medium | **Push notifications** | Use Web Push API or FCM for appointment reminders, prescription alerts, and message notifications |
| Medium | **Multi-instance Socket.IO** | Add `socket.io-redis` adapter to support horizontal backend scaling without losing WebSocket sessions |
| Medium | **RAG streaming** | Stream LLM token generation back to the client via Server-Sent Events for perceived responsiveness |
| Medium | **Full-text search** | Add PostgreSQL `tsvector` full-text search indexes for doctor name and condition searches to replace LIKE queries |
| Low | **i18n / Localization** | Multi-language support for regional hospital deployments |
| Low | **Mobile app** | React Native companion app sharing the existing REST API |
| Low | **EHR integration** | HL7 FHIR API adapter for importing/exporting records to standard EHR systems |
