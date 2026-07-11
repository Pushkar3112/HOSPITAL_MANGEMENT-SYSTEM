# MedCare Hospital Management System - Complete System Architecture & Reference Manual

Welcome to the comprehensive implementation manual for the MedCare Hospital Management System (HMS). This document is designed to walk you through the system's software architecture, explaining not just **what** is implemented, but **why** it was designed this way, **how** the modules communicate, and **where** each logic block lives within the codebase.

---

## 1. System Overview & Direct Service Networking

MedCare HMS is built on a **fully-decoupled, service-oriented architecture**. It consists of five main physical services: the React Single Page Application (frontend client), the Express.js Application Server (backend business authority), the Python FastAPI Service (AI retrieval-augmented generation engine), and the PostgreSQL and Redis data storage layers.

```
+-------------------------------------------------------------------------+
|                              LOCAL MACHINE                              |
|                                                                         |
|  ┌──────────────────┐           REST API            ┌────────────────┐  |
|  │    React SPA     │◄─────────────────────────────▶│  Express API   │  |
|  │   (Port 3000)    │◄───────WebSockets Handshake──▶│  (Port 5000)   │  |
|  └──────────────────┘                               └────────────────┘  |
|                                                             │           |
|                                                     ┌───────┼───────┐   |
|                                                     │       │       │   |
|                                                     ▼       ▼       ▼   |
|                                                ┌────────┐┌──────┐┌──────┐|
|                                                │FastAPI ││Postg ││Redis │|
|                                                │  RAG   ││ -SQL ││Cache │|
|                                                │ (8000) ││(5433)││(6380)│|
|                                                └────────┘└──────┘└──────┘|
+-------------------------------------------------------------------------+
```

### Why We Removed Nginx:
In standard web deployments, Nginx acts as a reverse proxy, routing incoming port `80` traffic to either the backend or frontend containers based on path matching (e.g., `/api/*` goes to Express, while `/*` goes to React). 
However, in this local development and staging orchestration, Nginx introduces unnecessary networking latency, connection pooling complications, and CORS proxy routing overhead. 
By removing Nginx, we allow:
* **Direct Handshake**: React connects directly to Express on port `5000` using standard HTTP and WebSockets.
* **Simplified Port Mapping**: Developers can inspect, debug, and log queries from the FastAPI server directly on `localhost:8000` and database tables on `localhost:5433`.
* **Zero Reverse Proxy Failures**: Eliminates Nginx "502 Bad Gateway" crashes caused by upstream service restarts.

---

## 2. Directory Structure & File Map

The codebase is organized logically, separating concerns across client interfaces, transaction logic, database models, and artificial intelligence pipelines.

### 2.1 Backend Project Directory (`/backend`)
* **`src/index.js`**: The central bootstrapper. It configures the Express middleware chain, establishes database and Redis socket handles, mounts routers, and binds HTTP servers to port `5000`.
* **`src/config/database.js`**: Instantiates a singleton `PrismaClient` reference with a pre-configured connection pool to avoid resource exhaustion under concurrent request spikes.
* **`src/config/redis.js`**: Contains the connection logic for Redis and custom abstract caching functions like `getCache`, `setCache`, and `deleteCachePattern`.
* **`src/config/passport.js`**: Implements the passport plugin strategy for Google OAuth 2.0. Maps OAuth profile callbacks into structured User database writes.
* **`src/controllers/`**: House the core transaction handlers. They validate permissions, perform CRUD operations via Prisma, manage cache evictions, and format JSON responses.
* **`src/routes/`**: Register REST paths and bind them to their respective middleware chains (Authentication, Validation, Authorization).
* **`src/utils/socketManager.js`**: Configures the Socket.IO WebSockets event loops, handles room joins on handshake authentication, and routes real-time chat messages.

### 2.2 Frontend Project Directory (`/frontend`)
* **`src/App.jsx`**: Orchestrates client-side routing using React Router DOM. Wraps all routes in state provider containers.
* **`src/components/AppLayout.jsx`**: Provides a premium dark glassmorphic interface shell featuring sidebar navigation, user drop-downs, and layout wrapper controls.
* **`src/components/ProtectedRoute.jsx`**: Route-level security middleware. Gates page transitions based on active tokens and required user roles.
* **`src/services/api.js`**: Manages outgoing HTTP calls using Axios. Incorporates interceptor hooks to automatically inject headers and execute silent JWT token refreshes upon expiration.
* **`src/pages/`**: Contains the interactive page views (dashboards, chat, booking, prescriptions, user administration boards).

