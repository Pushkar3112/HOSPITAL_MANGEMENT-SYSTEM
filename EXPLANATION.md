# MedCare Hospital Management System - Complete Architectural Blueprint & Implementation Manual

This manual provides an exhaustive, production-grade guide to the architecture, services, database constraints, state machines, protocols, and deployment structure of the MedCare Hospital Management System (HMS).

---

## 1. Directory Structure & File-by-File Blueprint

The repository is structured as a decoupled monorepo containing three core application folders and infrastructure configurations.

```text
HOSPITAL_MANGEMENT-SYSTEM/
│
├── docker-compose.yml          # Top-level Docker Orchestration (5 services)
├── architecture.md             # High-level system architecture blueprint
├── EXPLANATION.md              # ⭐ THIS FILE (Ultimate Deep-Dive System Manual)
│
├── backend/                    # Core Transactional REST & WS Backend (Node/Express)
│   ├── Dockerfile              # Backend container build specification
│   ├── package.json            # Node.js manifest and dependency locks
│   ├── seed.js                 # Prisma Database Seeding Script (admin, doctors, patients)
│   ├── .env                    # Environment variables configuration (ignored by git)
│   │
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (Data models, relations, enums)
│   │   └── migrations/         # Auto-generated SQL migration files
│   │
│   └── src/
│       ├── index.js            # App Bootstrapper & Middleware orchestrator
│       ├── config/
│       │   ├── database.js     # Prisma Client initialization & connection pool
│       │   ├── redis.js        # Redis client wrapper & caching utilities
│       │   └── passport.js     # Passport setup with Google OAuth 2.0 Strategy
│       │
│       ├── middlewares/
│       │   ├── authMiddleware.js    # Access control & JWT verification gates
│       │   ├── errorHandler.js      # Global HTTP error capture and formatting
│       │   └── validation.js        # Request parameter validation chains
│       │
│       ├── controllers/
│       │   ├── authController.js         # Login, Register, Google OAuth, Refresh, Logout
│       │   ├── patientController.js      # Profiles, appointments, history, prescriptions
│       │   ├── doctorController.js       # Profile, appointments, slots, template presets
│       │   ├── adminController.js        # Dashboard statistics, user directory, verification
│       │   ├── appointmentController.js  # Scheduling validation, payments, Razorpay webhooks
│       │   ├── doctorSearchController.js # Specialized search queries w/ Redis caching
│       │   ├── chatController.js         # Chat sessions & history retrievals
│       │   └── ragChatController.js      # AI RAG pipeline client proxies
│       │
│       ├── routes/
│       │   ├── authRoutes.js             # Credentials and OAuth callback routes
│       │   ├── patientRoutes.js          # Patient endpoints
│       │   ├── doctorRoutes.js           # Doctor endpoints
│       │   ├── adminRoutes.js            # System administration endpoints
│       │   ├── doctorSearchRoutes.js     # Search and slots lookup routes
│       │   ├── appointmentRoutes.js      # Booking and payment verification routes
│       │   ├── chatRoutes.js             # Real-time WebSockets metadata routes
│       │   └── ragChatRoutes.js          # AI RAG endpoints
│       │
│       └── utils/
│           ├── apiError.js          # Extensible custom error class
│           ├── apiResponse.js       # JSON response standardization helper
│           ├── passwordUtils.js     # BCrypt helper functions
│           ├── tokenUtils.js        # JWT generation and validation helper
│           ├── appointmentUtils.js  # Slot allocation algorithm
│           └── socketManager.js     # WebSockets room configuration & events
│
├── frontend/                   # React Single Page Application (Client)
│   ├── Dockerfile              # Multi-stage production build configuration
│   ├── package.json            # NPM dependencies configuration
│   └── src/
│       ├── index.js            # React mount point
│       ├── index.css           # Styling design tokens & custom layouts
│       ├── App.jsx             # Top-level Routing and Provider wrapping
│       │
│       ├── components/
│       │   ├── AppLayout.jsx        # Glassmorphic navbar & responsive sidebar
│       │   ├── ProtectedRoute.jsx   # Role-based route guard
│       │   └── ToastContainer.jsx   # Custom status notification system
│       │
│       ├── features/
│       │   ├── store.js             # Redux Store config
│       │   └── authSlice.js         # Auth state slice
│       │
│       ├── services/
│       │   └── api.js               # Axios Client w/ refresh token interceptors
│       │
│       └── pages/
│           ├── LandingPage.jsx      # Portal entry point
│           ├── LoginPage.jsx        # Credentials login panel
│           ├── RegisterPage.jsx     # Registration form (Patient/Doctor selection)
│           ├── PatientDashboard.jsx # Quick stats & next appointment card
│           ├── AppointmentBooking.jsx # Doctor booking page
│           ├── DoctorAppointments.jsx # Doctor management board
│           ├── DoctorAvailability.jsx # Schedule configuration dashboard
│           ├── DoctorChatPage.jsx   # Doctor's real-time messaging panel
│           ├── PatientDoctorChat.jsx # Patient's real-time messaging panel
│           └── RAGChatbot.jsx       # AI Assistant interactive chat
│
└── rag_service/                # Python FastAPI AI RAG Service
    ├── Dockerfile              # Python Docker runtime specification
    ├── requirements.txt        # PIP dependencies manifest
    ├── main.py                 # FastAPI Web Server entry point
    ├── rag_pipeline.py         # LangGraph workflow, Hybrid Search & RRF engine
    └── documents/              # Custom medical guides & directories (ChromaDB source)
        ├── diabetes_guide.txt
        ├── doctors_directory.txt
        ├── general_health.txt
        └── hospital_info.txt
```

