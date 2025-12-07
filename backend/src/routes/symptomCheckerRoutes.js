const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { checkSymptoms } = require("../controllers/symptomCheckerController");

// Symptom checker (patient only)
router.post("/", authenticate, authorize("PATIENT"), checkSymptoms);

module.exports = router;
