const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/apiError");

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  register: [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
      .matches(/^[0-9]{10}$/)
      .withMessage("Valid 10-digit phone number is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role").isIn(["PATIENT", "DOCTOR"]).withMessage("Invalid role"),
  ],
  login: [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  createAppointment: [
    body("doctorId").notEmpty().withMessage("Doctor ID is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("startTime")
      .matches(/^\d{2}:\d{2}$/)
      .withMessage("Valid start time is required"),
    body("endTime")
      .matches(/^\d{2}:\d{2}$/)
      .withMessage("Valid end time is required"),
    body("visitType")
      .isIn(["ONLINE", "OFFLINE"])
      .withMessage("Invalid visit type"),
  ],
};

module.exports = {
  handleValidationErrors,
  validationRules,
};