---

## 2. Environment Variables Specification

The system uses environment configurations for security and customization.

| Environment Variable | Service | Default Value | Purpose | Impact of Absence |
|---|---|---|---|---|
| `PORT` | Backend | `5000` | Port backend runs on | Defaults to `5000` |
| `DATABASE_URL` | Backend | None | PostgreSQL connection URI | App crashes during boot |
| `REDIS_URL` | Backend | None | Redis connection URI | Caching disabled, fails over |
| `FRONTEND_URL` | Backend | `http://localhost:3000` | CORS permitted origin | CORS blocks API requests |
| `JWT_SECRET` | Backend | None | Access token signature key | Token generation fails |
| `JWT_REFRESH_SECRET` | Backend | None | Refresh token signature key | Session refreshes fail |
| `GOOGLE_CLIENT_ID` | Backend | None | Google Cloud console Client ID | Google OAuth disabled |
| `GOOGLE_CLIENT_SECRET` | Backend | None | Google Cloud Secret | OAuth exchange crashes |
| `GOOGLE_CALLBACK_URL` | Backend | None | OAuth redirect target | Callback fails |
| `GROQ_API_KEY` | Backend/RAG | None | API Key for Groq LLM | Chatbot returns 500 error |
| `RAG_SERVICE_URL` | Backend | `http://localhost:8000` | RAG service backend endpoint | RAG chatbot unreachable |

---

## 3. Database Engine & Prisma Schema Models

Prisma ORM provides type safety and SQL translation for PostgreSQL.

### 3.1 Schema Declarations & Relations

