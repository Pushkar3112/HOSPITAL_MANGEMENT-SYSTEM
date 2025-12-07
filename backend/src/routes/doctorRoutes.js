const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateProfile,
  getAppointments,
  confirmAppointment,
  completeAppointment,
  getAvailableSlots,
  createPrescription,
  getPrescriptions,
  createMedicalRecord,
} = require("../controllers/doctorController");

router.use(authenticate);
router.use(authorize("DOCTOR"));

// Profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Appointments
router.get("/appointments", getAppointments);
router.patch("/appointments/:appointmentId/confirm", confirmAppointment);
router.patch("/appointments/:appointmentId/complete", completeAppointment);
router.get("/slots", getAvailableSlots);

// Prescriptions
router.post("/prescriptions", createPrescription);
router.get("/prescriptions", getPrescriptions);

// Medical records
router.post("/medical-records", createMedicalRecord);

module.exports = router;
