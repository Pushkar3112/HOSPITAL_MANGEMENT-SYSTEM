# Hospital Management System (HMS) - MERN Stack

A complete, production-ready Hospital Management System built with the MERN stack (MongoDB, Express, React, Node.js) with advanced features including JWT authentication, Razorpay payments, Google Gemini AI symptom checker, and role-based access control.

## 🏥 System Overview

The HMS platform connects three user types:

- **Patients**: Search doctors, book appointments, manage medical records, use symptom checker
- **Doctors**: Manage availability, confirm appointments, create prescriptions, track patients
- **Admins**: System management, user approval, analytics, billing oversight

## ✨ Key Features

### For Patients

- ✅ User registration and secure login
- ✅ Comprehensive profile management
- ✅ Doctor search with filters (specialization, fees, hospital)
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
- ✅ **Database**: MongoDB with optimized indexes
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
│   │   ├── controllers/             # Business logic
│   │   ├── models/                  # MongoDB schemas
│   │   ├── routes/                  # API endpoints
│   │   ├── middlewares/             # Auth, validation, errors
│   │   ├── utils/                   # Helper functions
│   │   ├── config/                  # Database config
│   │   └── index.js                 # Express app
│   ├── scripts/
│   │   └── seed.js                  # Sample data
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                         # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── features/                # Redux slices
│   │   ├── components/              # Reusable components
│   │   ├── pages/                   # Page components
│   │   ├── services/                # API calls
│   │   ├── hooks/                   # Custom hooks
│   │   ├── utils/                   # Utility functions
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── README.md
│
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if local)
mongod

# Seed database (optional)
npm run seed

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

## 🔑 Demo Credentials

### Admin Account

- Email: `admin@hms.com`
- Password: `admin123`

### Doctor Account (Verified)

- Email: `rajesh@hms.com`
- Password: `doctor123`
- Specialization: Cardiology
- Fee: ₹500

### Patient Account

- Email: `john@example.com`
- Password: `patient123`

## 📋 Environment Variables

### Backend (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hms_db

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
REACT_APP_API_URL=http://localhost:5000/api
```

## 🗄️ Database Models

### Core Models

1. **User** - Base user model for all roles

   - Name, Email, Phone, Password Hash
   - Role (PATIENT, DOCTOR, ADMIN)
   - Active status

2. **PatientProfile** - Extended patient information

   - Medical history, allergies, chronic conditions
   - Blood group, emergency contact
   - Demographics (gender, DOB)

3. **DoctorProfile** - Doctor credentials and availability

   - Specialization, qualifications, experience
   - Consultation fee, hospital
   - Working hours, available days
   - Custom breaks, verification status

4. **Appointment** - Booking records

   - Patient & Doctor references
   - Date, time, duration
   - Status tracking (PENDING, CONFIRMED, COMPLETED, CANCELLED)
   - Payment information (Razorpay IDs)

5. **Prescription** - Doctor-issued medications

   - Medications with dosage, frequency
   - Lifestyle advice, follow-up dates
   - Linked to appointments and patients

6. **MedicalRecord** - Clinical documentation

   - Diagnoses, test orders, results
   - Attachments, notes
   - Doctor and appointment references

7. **Invoice** - Billing records
   - Amount, payment status
   - Razorpay transaction details
   - Itemized billing

## 🔐 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **Token Security**: JWT with short expiry, refresh token rotation
- **Input Validation**: Express-validator on all endpoints
- **Role-Based Access**: Middleware-enforced authorization
- **CORS**: Origin-restricted API access
- **Error Handling**: Centralized error handling, safe error messages
- **SQL Injection Protection**: Mongoose prevents NoSQL injection
- **XSS Protection**: Input sanitization

## 📊 API Documentation

### Authentication Endpoints

```
POST /api/auth/register          - Register new user
POST /api/auth/login             - User login
POST /api/auth/refresh           - Refresh access token
POST /api/auth/logout            - User logout
```

### Patient Endpoints

```
GET  /api/patients/profile       - Get patient profile
PUT  /api/patients/profile       - Update profile
GET  /api/patients/appointments  - List appointments
DELETE /api/patients/appointments/:id - Cancel appointment
GET  /api/patients/history       - Medical history
GET  /api/patients/prescriptions - List prescriptions
GET  /api/patients/invoices      - List invoices
```

### Doctor Endpoints

```
GET  /api/doctors/profile        - Get doctor profile
PUT  /api/doctors/profile        - Update profile
GET  /api/doctors/appointments   - List appointments
PATCH /api/doctors/appointments/:id/confirm - Confirm appointment
PATCH /api/doctors/appointments/:id/complete - Complete appointment
GET  /api/doctors/slots          - Get available slots
POST /api/doctors/prescriptions  - Create prescription
GET  /api/doctors/prescriptions  - List prescriptions
POST /api/doctors/medical-records - Create medical record
```

### Admin Endpoints

```
GET  /api/admin/stats            - Dashboard statistics
GET  /api/admin/users            - List users
PATCH /api/admin/users/:id/block - Block user
PATCH /api/admin/doctors/:id/approve - Approve doctor
DELETE /api/admin/doctors/:id/reject - Reject doctor
GET  /api/admin/appointments     - List appointments
GET  /api/admin/invoices         - List invoices
```

### Public Endpoints

```
GET  /api/doctor-search/search   - Search doctors
GET  /api/doctor-search/:id      - Doctor details
GET  /api/doctor-search/:id/slots - Available slots
POST /api/appointments           - Create appointment
POST /api/appointments/verify-payment - Verify payment
POST /api/symptom-checker        - Analyze symptoms
```

## 🎯 Appointment Booking Flow

1. Patient searches for doctors
2. Patient selects date and views available slots
3. Backend calculates slots based on:
   - Doctor's available days
   - Working hours (9 AM - 5 PM)
   - Slot duration (30 mins)
   - Custom breaks
   - Already booked appointments
4. Patient selects slot and confirms booking
5. Backend creates PENDING appointment
6. Razorpay payment order generated
7. Patient completes payment
8. Payment verified via webhook
9. Appointment status changed to CONFIRMED

## 🤖 AI Symptom Checker

Uses Google Gemini API to:

- Analyze patient-described symptoms
- Suggest possible general conditions
- Recommend appropriate doctor specialization
- Assess urgency level (ROUTINE, SOON, URGENT)
- Provide medical disclaimer

```
Example Input:
"I have a severe headache, fever, and body aches"