```prisma
enum Role {
  PATIENT
  DOCTOR
  ADMIN
}

enum VisitType {
  ONLINE
  OFFLINE
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  phone        String   @default("")
  passwordHash String   @default("")
  googleId     String?  @unique
  avatar       String?
  role         Role     @default(PATIENT)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  patientProfile PatientProfile?
  doctorProfile  DoctorProfile?
  // User relations
  prescriptionTemplates PrescriptionTemplate[] @relation("DoctorTemplates")
  sentMessages     ChatMessage[] @relation("SentMessages")
  receivedMessages ChatMessage[] @relation("ReceivedMessages")
  patientSessions  ChatSession[] @relation("PatientSessions")
  doctorSessions   ChatSession[] @relation("DoctorSessions")
}

model PatientProfile {
  id                String      @id @default(uuid())
  userId            String      @unique
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  gender            Gender?
  dateOfBirth       DateTime?
  bloodGroup        BloodGroup?
  address           Json?
  emergencyContact  Json?
  allergies         String[]
  chronicConditions String[]
}

model DoctorProfile {
  id                  String   @id @default(uuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialization      String
  qualifications      String[]
  yearsOfExperience   Int
  hospitalName        String
  consultationFee     Float
  availableDays       Int[]    @default([1, 2, 3, 4, 5])
  dailyStartTime      String   @default("09:00")
  dailyEndTime        String   @default("17:00")
  slotDurationMinutes Int      @default(30)
  customBreaks        Json[]
  isVerified          Boolean  @default(false)
  maxPatientsPerSlot  Int      @default(1)
  rating              Float    @default(0)
}
```

### 3.2 Key Relational Operations
* **Prisma Nested Queries**: The system avoids mixing `select` and `include` in Prisma queries. To get a doctor profile alongside user metadata:
  ```javascript
  const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          doctorProfile: {
              select: { specialization: true, hospitalName: true }
          }
      }
  });
  ```
* **Transaction Safety**: All profile creations are executed inside transaction blocks. If any operation within the block throws an error, the database state is rolled back:
  ```javascript
  const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: userData });
      await tx.patientProfile.create({ data: { userId: newUser.id } });
      return newUser;
  });
  ```

---

## 4. Google OAuth 2.0 Integration Mechanics

Authentication supports credentials and Google OAuth sign-in.

### 4.1 Passport configuration (`config/passport.js`)

```javascript
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;
        const avatar = profile.photos?.[0]?.value;

        let user = await prisma.user.findFirst({ where: { googleId } });
        if (!user) {
            user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId, avatar },
                });
            } else {
                user = await prisma.$transaction(async (tx) => {
                    const newUser = await tx.user.create({
                        data: { name, email, googleId, avatar, role: 'PATIENT' },
                    });
                    await tx.patientProfile.create({ data: { userId: newUser.id } });
                    return newUser;
                });
            }
        }
        return done(null, user);
    } catch (error) { return done(error, null); }
}));
```

### 4.2 OAuth Lifecycle & Redirect Sequence

```
[Google Sign In] (Frontend UI)
       │
       ▼
Redirect to: GET http://localhost:5000/api/auth/google
       │
       ▼
User Authenticates on Google Accounts Page
       │
       ▼
Google Redirects w/ Auth Code to Callback URL:
GET http://localhost:5000/api/auth/google/callback
       │
       ▼
Backend Exchanges Auth Code for Google Access Tokens
       │
       ▼
Backend creates or updates User profile in database
       │
       ▼
Backend Redirects client to Frontend callback URL:
http://localhost:3000/auth/google/callback?accessToken=<TOKEN>&refreshToken=<TOKEN>&role=PATIENT
```

---

## 5. LangGraph RAG Chatbot Microservice

The AI assistant uses a LangGraph workflow that combines dense semantic search and sparse keyword retrieval.

### 5.1 System Architecture

```
                    ┌──────────────────────┐
                    │      User Query      │
                    └──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Query Classifier    │
                    │  Node                │
                    └──────────────────────┘
                               │
                               ▼
              ┌──────────────────────────────────┐
              │      Hybrid Retrieval Node       │
              │                                  │
              │  ┌──────────────┐ ┌────────────┐ │
              │  │  ChromaDB    │ │ BM25 Okapi │ │
              │  │  Dense Match │ │ Sparse    │ │
              │  └──────────────┘ └────────────┘ │
              └──────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Reciprocal Rank     │
                    │  Fusion (RRF) Node   │
                    └──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Overlap Reranking   │
                    │  Node                │
                    └──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   LLM Generator      │
                    │ (Llama-3.1-8b-Inst)  │
                    └──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Response JSON Out   │
                    └──────────────────────┘
```

