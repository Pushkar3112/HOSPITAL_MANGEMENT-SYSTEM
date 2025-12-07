# Hospital Management System (HMS) - Backend

A comprehensive Node.js/Express backend for a Hospital Management System with MongoDB, JWT authentication, Razorpay payments, and Google Gemini AI integration.

## Features

- **User Management**: Patient, Doctor, and Admin roles
- **Authentication**: JWT-based with refresh tokens
- **Doctor Availability**: Automatic slot generation based on working hours and breaks
- **Appointments**: Complete appointment booking and management system
- **Payments**: Razorpay integration with webhook support
- **AI Symptom Checker**: Google Gemini API integration
- **Prescriptions & Medical Records**: Full medical history tracking
- **Role-Based Access Control**: Secure endpoints with role-based middleware

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken, bcryptjs)
- **Payments**: Razorpay
- **AI**: Google Generative AI (Gemini)
- **Validation**: express-validator

## Project Structure

```
backend/
├── src/
│   ├── controllers/        # Route handlers
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── doctorController.js
│   │   ├── adminController.js
│   │   ├── appointmentController.js
│   │   ├── doctorSearchController.js
│   │   └── symptomCheckerController.js
│   ├── models/             # Mongoose schemas
│   │   ├── User.js
│   │   ├── PatientProfile.js
│   │   ├── DoctorProfile.js
│   │   ├── Appointment.js
│   │   ├── MedicalRecord.js
│   │   ├── Prescription.js
│   │   └── Invoice.js
│   ├── routes/             # API routes
│   │   ├── authRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── doctorSearchRoutes.js
│   │   └── symptomCheckerRoutes.js
│   ├── middlewares/        # Custom middlewares
│   │   ├── authMiddleware.js    # JWT verification & role-based auth
│   │   ├── errorHandler.js      # Global error handling
│   │   └── validation.js        # Input validation
│   ├── utils/              # Utility functions
│   │   ├── apiResponse.js       # Standardized API responses
│   │   ├── apiError.js          # Error handling class
│   │   ├── tokenUtils.js        # JWT token generation/verification
│   │   ├── passwordUtils.js     # Password hashing/comparison
│   │   ├── appointmentUtils.js  # Appointment slot calculations
│   │   ├── geminiService.js     # Gemini AI integration
│   │   └── razorpayService.js   # Razorpay payment handling
│   ├── config/             # Configuration
│   │   └── database.js      # MongoDB connection
│   └── index.js             # Express app setup
├── scripts/
│   └── seed.js              # Database seeding script
├── package.json
├── .env.example             # Environment variables template
└── .gitignore
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your details:

```bash
cp .env.example .env
```

Update `.env` with:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `RAZORPAY_KEY_ID`: Razorpay API key
- `RAZORPAY_KEY_SECRET`: Razorpay secret key
- `GEMINI_API_KEY`: Google Gemini API key

### 3. Start MongoDB

Ensure MongoDB is running locally or use MongoDB Atlas:

```bash
# Local MongoDB
mongod

# Or set MONGODB_URI in .env to your Atlas connection string
```

### 4. Seed Database (Optional)

Populate sample data:

```bash
npm run seed
```

This creates:

- 1 Admin account
- 3 Sample Doctors with working hours
- 3 Sample Patients

**Sample Credentials**:

- Admin: `admin@hms.com` / `admin123`
- Doctor: `rajesh@hms.com` / `doctor123`
- Patient: `john@example.com` / `patient123`

### 5. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Patient APIs

- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile
- `GET /api/patients/appointments` - List appointments
- `DELETE /api/patients/appointments/:id` - Cancel appointment
- `GET /api/patients/history` - Medical history
- `GET /api/patients/prescriptions` - List prescriptions
- `GET /api/patients/invoices` - List invoices

### Doctor APIs

- `GET /api/doctors/profile` - Get doctor profile
- `PUT /api/doctors/profile` - Update profile
- `GET /api/doctors/appointments` - List appointments
- `PATCH /api/doctors/appointments/:id/confirm` - Confirm appointment
- `PATCH /api/doctors/appointments/:id/complete` - Mark complete
- `GET /api/doctors/slots` - Get available slots
- `POST /api/doctors/prescriptions` - Create prescription
- `GET /api/doctors/prescriptions` - List prescriptions
- `POST /api/doctors/medical-records` - Create medical record

### Admin APIs

- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id/block` - Block user
- `PATCH /api/admin/users/:id/unblock` - Unblock user
- `PATCH /api/admin/doctors/:id/approve` - Approve doctor
- `DELETE /api/admin/doctors/:id/reject` - Reject doctor
- `GET /api/admin/appointments` - List all appointments
- `GET /api/admin/invoices` - List all invoices

### Public APIs

- `GET /api/doctor-search/search` - Search doctors
- `GET /api/doctor-search/:id` - Get doctor details
- `GET /api/doctor-search/:id/slots` - Get available slots

### Appointment & Payment

- `POST /api/appointments` - Create appointment
- `POST /api/appointments/verify-payment` - Verify Razorpay payment
- `POST /api/appointments/webhook` - Razorpay webhook

### Symptom Checker

- `POST /api/symptom-checker` - Analyze symptoms using Gemini AI

## Key Features Explained

### Appointment Slot Generation

Slots are automatically calculated based on:

- Doctor's available days (0-6 for Sun-Sat)
- Daily working hours (start and end times)
- Slot duration in minutes
- Custom breaks (lunch, etc.)
- Already booked appointments

### JWT Authentication

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Include token in Authorization header: `Bearer <token>`

### Role-Based Access

Three user roles:

- **PATIENT**: Can book appointments, view medical records
- **DOCTOR**: Can confirm appointments, create prescriptions (must be verified by admin)
- **ADMIN**: Full system access

### Payment Integration

Razorpay integration includes:

- Creating payment orders
- Verifying payment signatures
- Webhook handling for payment confirmation
- Automatic appointment confirmation on successful payment

### Gemini AI Symptom Checker

Provides:

- Symptom analysis and summary
- Possible general conditions
- Recommended doctor specialization
- Urgency level assessment
- Medical disclaimer

## Error Handling

All errors return standardized format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "data": null
}
```

## Development

### Project Setup Checklist

- [ ] MongoDB running and connected
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database seeded
- [ ] Server started on port 5000
- [ ] API endpoints accessible

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check MONGODB_URI in .env

2. **Razorpay Integration**

   - Add test keys from Razorpay dashboard
   - Use UPI for testing

3. **Gemini API**
   - Ensure API key is valid
   - Check Google AI Studio for API limits

## Security Notes

- Never commit .env files
- Use strong JWT secrets in production
- Validate all user inputs
- Use HTTPS in production
- Implement rate limiting
- Add CORS restrictions
- Hash all passwords with bcrypt

## Future Enhancements

- [ ] Email notifications
- [ ] SMS integration
- [ ] Video consultation links
- [ ] Payment refunds
- [ ] Advanced analytics
- [ ] Doctor ratings and reviews
- [ ] Prescription printing
- [ ] Lab integration

## License

MIT License
