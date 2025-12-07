/**
 * Gemini AI Service for symptom checking
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get symptom analysis from Gemini API
 */
const analyzeSymptoms = async (symptoms, age, gender, existingConditions) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a medical assistant AI. Based on the following symptoms, provide initial insights (NOT A DIAGNOSIS - always include a disclaimer).

Patient Details:
- Age: ${age || "Not provided"}
- Gender: ${gender || "Not provided"}
- Existing Conditions: ${
      existingConditions?.length > 0 ? existingConditions.join(", ") : "None"
    }
- Reported Symptoms: ${symptoms}

Please provide your response in the following JSON format (and ONLY in this format):
{
  "summary": "Brief summary of the reported symptoms",
  "possibleCauses": ["Condition 1", "Condition 2", "Condition 3"],
  "recommendedSpecialization": "Type of doctor to consult (e.g., Cardiologist, Orthopedist, Dermatologist)",
  "urgencyLevel": "ROUTINE|SOON|URGENT",
  "disclaimer": "This is NOT a medical diagnosis. Please consult with a qualified healthcare professional for proper diagnosis and treatment."
}

IMPORTANT: Always include a disclaimer and never provide actual medical diagnosis. Keep recommendations general.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

module.exports = {
  analyzeSymptoms,
};
