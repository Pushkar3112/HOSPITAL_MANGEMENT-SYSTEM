const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshAccessToken,
  logout,
} = require("../controllers/authController");
const {
  validationRules,
  handleValidationErrors,
} = require("../middlewares/validation");

// Register
router.post(
  "/register",
  validationRules.register,
  handleValidationErrors,
  register
);

// Login
router.post("/login", validationRules.login, handleValidationErrors, login);

// Refresh token
router.post("/refresh", refreshAccessToken);

// Logout
router.post("/logout", logout);

module.exports = router;
