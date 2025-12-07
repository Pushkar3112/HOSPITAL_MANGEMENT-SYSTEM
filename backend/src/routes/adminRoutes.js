const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const {
  getStats,
  getUsers,
  approveDoctor,
  rejectDoctor,
  blockUser,
  unblockUser,
  getAppointments,
  getInvoices,
} = require("../controllers/adminController");

router.use(authenticate);
router.use(authorize("ADMIN"));

// Stats
router.get("/stats", getStats);

// Users
router.get("/users", getUsers);
router.patch("/users/:userId/block", blockUser);
router.patch("/users/:userId/unblock", unblockUser);

// Doctor approval
router.patch("/doctors/:doctorId/approve", approveDoctor);
router.delete("/doctors/:doctorId/reject", rejectDoctor);

// Appointments
router.get("/appointments", getAppointments);

// Invoices
router.get("/invoices", getInvoices);

module.exports = router;
