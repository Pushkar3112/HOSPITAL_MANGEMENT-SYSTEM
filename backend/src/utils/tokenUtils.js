const jwt = require("jsonwebtoken");
const ApiError = require("./apiError");

/**
 * Generate JWT token
 */
const generateToken = (userId, role, type = "access") => {
  const secret =
    type === "access"
      ? process.env.JWT_SECRET || "default_jwt_secret"
      : process.env.JWT_REFRESH_SECRET || "default_jwt_refresh_secret";
  const expiresIn =
    type === "access"
      ? process.env.JWT_EXPIRE || "15m"
      : process.env.JWT_REFRESH_EXPIRE || "7d";

  return jwt.sign({ userId, role }, secret, { expiresIn });
};

/**
 * Verify JWT token
 */
const verifyToken = (token, type = "access") => {
  const secret =
    type === "access" ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
};

/**
 * Generate both access and refresh tokens
 */
const generateAuthTokens = (userId, role) => {
  const accessToken = generateToken(userId, role, "access");
  const refreshToken = generateToken(userId, role, "refresh");

  return { accessToken, refreshToken };
};

module.exports = {
  generateToken,
  verifyToken,
  generateAuthTokens,
};