### 5.2 Retrieval & Fusion Algorithm

To ensure accurate medical context retrieval, candidate documents are fetched using two search models and fused using RRF.

1. **Dense Vector Search**: The query is converted into an embedding using the `SentenceTransformer` model. ChromaDB performs a cosine similarity lookup to find the top $N$ closest context chunks.
2. **Sparse Term Search**: The document collections are parsed using token indices. BM25 scores text matches for specific keywords (e.g. drug names, dosages).
3. **RRF Rank Fusion**: Scores are combined using rank positions:
   $$RRF\_Score(d) = \frac{1}{60 + Rank_{dense}(d)} + \frac{1}{60 + Rank_{sparse}(d)}$$
4. **Overlap Reranker**: Results are reranked based on the density of matching query tokens.
5. **Generation**: The context is injected into the LLM system prompt for answer generation.

### 5.3 LangGraph State Python Implementation

```python
class AgentState(TypedDict):
    query: str
    query_type: str
    documents: List[Document]
    reranked_results: List[Document]
    answer: str
    sources: List[str]
    confidence: float

def classify_query(state: AgentState) -> dict:
    q = state["query"].lower()
    if any(k in q for k in ["timing", "schedule", "open", "hour", "sunday"]):
        return {"query_type": "schedule"}
    if any(k in q for k in ["dr", "doctor", "specialist", "fee", "consult"]):
        return {"query_type": "doctor_info"}
    return {"query_type": "medical"}

def retrieve_documents(state: AgentState) -> dict:
    dense_docs = chroma_vectorstore.similarity_search(state["query"], k=6)
    sparse_docs = bm25_searcher.search(state["query"], k=6)
    
    # RRF rank fusion formula
    fused_scores = {}
    for rank, doc in enumerate(dense_docs):
        fused_scores[doc.page_content] = fused_scores.get(doc.page_content, 0) + (1.0 / (60 + rank))
    for rank, doc in enumerate(sparse_docs):
        fused_scores[doc.page_content] = fused_scores.get(doc.page_content, 0) + (1.0 / (60 + rank))
        
    sorted_docs = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)[:5]
    # Map back to Document objects
    # ...
    return {"documents": mapped_docs}

# LangGraph builder configuration
workflow = StateGraph(AgentState)
workflow.add_node("classify", classify_query)
workflow.add_node("retrieve", retrieve_documents)
workflow.add_node("rerank", rerank_results)
workflow.add_node("generate", generate_answer)

workflow.set_entry_point("classify")
workflow.add_edge("classify", "retrieve")
workflow.add_edge("retrieve", "rerank")
workflow.add_edge("rerank", "generate")
workflow.add_edge("generate", END)
app = workflow.compile()
```

---

## 6. Real-Time Chat & Socket.IO Architecture

Messaging utilizes WebSockets to facilitate real-time chat between users.

### 6.1 Event Lifecycle and Event Types

```
Client (Patient)             Server (Socket.IO)              Client (Doctor)
   │                                │                              │
   │───1. Emit: send_message ──────▶│                              │
   │   (sessionId, receiverId)      │                              │
   │                                │───2. Persist Message to DB   │
   │                                │      (Prisma ChatMessage)    │
   │                                │                              │
   │◀──3. Emit: new_message ────────│───4. Emit: new_message ─────▶│
   │   (To room: user:${senderId})  │      (To room: user:${recId})│
```

* **Authentication Handshake**: Connection requests must supply the JWT access token in the auth payload.
* **Message Delivery**: Messages are broadcasted to the sender and receiver's rooms (`user:${userId}`).
* **Read Receipts**: The client emits `mark_read` on session focus, which updates the messages state to `isRead = true`.

---

## 7. Redis Cache Layer & Cache Eviction Rules

Redis caches read-heavy queries to optimize performance and reduce database load.

### 7.1 Cache Keys & Expiration Schema

