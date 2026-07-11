const express = require('express');
const router = express.Router();
const {
    getProfile, updateProfile, getAppointments, confirmAppointment,
    completeAppointment, getAvailableSlots, createPrescription,
    createMedicalRecord, createInvoice, getPatients, getDashboardStats,
    getTemplates, createTemplate, updateTemplate, deleteTemplate,
} = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// All routes require authentication and DOCTOR role (or ADMIN)
router.use(authenticate, authorize('DOCTOR', 'ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/appointments', getAppointments);
router.get('/slots', getAvailableSlots);
router.patch('/appointments/:appointmentId/confirm', confirmAppointment);
router.patch('/appointments/:appointmentId/complete', completeAppointment);
router.get('/patients', getPatients);

// Prescriptions
router.post('/prescriptions', createPrescription);

// Medical Records
router.post('/medical-records', createMedicalRecord);

// Invoices
router.post('/invoices', createInvoice);

// Prescription Templates
router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:templateId', updateTemplate);
router.delete('/templates/:templateId', deleteTemplate);

module.exports = router;