Example Output:
{
  "summary": "Symptoms suggest possible viral infection",
  "possibleCauses": ["Common Cold", "Flu", "Migraine"],
  "recommendedSpecialization": "General Practitioner",
  "urgencyLevel": "SOON",
  "disclaimer": "This is NOT a medical diagnosis..."
}
```

## 💳 Payment Integration

**Razorpay Integration** includes:

- Order creation with payment amount
- Signature verification for security
- Webhook handling for payment confirmation
- Automatic appointment confirmation on success
- Refund handling for cancellations

## 🛠️ Development

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production

```bash
# Backend: Already optimized for production

# Frontend:
cd frontend
npm run build
```

## 📈 Scaling Considerations

- **Database Indexing**: Added indexes on frequently queried fields
- **API Rate Limiting**: Implement at production deployment
- **Caching**: Consider Redis for session management
- **CDN**: Deploy frontend on CDN
- **Load Balancing**: Use reverse proxy (Nginx)
- **Database Replication**: MongoDB Atlas clusters
- **Monitoring**: Add monitoring tools (NewRelic, DataDog)

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**

```
Solution: Ensure MongoDB is running and connection string is correct
```

**CORS Errors**

```
Solution: Check FRONTEND_URL in .env matches your frontend URL
```

**JWT Token Errors**

```
Solution: Verify JWT_SECRET and token format in Authorization header
```

### Frontend Issues

**API Not Responding**

```
Solution: Check backend is running on port 5000 and REACT_APP_API_URL is correct
```

**Redux State Issues**

```
Solution: Use Redux DevTools extension to debug state
```

**Styling Issues**

```
Solution: Restart dev server to rebuild Tailwind CSS
```

## 📚 Documentation

- [Backend README](./backend/README.md) - Detailed backend documentation
- [Frontend README](./frontend/README.md) - Detailed frontend documentation

## 🚢 Deployment

### Backend (Heroku/Railway)

```bash
# Add Procfile
echo "web: node src/index.js" > Procfile

# Deploy
git push heroku main
```

### Frontend (Vercel/Netlify)

```bash
# Vercel
npm install -g vercel
vercel

# Netlify
npm run build
# Deploy build folder to Netlify
```

## 📝 Coding Standards

- **Backend**: Express conventions, RESTful API design
- **Frontend**: React hooks, functional components
- **Naming**: camelCase for JS, PascalCase for components
- **Comments**: JSDoc for functions, inline for complex logic
- **Error Handling**: Try-catch with proper error messages

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/feature-name`)
2. Commit changes (`git commit -am 'Add feature'`)
3. Push to branch (`git push origin feature/feature-name`)
4. Submit pull request

## 📄 License

MIT License - See LICENSE file for details

## 📞 Support

For issues and questions:

- Check [Backend README](./backend/README.md)
- Check [Frontend README](./frontend/README.md)
- Review API documentation
- Check demo credentials work

## 🎓 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redux Toolkit Guide](https://redux-toolkit.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## ✅ Checklist for Production

- [ ] Update all API URLs to production
- [ ] Change JWT secrets to strong values
- [ ] Update Razorpay keys to production
- [ ] Configure CORS properly
- [ ] Set up MongoDB Atlas cluster
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Set up monitoring and logging
- [ ] Add email notifications
- [ ] Backup strategy for database
- [ ] Security audit
- [ ] Performance optimization
- [ ] Load testing

---

**Built with ❤️ for Hospital Management Systems**

Happy coding! 🚀