```text
patient:profile:${userId}       -> Stores patient profile (TTL: 300s)
doctor:profile:${userId}        -> Stores doctor profile (TTL: 300s)
doctor:slots:${doctorId}:${date}-> Stores doctor availability slots (TTL: 60s)
patient:appointments:${userId}  -> Stores patient appointments list (TTL: 120s)
doctor:appointments:${doctorId} -> Stores doctor appointments list (TTL: 120s)
```

### 7.2 Invalidation Implementation (`config/redis.js`)

```javascript
const deleteCachePattern = async (pattern) => {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (err) {
        console.error('Redis deleteCachePattern error:', err.message);
    }
};
```

---

## 8. Frontend Store & API Client Interceptors

### 8.1 Axios Interceptor & Silent Refresh Config

```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const res = await axios.post("http://localhost:5000/api/auth/refresh", { refreshToken });
        const { accessToken } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 9. Appointment Booking & Slots Allocation Engine

The scheduling engine computes available time slots for verified and active doctor profiles.

```
       [Slot Generation Flow]
                 │
                 ▼
     [Parse daily start/end times]
                 │
                 ▼
       [Iterate slot durations]
                 │
                 ▼
      [Filter custom break times]
                 │
                 ▼
     [Check booked appointments]
                 │
                 ▼
   [Add available: true/false properties]
```

### 9.1 Slot Calculator (`utils/appointmentUtils.js`)

```javascript
const generateAvailableSlots = (doctor, dateStr, existingAppointments) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    if (!doctor.availableDays.includes(dayOfWeek)) return [];

    const slots = [];
    const [startH, startM] = doctor.dailyStartTime.split(':').map(Number);
    const [endH, endM] = doctor.dailyEndTime.split(':').map(Number);
    const duration = doctor.slotDurationMinutes || 30;

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + duration <= end) {
        const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
        const slotEnd = `${String(Math.floor((current + duration) / 60)).padStart(2, '0')}:${String((current + duration) % 60).padStart(2, '0')}`;

        const inBreak = doctor.customBreaks?.some(brk => {
            const brkStart = brk.startTime.split(':').map(Number);
            const brkEnd = brk.endTime.split(':').map(Number);
            return current >= (brkStart[0]*60 + brkStart[1]) && current < (brkEnd[0]*60 + brkEnd[1]);
        });

        if (!inBreak) {
            const booked = existingAppointments.filter(apt => {
                const aptDate = new Date(apt.date).toISOString().split('T')[0];
                return aptDate === dateStr && apt.startTime === slotStart && !['CANCELLED', 'NO_SHOW'].includes(apt.status);
            });

            slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                available: booked.length < (doctor.maxPatientsPerSlot || 1),
                isAvailable: booked.length < (doctor.maxPatientsPerSlot || 1),
                bookedCount: booked.length,
                maxSlots: doctor.maxPatientsPerSlot || 1
            });
        }
        current += duration;
    }
    return slots;
};
```

---

## 10. Docker Compose Orchestration Specification

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: hms-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: hms_db
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: hms-redis
    ports:
      - "6380:6379"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hms-backend
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/hms_db?schema=public
      - REDIS_URL=redis://redis:6379
      - PORT=5000
      - FRONTEND_URL=http://localhost:3000
      - JWT_SECRET=super_secret_jwt_key_hms_2024
      - JWT_REFRESH_SECRET=super_secret_refresh_key_hms_2024
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
      - GROQ_API_KEY=${GROQ_API_KEY}
      - RAG_SERVICE_URL=http://rag_service:8000
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    ports:
      - "5000:5000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: hms-frontend
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    depends_on:
      - backend
    restart: unless-stopped
    ports:
      - "3000:3000"

  rag_service:
    build:
      context: ./rag_service
      dockerfile: Dockerfile
    container_name: hms-rag
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
    ports:
      - "8000:8000"
    restart: unless-stopped

volumes:
  postgres_data:
```
