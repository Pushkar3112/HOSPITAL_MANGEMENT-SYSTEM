# Hospital Management System (HMS) - PERN Stack with Nginx & Redis

A complete, production-ready Hospital Management System built with the PERN stack (PostgreSQL, Express, React, Node.js) with advanced features including JWT authentication, Razorpay payments, Google Gemini AI symptom checker, and role-based access control.

This project has been upgraded to use **PostgreSQL** with **Prisma ORM**, **Redis** for high-performance caching, and containerized using **Docker** and **Nginx** for reverse proxy load balancing.

## 🏥 System Overview

The HMS platform connects three user types:

- **Patients**: Search doctors, book appointments, manage medical records, use symptom checker
- **Doctors**: Manage availability, confirm appointments, create prescriptions, track patients
- **Admins**: System management, user approval, analytics, billing oversight

## ✨ Key Features

### For Patients

- ✅ User registration and secure login
- ✅ Comprehensive profile management
- ✅ Doctor search with filters (specialization, fees, hospital) - **Cached via Redis** for 30%+ latency improvement
- ✅ Real-time appointment slot availability
- ✅ Secure online appointment booking
- ✅ Razorpay payment integration
- ✅ Medical history tracking
- ✅ Prescription management
- ✅ Invoice and billing history
- ✅ **AI Symptom Checker** using Google Gemini

### For Doctors

- ✅ Registration with admin verification
- ✅ Professional profile management
- ✅ Flexible availability settings (days, hours, breaks)
- ✅ Appointment management (confirm, complete, cancel)
- ✅ Prescription creation and management
- ✅ Medical records documentation
- ✅ Patient history access
- ✅ Daily appointment dashboard

### For Admins

- ✅ System statistics and analytics
- ✅ User management (approve/reject/block)
- ✅ Doctor registration approval
- ✅ Appointment oversight
- ✅ Billing and invoice management
- ✅ System-wide reporting

### Technical Features

- ✅ **Authentication**: JWT with refresh tokens
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **Caching**: Redis integration for high-read endpoints
- ✅ **Infrastructure**: Fully Dockerized with Docker Compose
- ✅ **Proxy/Load Balancing**: Nginx reverse proxy Setup
- ✅ **Payments**: Razorpay UPI integration
- ✅ **AI**: Google Gemini for symptom analysis
- ✅ **State Management**: Redux Toolkit
- ✅ **Styling**: Tailwind CSS
- ✅ **Error Handling**: Centralized error handling
- ✅ **API Design**: RESTful with standardized responses
- ✅ **Security**: Bcrypt password hashing, role-based middleware

## 📁 Project Structure

```
hms/
├── backend/                          # Node.js/Express Backend
│   ├── src/
│   │   ├── controllers/             # Business logic (Prisma & Redis integration)
│   │   ├── routes/                  # API endpoints
│   │   ├── middlewares/             # Auth, validation, errors
│   │   ├── utils/                   # Helper functions
│   │   ├── config/                  # DB and Redis configs
│   │   └── index.js                 # Express app
│   ├── prisma/
│   │   └── schema.prisma            # PostgreSQL Schema
│   ├── Dockerfile
│   ├── package.json
│   ├── test-redis-latency.js        # Redis latency test script
│   └── .env.example
│
├── frontend/                         # React Frontend
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
│
├── nginx/
│   └── nginx.conf                    # Nginx Reverse Proxy Config
├── docker-compose.yml                # Full stack orchestration
└── README.md                         # This file
```

## 🚀 Quick Start (Docker - Recommended)

### Prerequisites

- Docker Desktop / Docker Engine
- Docker Compose

### Running the Full Stack

The entire application can be started using the provided `docker-compose.yml` file.

```bash
# Start Postgres, Redis, Backend, Frontend, and Nginx
docker-compose up --build -d

# Run Prisma Migrations to initialize the DB Schema
docker-compose exec backend npx prisma migrate dev --name init
```

The application will be accessible at:
- **Frontend**: `http://localhost:80` (Served via Nginx)
- **Backend API**: `http://localhost:80/api` (Proxied via Nginx to Backend)

### Test Redis Latency Improvement
You can run a benchmark script to see the difference between a cache miss and cache hit:
```bash
docker-compose exec backend node test-redis-latency.js
```

---

## 🚀 Local Development (Without Docker)

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (Local server v15+)
- Redis (Local server v7+)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment (Update DATABASE_URL and REDIS_URL in .env)
cp .env.example .env

# Run Migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend runs on `http://localhost:3000`

## � Environment Variables

### Backend (.env)

```env
# Database (Prisma)
DATABASE_URL="postgresql://postgres:password@localhost:5433/hms_db?schema=public"

# Redis
REDIS_URL="redis://localhost:6380"

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google Gemini
GEMINI_API_KEY=your_google_gemini_api_key

# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_API_URL=/api
```

## 🗄️ Database Models (PostgreSQL via Prisma)

1. **User** - Base user model for all roles
   - Name, Email, Phone, Password Hash
   - Role (PATIENT, DOCTOR, ADMIN)

2. **PatientProfile** - Extended patient information
   - Demographics, Medical history, allergies, chronic conditions

3. **DoctorProfile** - Doctor credentials and availability
   - Specialization, qualifications, experience, availability schedule

4. **Appointment** - Booking records
   - Status tracking (PENDING, CONFIRMED, COMPLETED, CANCELLED)
   - Razorpay Payment information linking

5. **Prescription** - Doctor-issued medications
   - JSON array for Medications with dosage, frequency

6. **MedicalRecord** - Clinical documentation
   - Diagnoses, JSON array for test results

7. **Invoice** - Billing records

## 🔐 Security & Optimization

- **Password Security**: Bcrypt hashing with salt rounds
- **Token Security**: JWT with short expiry, refresh token rotation
- **Input Validation**: Express-validator on all endpoints
- **Role-Based Access**: Middleware-enforced authorization
- **Performance**: Redis caching applied on Doctor Search endpoints to reduce PG load.
- **SQL Injection Protection**: Prisma ORM enforces secure parameterized queries.
- **Infrastructure Scaling**: Nginx setup prepared to scale backend instances via load balancing.

**Built with ❤️ for Hospital Management Systems**
