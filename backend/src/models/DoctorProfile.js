const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  qualifications: [String],
  yearsOfExperience: {
    type: Number,
    required: true,
  },
  hospitalName: {
    type: String,
    required: true,
  },
  consultationFee: {
    type: Number,
    required: true,
  },
  availableDays: {
    type: [Number], // 0-6 (Sunday-Saturday)
    default: [1, 2, 3, 4, 5], // Mon-Fri by default
  },
  dailyStartTime: {
    type: String, // HH:MM format
    default: "09:00",
  },
  dailyEndTime: {
    type: String, // HH:MM format
    default: "17:00",
  },
  slotDurationMinutes: {
    type: Number,
    default: 30,
  },
  customBreaks: [
    {
      startTime: String, // HH:MM
      endTime: String, // HH:MM
      reason: String,
    },
  ],
  isVerified: {
    type: Boolean,
    default: false,
  },
  maxPatientsPerSlot: {
    type: Number,
    default: 1,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
