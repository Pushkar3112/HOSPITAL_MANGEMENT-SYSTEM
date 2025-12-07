const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const DoctorProfile = require("../models/DoctorProfile");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const { generateAuthTokens } = require("../utils/tokenUtils");
const ApiError = require("../utils/apiError");
const { sendResponse } = require("../utils/apiResponse");

/**
 * Register user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role,
    });

    // Create profile based on role
    if (role === "PATIENT") {
      await PatientProfile.create({ userId: user._id });
    } else if (role === "DOCTOR") {
      await DoctorProfile.create({ userId: user._id, isVerified: false });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateAuthTokens(
      user._id,
      user.role
    );

    return sendResponse(
      res,
      201,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      "Registration successful"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, "Your account has been blocked");
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateAuthTokens(
      user._id,
      user.role
    );

    return sendResponse(
      res,
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      "Login successful"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }

    const { verifyToken } = require("../utils/tokenUtils");
    const decoded = verifyToken(refreshToken, "refresh");

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Generate new access token
    const { generateToken } = require("../utils/tokenUtils");
    const newAccessToken = generateToken(user._id, user.role, "access");

    return sendResponse(
      res,
      200,
      { accessToken: newAccessToken },
      "Token refreshed"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (frontend can handle token removal)
 */
const logout = async (req, res, next) => {
  try {
    return sendResponse(res, 200, {}, "Logout successful");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
};
