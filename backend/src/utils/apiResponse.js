/**
 * Centralized API Response Format
 */
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

const sendResponse = (res, statusCode, data, message = "Success") => {
  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, data, message));
};

module.exports = { ApiResponse, sendResponse };
