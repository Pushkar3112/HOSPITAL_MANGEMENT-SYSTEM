const ApiError = require("../utils/apiError");
const { sendResponse } = require("../utils/apiResponse");

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Error:", err);

  return sendResponse(res, statusCode, null, message);
};

module.exports = errorHandler;
