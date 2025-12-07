const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const {
  createAppointment,
  verifyPayment,
  handleWebhook,
} = require("../controllers/appointmentController");

// Create appointment (patient only)
router.post("/", authenticate, authorize("PATIENT"), createAppointment);

// Verify payment (patient only)
router.post(
  "/verify-payment",
  authenticate,
  authorize("PATIENT"),
  verifyPayment
);

// Webhook (public - should validate webhook signature in production)
router.post("/webhook", handleWebhook);

module.exports = router;