### 2.3 AI RAG Directory (`/rag_service`)
* **`main.py`**: The web server entry point using Uvicorn and FastAPI. Hosts `/chat` query endpoints and `/health` checkers.
* **`rag_pipeline.py`**: Builds the LangGraph workflow graph, implements dense and sparse search retrievers, and calculates Reciprocal Rank Fusion scores.
* **`documents/`**: A database of plain text (.txt) files containing hospital facts, scheduling rules, directories, and diabetes guides. These files are processed into vector chunks for search operations.

---

## 3. Environment Variables Checklist & Security Config

Because this repository is pushed to a public remote on GitHub, **never commit raw passwords, secrets, or API keys directly to files**. The system is built to ingest credentials dynamically at runtime using environment variables.

### 3.1 Key Variable Definitions
* **`DATABASE_URL`**: Instructs Prisma where to find the PostgreSQL database. Format:
  `postgresql://<username>:<password>@<host>:<port>/<dbname>?schema=public`
* **`REDIS_URL`**: Used by backend caching methods to resolve the Redis TCP listener.
* **`JWT_SECRET` & `JWT_REFRESH_SECRET`**: High-entropy strings used by JWT utility scripts to sign and verify session tokens.
* **`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`**: API keys issued by the Google Cloud Console to allow users to sign in using their Google account profiles.
* **`GROQ_API_KEY`**: The developer API key used to query the Llama 3.3 / Llama 3.1 models hosted on Groq Cloud.

