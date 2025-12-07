const express = require("express");
const router = express.Router();
const {
  searchDoctors,
  getDoctorDetail,
  getDoctorSlots,
} = require("../controllers/doctorSearchController");

// Search doctors (public route)
router.get("/search", searchDoctors);
router.get("/:doctorId", getDoctorDetail);
router.get("/:doctorId/slots", getDoctorSlots);

module.exports = router;
