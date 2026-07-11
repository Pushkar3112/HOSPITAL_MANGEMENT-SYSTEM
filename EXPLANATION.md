# Hospital Management System - Comprehensive Architectural Design Document

This document provides an exhaustive, low-level explanation of the core architecture, database design, state workflows, security integrations, and communication protocols of the Hospital Management System (HMS).

---

## Table of Contents

1. [Service Topology & Decoupled Architecture](#1-service-topology--decoupled-architecture)
2. [Database Engine (PostgreSQL + Prisma ORM)](#2-database-engine-postgresql--prisma-orm)
3. [Google OAuth 2.0 Authentication Pipeline](#3-google-oauth-20-authentication-pipeline)
4. [Advanced AI RAG Chatbot (LangGraph + FastAPI)](#4-advanced-ai-rag-chatbot-langgraph--fastapi)
5. [Real-Time 1-to-1 Chat Architecture (Socket.IO)](#5-real-time-1-to-1-chat-architecture-socketio)
6. [Redis Caching & Cache Invalidation Strategy](#6-redis-caching--cache-invalidation-strategy)
7. [Prescription Templates & Medical History Generation](#7-prescription-templates--medical-history-generation)
8. [Frontend State & Interceptor Engine (React + Redux + Axios)](#8-frontend-state--interceptor-engine-react--redux--axios)
9. [Appointment Booking & Scheduling Slot Engine](#9-appointment-booking--scheduling-slot-engine)
10. [Docker Containerization Specs](#10-docker-containerization-specs)

---

## 1. Service Topology & Decoupled Architecture

The system is deployed using a containerized micro-topology that eliminates all reverse proxies (e.g., Nginx) to reduce networking overhead. Services expose endpoints directly on custom external ports:

```
                  ┌───────────────────────────────┐
                  │      React SPA Frontend       │
                  │         (Port 3000)           │
                  └───────────────────────────────┘
                     /                         \
           (REST & WebSockets)             (Direct URL Callback)
                   /                             \
                  ▼                               ▼
  ┌───────────────────────────────┐     ┌───────────────────────────────┐
  │      Express API Backend      │     │      Google OAuth Servers     │
  │         (Port 5000)           │     │       (Google Console)        │
  └───────────────────────────────┘     └───────────────────────────────┘
       /          |            \
 (Prisma SQL)  (Cache)     (HTTP JSON API)
     /            |              \
    ▼             ▼               ▼
┌──────────┐ ┌──────────┐ ┌───────────────────────────────┐
│PostgreSQL│ │  Redis   │ │      AI RAG Service           │
│(Port 5433)│ │(Port 6380)│ │         (Port 8000)           │
└──────────┘ └──────────┘ └───────────────────────────────┘
```

* **Frontend Client (Port 3000)**: Serves a React Single Page Application (SPA). Initiates HTTP requests directly to `http://localhost:5000/api` and connects to the WebSockets server on the same port.
* **Core API Backend (Port 5000)**: A Node.js and Express application acting as the transaction authority. It interacts with PostgreSQL, caches queries in Redis, and proxies user queries to the RAG service.
* **AI RAG Service (Port 8000)**: A Python FastAPI microservice that processes user health inquiries using local files and LLM completion models.
* **PostgreSQL (Port 5433)**: Persistent SQL database containing normalized relational schemas.
* **Redis (Port 6380)**: In-memory key-value store for session configurations and API caching.

---

## 2. Database Engine (PostgreSQL + Prisma ORM)

The database layers are fully managed via the Prisma ORM.

### 2.1 Prisma Entity-Relationship Schema

The relational schema maps entities with cascading deletions and type-safe properties:

```prisma
model User {
  id           String          @id @default(uuid())
  name         String
  email        String          @unique
  phone        String          @default("")
  passwordHash String          @default("")
  googleId     String?         @unique
  avatar       String?
  role         Role            @default(PATIENT)
  isActive     Boolean         @default(true)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  patientProfile PatientProfile?
  doctorProfile  DoctorProfile?
  
  patientAppointments  Appointment[]          @relation("PatientAppointments")
  patientRecords       MedicalRecord[]        @relation("PatientRecords")
  patientPrescriptions Prescription[]         @relation("PatientPrescriptions")
  patientInvoices      Invoice[]              @relation("PatientInvoices")

  doctorAppointments   Appointment[]          @relation("DoctorAppointments")
  doctorRecords        MedicalRecord[]        @relation("DoctorRecords")
  doctorPrescriptions  Prescription[]         @relation("DoctorPrescriptions")
  doctorInvoices       Invoice[]              @relation("DoctorInvoices")
  prescriptionTemplates PrescriptionTemplate[] @relation("DoctorTemplates")

  sentMessages     ChatMessage[] @relation("SentMessages")
  receivedMessages ChatMessage[] @relation("ReceivedMessages")
  patientSessions  ChatSession[] @relation("PatientSessions")
  doctorSessions   ChatSession[] @relation("DoctorSessions")
}
```

### 2.2 Relational Integrity Rules
* **1-to-1 Extensions**: `PatientProfile` and `DoctorProfile` maintain 1-to-1 relationships back to `User`. The user creation is managed in transactions: if profile setup fails, the user registration rolls back.
* **Cascading Delete**: `onDelete: Cascade` ensures that deleting a parent `User` record automatically purges their corresponding patient or doctor profiles.
* **Composite Constraints**: The `Appointment` model implements a unique constraint:
  `@@unique([doctorId, date, startTime, status])`
  This constraint is evaluated by the database to ensure double-bookings are impossible for overlapping slots.

---

## 3. Google OAuth 2.0 Authentication Pipeline

Authentication supports standard credentials and Google OAuth sign-in. The Google OAuth sequence is detailed below:

```
Client (3000)         Backend (5000)          Google API           Database
   │                         │                     │                  │
   │───1. Login Request─────▶│                     │                  │
   │   (Redirect to Google)  │───2. Auth Code─────▶│                  │
   │                         │   Request           │                  │
   │◀──3. OAuth Consent ─────│◀────────────────────│                  │
   │   Screen Dialog         │                     │                  │
   │                         │                     │                  │
   │───4. User Approves ────▶│                     │                  │
   │   Redirect w/ Auth Code │───5. Exchange Code─▶│                  │
   │                         │   for Token         │                  │
   │                         │◀──6. Access Token───│                  │
   │                         │   & User Profile    │                  │
   │                         │                     │                  │
   │                         │───7. Upsert User──────────────────────▶│
   │                         │◀──8. User Entity Saved ◀───────────────│
   │                         │                     │                  │
   │◀──9. Return JWT Tokens ─│                     │                  │
   │   with URL Redirect     │                     │                  │
```

### 3.1 Step-by-Step Callback Sequence
1. **Redirection**: Clicking "Sign in with Google" triggers `GET /api/auth/google`, initiating the Google passport strategy redirecting the browser to Google's consent dialog.
2. **Access Verification**: Upon approval, Google redirects the browser to `GET /api/auth/google/callback` with an authorization code.
3. **Token Exchange**: The backend exchanges the authorization code for an ID token and access token via secure HTTP POST.
4. **User Profile Mapping**: Passport parses profile metadata (avatar URL, email, name, Google ID) and executes `findFirst`/`upsert` transactions:
   - Checks if a user already exists with the matching `googleId`.
   - If not, queries by `email`. If found, updates the record by linking the `googleId` and saving the avatar.
   - If a new user, creates a `User` entity with `PATIENT` role and sets up an empty `PatientProfile`.
5. **Session Initiation**: The backend redirects the user's browser back to the frontend route:
   `http://localhost:3000/auth/google/callback?accessToken=<JWT>&refreshToken=<JWT>&role=PATIENT`
   The frontend callback page captures the URL queries, updates the Redux slices, saves tokens to `localStorage`, and navigates to the dashboard.

---

## 4. Advanced AI RAG Chatbot (LangGraph + FastAPI)

The symptom checker bot has been replaced by a hybrid Retrieval-Augmented Generation (RAG) chatbot orchestrated using a LangGraph workflow.

```
                           ┌────────────────────────┐
                           │      User Query        │
                           └────────────────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │   1. Classify Query Node  │
                         └───────────────────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │  2. Hybrid Retrieval Node │
                         │  (BM25 + ChromaDB Cosine) │
                         └───────────────────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │   3. RRF Rank Fusion &    │
                         │      Reranking Node       │
                         └───────────────────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │   4. Groq LLM Generator   │
                         │  (llama-3.1-8b-instant)   │
                         └───────────────────────────┘
                                       │
                                       ▼
                           ┌────────────────────────┐
                           │  Formatted Response    │
                           └────────────────────────┘
```

### 4.1 Node-by-Node Execution
1. **Query Classifier**: Evaluates the input query string to classify intent (`general_health`, `schedule`, `doctor_info`, or `medical`).
2. **Dense Semantic Retrieval**: Computes 384-dimensional dense vectors using SentenceTransformers (`all-MiniLM-L6-v2`) and executes a cosine-similarity search against a ChromaDB vector store.
3. **Sparse Keyword Match**: BM25 Okapi parses query tokens to query local document text chunks, scoring exact matches for medicine names, symptoms, and scheduling guidelines.
4. **RRF Rank Fusion**: Combines rank scores using Reciprocal Rank Fusion ($k=60$) to eliminate bias in individual retrieval runs:
   $$RRF(d) = \sum_{m \in M} \frac{1}{60 + r_m(d)}$$
5. **Lightweight Reranking**: Re-sorts top fused documents based on overlap density with query terms.
6. **Inference**: Sends the query, classified type, and context documents to Groq API using `llama-3.1-8b-instant` to generate the finalized answer.

---

## 5. Real-Time 1-to-1 Chat Architecture (Socket.IO)

Bi-directional chat between patients and doctors uses a WebSockets pipeline.

```
Patient Client               Express Backend               Doctor Client
      │                             │                             │
      │──1. send_message ──────────▶│                             │
      │   (receiverId, msg)         │                             │
      │                             │──2. Save to database        │
      │                             │     (Prisma create)         │
      │                             │                             │
      │◀──3. emit("new_message") ───│──4. emit("new_message") ───▶│
      │   (to sender room)          │     (to receiver room)      │
```

### 5.1 Connection Handshake & Authentication
1. **Handshake**: The client establishes a connection with `http://localhost:5000` via WS protocol, passing the JWT access token in the handshake authorization payload.
2. **Verification**: Backend WebSocket middleware decodes the JWT. If the token is invalid or expired, it terminates the connection immediately.
3. **Room Allocation**: On success, the socket registers the client and joins a private room named `user:${userId}`.

### 5.2 Transmission Flow
* **Sending**: Client emits a `send_message` payload containing `receiverId`, `message`, and optional `sessionId`.
* **Persistence**: Backend maps/creates a `ChatSession` between the doctor and patient, creates a `ChatMessage` record in PostgreSQL, and updates `lastMessageAt`.
* **Routing**: Broadcasts the message to the sender and receiver's rooms (`user:${userId}` and `user:${receiverId}`) using `io.to()`.
* **Read Receipts**: When a chat window is opened, the client emits `mark_read`. The backend updates all unread messages for that session where the current user is the receiver, setting `isRead: true`.

---

## 6. Redis Caching & Cache Invalidation Strategy

Redis serves as a high-speed caching layer to offload expensive relational queries from PostgreSQL.

### 6.1 Caching Configuration & TTL Settings
* **Patient & Doctor Profiles**: Cached with key `patient:profile:${userId}` or `doctor:profile:${userId}` (TTL: 300 seconds).
* **Appointments & Medical History**: Cached under keys containing filters (TTL: 120-300 seconds).
* **Doctor Search & Slots**: Cached under search parameters (TTL: 60-120 seconds).
* **Dashboard Stats**: Cached under `patient:dashboard:${userId}` or `doctor:dashboard:${userId}` (TTL: 120 seconds).

### 6.2 Cache Invalidation Workflow
To prevent stale reads, data mutations automatically flush associated cache records using pattern matching:

```javascript
// Example: Creating/updating an appointment triggers targeted flushes
await deleteCachePattern(`patient:appointments:${req.user.userId}:*`);
await deleteCachePattern(`doctor:appointments:${doctorId}:*`);
await deleteCachePattern(`doctor:slots:${doctorId}:*`);
await deleteCachePattern(`patient:dashboard:${req.user.userId}`);
await deleteCachePattern(`doctor:dashboard:${doctorId}`);
```

If Redis is unreachable, the system fails over to query the database directly.

---

## 7. Prescription Templates & Medical History Generation

Doctors can create pre-configured prescription templates and apply them.

```
       [Doctor selects Template]
                   │
                   ▼
     [Pre-fills Rx Form on UI]
                   │
                   ▼
       [Doctor clicks Prescribe]
                   │
                   ▼
     POST /api/doctors/prescriptions
                   │
                   ▼
      ┌─────────────────────────┐
      │     Backend Actions     │
      ├─────────────────────────┤
      │ 1. Create Prescription  │
      │ 2. Create Medical Record│
      │ 3. Link to Appointment  │
      └─────────────────────────┘
```

1. **Template Creation**: Doctors define a prescription template containing a medications array (name, dosage, frequency, duration) and instructions via the templates manager.
2. **Prescription Application**: During an appointment, the doctor selects a template. The UI pre-fills the diagnosis and medication forms.
3. **Database Transaction**:
   - Backend creates a `Prescription` record linked to the patient, doctor, and appointment.
   - Automatically creates a corresponding `MedicalRecord` in the patient's history, mapping the diagnoses, notes, and the prescription ID.
   - Updates the appointment status to `COMPLETED` and links the `prescriptionId` to the appointment.

---

## 8. Frontend State & Interceptor Engine (React + Redux + Axios)

### 8.1 Redux Store Slice Topology
* **Auth Slice**: Manages active user profiles, access tokens, and refresh tokens.
* **Patient & Doctor Slices**: Hold lists of appointments, clinical records, invoices, and profile configurations.
* **Admin Slice**: Manages dashboard statistics, user directories, and billing records.

### 8.2 Axios Interceptors & Silent Token Refresh

To avoid session expiration issues during API requests, Axios interceptors automate token renewal:

```
Axios Request ──▶ Inject Authorization Bearer Token
                     │
                     ▼
Response Recieved ──▶ OK (200) ──▶ Return Data
                  ──▶ Unauthorized (401)
                           │
                           ▼
                    Send Refresh Token to /api/auth/refresh
                           │
                           ├─▶ Success (200) ──▶ Store new Access Token ──▶ Retry Original Request
                           └─▶ Failure (401) ──▶ Clear localStorage ──────▶ Redirect to /login
```

This request lifecycle ensures the user session remains active as long as the refresh token remains valid (7 days).

---

## 9. Appointment Booking & Scheduling Slot Engine

The appointment slot generator computes available consultation times dynamically.

### 9.1 Scheduling Engine Workflow
1. **Input Parameters**: Receives the doctor profile (working start time, end time, duration, available days, and custom breaks), target date, and booked appointments.
2. **Day Validation**: If the target date's day of the week is not in the doctor's `availableDays`, it returns an empty array.
3. **Break Evaluation**: Checks if a slot falls within any of the configured breaks in `doctor.customBreaks` (e.g. lunch breaks).
4. **Overlap Verification**: Compares each time slot against existing appointments. A slot's `available` flag is set to `true` if the count of bookings is less than the doctor's `maxPatientsPerSlot`.
5. **Output**: Returns an array of slot objects:
   ```json
   {
     "startTime": "10:30",
     "endTime": "11:00",
     "available": true,
     "bookedCount": 0
   }
   ```

---

## 10. Docker Containerization Specs

The system configuration uses direct container linking without proxy overrides:

* **PostgreSQL (`hms-postgres`)**: Runs alpine PostgreSQL on port `5433`. Persists data using a named volume `postgres_data`.
* **Redis (`hms-redis`)**: Run alpine Redis on port `6380` for high-performance key-value caching.
* **Backend (`hms-backend`)**: Binds port `5000` to expose Express routes. Sets `DATABASE_URL` and `REDIS_URL` pointing to the internal Docker network.
* **RAG Service (`hms-rag`)**: Binds port `8000` to serve FastAPI queries.
* **Frontend (`hms-frontend`)**: Serves the compiled React production bundle directly on port `3000`.
