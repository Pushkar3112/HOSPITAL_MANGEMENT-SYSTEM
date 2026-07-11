const express = require('express');
const router = express.Router();
const {
    getProfile, updateProfile, getAppointments, cancelAppointment,
    getMedicalHistory, getPrescriptions, getInvoices, getDashboardStats,
} = require('../controllers/patientController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// All routes require authentication and PATIENT role
router.use(authenticate, authorize('PATIENT', 'ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/appointments', getAppointments);
router.patch('/appointments/:appointmentId/cancel', cancelAppointment);
router.get('/medical-records', getMedicalHistory);
router.get('/prescriptions', getPrescriptions);
router.get('/invoices', getInvoices);

module.exports = router;
