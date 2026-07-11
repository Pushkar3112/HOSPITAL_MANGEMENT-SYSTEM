const express = require('express');
const router = express.Router();
const { bookAppointment, getAppointmentById, updateAppointmentNotes } = require('../controllers/appointmentController');
const { authenticate } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticate);

router.post('/', bookAppointment);
router.get('/:appointmentId', getAppointmentById);
router.patch('/:appointmentId/notes', updateAppointmentNotes);

module.exports = router;
