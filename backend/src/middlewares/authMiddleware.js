const { verifyToken } = require("../utils/tokenUtils");
const ApiError = require("../utils/apiError");

/**
 * JWT Authentication middleware
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "No authentication token provided");
    }

    const decoded = verifyToken(token, "access");
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
