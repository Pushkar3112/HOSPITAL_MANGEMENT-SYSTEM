const mongoose = require('mongoose');
const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  experience: { type: Number, required: true },
  availableDays: [String],
  availableTime: { type: String },
  contact: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);