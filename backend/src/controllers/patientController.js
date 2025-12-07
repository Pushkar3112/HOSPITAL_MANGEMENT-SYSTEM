const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const Prescription = require("../models/Prescription");
const Invoice = require("../models/Invoice");
const DoctorProfile = require("../models/DoctorProfile");
const { sendResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

/**
 * Get patient profile
 */
const getProfile = async (req, res, next) => {
  try {
    const patientProfile = await PatientProfile.findOne({
      userId: req.user.userId,
    });
    if (!patientProfile) {
      throw new ApiError(404, "Patient profile not found");
    }

    const user = await User.findById(req.user.userId);

    return sendResponse(res, 200, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      profile: patientProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      gender,
      dateOfBirth,
      bloodGroup,
      address,
      emergencyContact,
      allergies,
      chronicConditions,
    } = req.body;

    const patientProfile = await PatientProfile.findOneAndUpdate(
      { userId: req.user.userId },
      {
        gender,
        dateOfBirth,
        bloodGroup,
        address,
        emergencyContact,
        allergies,
        chronicConditions,
        updatedAt: Date.now(),
      },
      { new: true, upsert: true }
    );

    return sendResponse(
      res,
      200,
      patientProfile,
      "Profile updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient appointments
 */
const getAppointments = async (req, res, next) => {
  try {
    const { status, doctorId } = req.query;
    const filter = { patientId: req.user.userId };

    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name email")
      .populate("patientId", "name email")
      .sort({ date: -1 });

    return sendResponse(res, 200, appointments);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (appointment.patientId.toString() !== req.user.userId) {
      throw new ApiError(403, "Unauthorized");
    }

    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
      throw new ApiError(400, "Cannot cancel this appointment");
    }

    // Check if appointment is at least 2 hours away
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = appointment.startTime.split(":").map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const timeDiff = appointmentDate - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 2) {
      throw new ApiError(
        400,
        "Cannot cancel appointment within 2 hours of appointment time"
      );
    }

    appointment.status = "CANCELLED";
    if (appointment.paymentStatus === "PAID") {
      appointment.paymentStatus = "REFUNDED";
    }
    await appointment.save();

    return sendResponse(
      res,
      200,
      appointment,
      "Appointment cancelled successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get medical history
 */
const getMedicalHistory = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user.userId })
      .populate("doctorId", "name email")
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, records);
  } catch (error) {
    next(error);
  }
};

/**
 * Get prescriptions
 */
const getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({
      patientId: req.user.userId,
    })
      .populate("doctorId", "name email")
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, prescriptions);
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoices
 */
const getInvoices = async (req, res, next) => {
  try {
    const { doctorId, status } = req.query;
    const filter = { patientId: req.user.userId };

    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.paymentStatus = status;

    const invoices = await Invoice.find(filter)
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, invoices);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAppointments,
  cancelAppointment,
  getMedicalHistory,
  getPrescriptions,
  getInvoices,
};
