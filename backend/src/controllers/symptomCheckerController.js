const { sendResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const { analyzeSymptoms } = require("../utils/geminiService");

/**
 * Analyze symptoms using Gemini AI
 */
const checkSymptoms = async (req, res, next) => {
  try {
    const { symptoms, age, gender, existingConditions } = req.body;

    if (!symptoms) {
      throw new ApiError(400, "Symptoms text is required");
    }

    const analysis = await analyzeSymptoms(
      symptoms,
      age,
      gender,
      existingConditions
    );

    return sendResponse(res, 200, analysis, "Symptom analysis completed");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkSymptoms,
};
