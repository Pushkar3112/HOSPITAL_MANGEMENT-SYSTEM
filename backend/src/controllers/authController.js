const { prisma } = require("../config/database");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const { generateAuthTokens, verifyToken, generateToken } = require("../utils/tokenUtils");
const ApiError = require("../utils/apiError");
const { sendResponse } = require("../utils/apiResponse");

/**
 * Register user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and profile in a transaction
    const userRole = role || "PATIENT";

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: userRole,
        },
      });

      if (userRole === "PATIENT") {
        await tx.patientProfile.create({ data: { userId: newUser.id } });
      } else if (userRole === "DOCTOR") {
        // Required fields like specialization, yearsOfExperience, hospitalName, consultationFee need placeholder defaults
        // during registration if not provided, or frontend should provide them.
        // Assuming minimal defaults for now.
        await tx.doctorProfile.create({
          data: {
            userId: newUser.id,
            isVerified: false,
            specialization: "Not Specified",
            yearsOfExperience: 0,
            hospitalName: "Not Specified",
            consultationFee: 0,
          }
        });
      }
      return newUser;
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateAuthTokens(
      user.id,
      user.role
    );

    return sendResponse(
      res,
      201,
      {
        user: {
          id: user.id,
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
    const user = await prisma.user.findUnique({ where: { email } });
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
      user.id,
      user.role
    );

    return sendResponse(
      res,
      200,
      {
        user: {
          id: user.id,
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

    const decoded = verifyToken(refreshToken, "refresh");

    // Get user
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Generate new access token
    const newAccessToken = generateToken(user.id, user.role, "access");

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