### 3.2 Dynamic Interpolation in Docker
Our [docker-compose.yml](file:///c:/hospital%20managment/HOSPITAL_MANGEMENT-SYSTEM/docker-compose.yml) uses syntax like `GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}`. At startup, Docker Compose reads the `.env` file in the root directory and interpolates these keys into the container environment. This keeps secrets out of the codebase while making them available during runtime.

---

## 4. PostgreSQL Database Schema & Relational Integrity

The database is built on a highly-normalized relational structure mapped using Prisma ORM. 

```
                                 ┌───────────────┐
                                 │     User      │
                                 └───────────────┘
                                   /           \
                           1:1 (Pat)           1:1 (Doc)
                                 /               \
                                ▼                 ▼
                      ┌──────────────┐     ┌──────────────┐
                      │PatientProfile│     │DoctorProfile │
                      └──────────────┘     └──────────────┘
                             │                    │
                             │ 1:N                │ 1:N
                             ▼                    ▼
                      ┌──────────────────────────────────┐
                      │           Appointment            │
                      └──────────────────────────────────┘
                             │          │          │
                     1:1 (Rx)│    1:N   │1:N       │1:N
                             ▼    (Rec) ▼ (Inv)    ▼ (Chat)
                      ┌────────────┐┌─────────┐┌───────┐┌───────────┐
                      │Prescription││MedicalRec││Invoice││ChatMessage│
                      └────────────┘└─────────┘└───────┘└───────────┘
```

### 4.1 Key Tables & Columns
1. **User**: Stores login credentials (`passwordHash` using BCrypt), verified email index, account status flag (`isActive`), and role enum (`PATIENT`, `DOCTOR`, `ADMIN`).
2. **PatientProfile**: Holds clinical data. Leverages **PostgreSQL JSONB columns** to store nested objects (like address details and emergency contacts) to avoid slow relational joins.
3. **DoctorProfile**: Holds scheduling attributes (consultation fee, daily start/end times, duration, availability days array, and custom break periods).
4. **Appointment**: The key transactional bridge. Coordinates date, start/end time slots, visit type (Online/Offline), reason, fee, and payment tracking variables.
5. **Prescription**: Stores prescription records. Features a JSON array for medications, listing drug names, dosage instructions, frequency, and duration.
6. **MedicalRecord**: Stores diagnoses, tests ordered, test results (JSON), and notes.
7. **Invoice**: Tracks billing records, amount totals, line items, and payment mode (Razorpay, Wallet, Cash).
8. **ChatMessage**: Persists communications. Includes session identifier, sender/receiver references, and read markers.

---

## 5. Google OAuth 2.0 Sign-In Architecture

The Google sign-in integration is built on Passport's Google Strategy, allowing users to sign in without manually creating passwords.

```
  React Client (3000)          Express Backend (5000)         Google Auth Server
     │                                │                                │
     │──1. GET /api/auth/google ─────▶│                                │
     │   (Redirect User)              │──2. Auth Request ─────────────▶│
     │                                │                                │
     │                                │◀─3. Display Consent Screen─────│
     │                                │                                │
     │◀──4. Redirect w/ Auth Code ────│                                │
     │                                │──5. POST Auth Code ───────────▶│
     │                                │◀─6. Send User Profile Data ────│
     │                                │                                │
     │                                │──7. Database Operations:       │
     │                                │     a. Find user by googleId   │
     │                                │     b. If missing, find email  │
     │                                │     c. Create/Link profile     │
     │                                │                                │
     │◀──8. Redirect to Frontend ─────│                                │
     │   w/ JWT query parameters      │                                │
```

### 5.1 Step-by-Step Flow:
1. **Initiation**: The user clicks the Google Sign-in button. The React client redirects the browser to `GET http://localhost:5000/api/auth/google`.
2. **Passport Handshake**: Express handles the route and calls `passport.authenticate('google')`, redirecting the browser to Google's consent screen.
3. **User Approval**: The user signs in and grants permissions. Google redirects the user back to the backend callback URL: `http://localhost:5000/api/auth/google/callback?code=<authorization_code>`.
4. **Token Exchange**: The backend sends a request to Google's token endpoint to exchange the authorization code for an ID and access token.
5. **Database Resolution**: Passport extracts the email, name, Google ID, and profile picture:
   - Queries the database for a user matching the `googleId`.
   - If not found, checks by `email`. If a match is found, links the Google ID to the existing account.
   - If no match is found, creates a new `User` with `PATIENT` role and sets up an empty `PatientProfile`.
6. **Token Issuance & Redirect**: The server generates JWT access and refresh tokens and redirects the user's browser back to the React app:
   `http://localhost:3000/auth/google/callback?accessToken=<AccessJWT>&refreshToken=<RefreshJWT>&role=PATIENT`.
7. **Frontend Storage**: The React SPA captures the tokens from the URL parameters, stores them in `localStorage`, updates the Redux store, and redirects the user to the patient dashboard.

---

## 6. Advanced AI RAG Chatbot with LangGraph

To provide accurate answers to patient health inquiries, we built a hybrid RAG service using LangGraph and FastAPI.

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

### 6.1 Node Functions & State Machine:
* **Query Classifier Node**: Uses pattern matching on the query string to determine the inquiry category (`schedule`, `doctor_info`, `medical`, or `general`).
* **Dense Vector Search Node**: Converts the query into a 384-dimensional dense vector using the SentenceTransformers `all-MiniLM-L6-v2` model. It queries ChromaDB to find the top 6 context chunks with the highest cosine similarity.
* **Sparse Search Node**: Tokenizes the query and evaluates the document collection using the **BM25 Okapi** algorithm. This is crucial for matching exact terms like doctor names, timings, and prescription drugs.
* **Reciprocal Rank Fusion (RRF) Node**: Combines the rank scores from both retrievers to eliminate search bias:
  $$RRF\_Score(d) = \frac{1}{60 + Rank_{dense}(d)} + \frac{1}{60 + Rank_{sparse}(d)}$$
* **Reranking Node**: Re-evaluates the top 5 fused documents, scoring them based on exact token intersections with the user's query.
* **LLM Generator Node**: Feeds the reranked context and the user query to the Groq API using `llama-3.1-8b-instant` to generate a safe, accurate response.

---

## 7. Real-Time Chat & Socket.IO Architecture

The system features real-time messaging between doctors and patients using WebSockets.

### 7.1 Lifecycle of a Message:
1. **Connection**: The client initializes a socket connection to `http://localhost:5000` with their JWT access token in the auth header.
2. **Authentication**: The server decodes the token. On success, it registers the client and joins a private room named `user:${userId}`.
3. **Session Creation**: When a user opens a chat page, the client calls `getOrCreateSession` to find or create a `ChatSession` record linking the patient and doctor in the database.
4. **Message Transmission**:
   - The sender emits `send_message` with `receiverId`, `message`, and `sessionId`.
   - The backend validates the payload and writes a new `ChatMessage` record to PostgreSQL.
   - The server routes the message to the sender and receiver's rooms (`user:${senderId}` and `user:${receiverId}`) using `io.to()`.
   - The recipient's UI updates instantly upon receiving the message.
5. **Read Receipts**: When a user views an active session, the client emits `mark_read`. The backend updates the read status (`isRead: true`) in the database for all received messages in that session.

---

## 8. Redis Caching & Cache Invalidation Strategy

Redis is used to cache read-heavy endpoints and reduce database load.

### 8.1 Cache Key Design and TTL Configurations:
* **Profiles**: User profiles are cached under `patient:profile:${userId}` and `doctor:profile:${userId}` (TTL: 300 seconds).
* **Appointments**: User appointments are cached under `patient:appointments:${userId}:all` and `doctor:appointments:${doctorId}:all` (TTL: 120 seconds).
* **Search Results**: Cached under query signatures like `doctor-search:specializations` or `doctor-search:query:${queryString}` (TTL: 120 to 3600 seconds).
* **Available Slots**: Doctor availability slots are cached under `doctor:slots:${doctorId}:${date}` (TTL: 60 seconds).

### 8.2 Cache Invalidation on Mutations:
When data is updated (e.g. rescheduling an appointment), the cache must be cleared. We use pattern matching to find and delete related keys:
```javascript
// Clear all cached appointments for the patient
await deleteCachePattern(`patient:appointments:${req.user.userId}:*`);
// Clear slots cache for the doctor
await deleteCachePattern(`doctor:slots:${doctorId}:*`);
// Clear dashboard stats
await deleteCachePattern(`patient:dashboard:${req.user.userId}`);
```
If the Redis service goes offline, the backend catches the error and queries PostgreSQL directly.

---

## 9. Prescription Templates & Clinical Workflow

We built a workflow that allows doctors to save prescription templates and apply them during consultations.

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

### 9.1 Technical Sequence:
1. **Template Setup**: Doctors save frequently used medication regimens (names, dosages, durations, and notes) as a `PrescriptionTemplate`.
2. **Prescription Application**: During an appointment, the doctor selects a template. The UI pre-fills the prescription form.
3. **Submission**: The doctor reviews the data and clicks submit, calling `POST /api/doctors/prescriptions`.
4. **Database Operations**: The backend handles the request in a database transaction:
   - Creates a new `Prescription` record.
   - Automatically creates a corresponding `MedicalRecord` in the patient's history, mapping the diagnoses, notes, and the prescription ID.
   - Updates the appointment status to `COMPLETED` and links the `prescriptionId` to the appointment.

---

## 10. Frontend Axios Client & Auth Slices

### 10.1 Axios Response Interceptor (Token Refresh):
If a request fails with a `401 Unauthorized` status (indicating an expired access token), the Axios interceptor attempts to renew the session:
1. The client halts the request and retrieves the stored `refreshToken`.
2. Sends a `POST /api/auth/refresh` request containing the refresh token.
3. If successful, gets a new access token, updates `localStorage`, and retries the original failed request.
4. If renewal fails, clears `localStorage` and redirects the user to the login page.

---

## 11. Appointment Scheduling Slot Engine

The scheduling engine computes available time slots dynamically.

### 11.1 Algorithm Logic:
1. **Day Check**: Evaluates if the target date's day of the week is in the doctor's `availableDays` array (0 = Sunday, 1 = Monday, etc.).
2. **Slot Loop**: Iterates from `dailyStartTime` to `dailyEndTime` in increments of `slotDurationMinutes`.
3. **Break Filter**: Checks if the slot start time falls within any break period in the doctor's `customBreaks` array. If so, skips the slot.
4. **Booking Check**: Queries PostgreSQL to count active, non-cancelled appointments for the doctor on the target date.
5. **Availability Determination**: Sets the slot's `available` property to `true` if the count of bookings is less than `maxPatientsPerSlot`.
6. **Output**: Returns the generated array of slot options to the client.
