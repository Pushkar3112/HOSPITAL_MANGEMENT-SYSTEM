const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateProfile,
  getAppointments,
  cancelAppointment,
  getMedicalHistory,
  getPrescriptions,
  getInvoices,
} = require("../controllers/patientController");

router.use(authenticate);
router.use(authorize("PATIENT"));

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Appointments
router.get("/appointments", getAppointments);
router.delete("/appointments/:appointmentId", cancelAppointment);

// Medical history
router.get("/history", getMedicalHistory);

// Prescriptions
router.get("/prescriptions", getPrescriptions);

// Invoices
router.get("/invoices", getInvoices);

module.exports = router;
