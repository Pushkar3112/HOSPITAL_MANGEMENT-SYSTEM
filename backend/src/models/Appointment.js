const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // HH:MM format
    required: true,
  },
  endTime: {
    type: String, // HH:MM format
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
    default: "PENDING",
  },
  visitType: {
    type: String,
    enum: ["ONLINE", "OFFLINE"],
    required: true,
  },
  reasonForVisit: String,
  notesFromDoctor: String,
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prescription",
  },
  paymentStatus: {
    type: String,
    enum: ["UNPAID", "PENDING", "PAID", "REFUNDED"],
    default: "UNPAID",
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  consultationFee: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index to prevent double booking
appointmentSchema.index({ doctorId: 1, date: 1, startTime: 1, status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
