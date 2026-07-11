const express = require('express');
const router = express.Router();
const { searchDoctors, getDoctorById, getDoctorSlots, getSpecializations } = require('../controllers/doctorSearchController');
const { authenticate } = require('../middlewares/authMiddleware');

// Public routes — no auth required for browsing
router.get('/', searchDoctors);
router.get('/specializations', getSpecializations);

// Protected routes — require auth for booking-related actions
router.get('/:doctorId/slots', authenticate, getDoctorSlots);
router.get('/:doctorId', getDoctorById);

module.exports = router;
