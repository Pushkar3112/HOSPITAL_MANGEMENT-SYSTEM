const DoctorProfile = require("../models/DoctorProfile");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const MedicalRecord = require("../models/MedicalRecord");
const { sendResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const { generateAvailableSlots } = require("../utils/appointmentUtils");

/**
 * Get doctor profile
 */
const getProfile = async (req, res, next) => {
  try {
    const doctorProfile = await DoctorProfile.findOne({
      userId: req.user.userId,
    });
    if (!doctorProfile) {
      throw new ApiError(404, "Doctor profile not found");
    }

    const user = await User.findById(req.user.userId);

    return sendResponse(res, 200, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      profile: doctorProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      specialization,
      qualifications,
      yearsOfExperience,
      hospitalName,
      consultationFee,
      availableDays,
      dailyStartTime,
      dailyEndTime,
      slotDurationMinutes,
      customBreaks,
      maxPatientsPerSlot,
    } = req.body;

    const doctorProfile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user.userId },
      {
        specialization,
        qualifications,
        yearsOfExperience,
        hospitalName,
        consultationFee,
        availableDays,
        dailyStartTime,
        dailyEndTime,
        slotDurationMinutes,
        customBreaks,
        maxPatientsPerSlot,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    return sendResponse(
      res,
      200,
      doctorProfile,
      "Profile updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor appointments
 */
const getAppointments = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const filter = { doctorId: req.user.userId };

    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email phone")
      .sort({ date: 1, startTime: 1 });

    return sendResponse(res, 200, appointments);
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm appointment
 */
const confirmAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (appointment.doctorId.toString() !== req.user.userId) {
      throw new ApiError(403, "Unauthorized");
    }

    if (appointment.status !== "PENDING") {
      throw new ApiError(400, "Appointment is not in PENDING status");
    }

    appointment.status = "CONFIRMED";
    await appointment.save();

    return sendResponse(res, 200, appointment, "Appointment confirmed");
  } catch (error) {
    next(error);
  }
};

/**
 * Complete appointment
 */
const completeAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (appointment.doctorId.toString() !== req.user.userId) {
      throw new ApiError(403, "Unauthorized");
    }

    appointment.status = "COMPLETED";
    await appointment.save();

    return sendResponse(
      res,
      200,
      appointment,
      "Appointment marked as complete"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get available slots for a date
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      throw new ApiError(400, "Date is required");
    }

    const doctor = await DoctorProfile.findOne({ userId: req.user.userId });
    if (!doctor) {
      throw new ApiError(404, "Doctor profile not found");
    }

    const appointments = await Appointment.find({ doctorId: req.user.userId });
    const slots = generateAvailableSlots(doctor, date, appointments);

    return sendResponse(res, 200, { slots });
  } catch (error) {
    next(error);
  }
};

/**
 * Create prescription
 */
const createPrescription = async (req, res, next) => {
  try {
    const {
      patientId,
      appointmentId,
      medications,
      lifestyleAdvice,
      followUpDate,
    } = req.body;

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user.userId,
      appointmentId,
      medications,
      lifestyleAdvice,
      followUpDate,
    });

    // Link to appointment
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        prescriptionId: prescription._id,
      });
    }

    return sendResponse(
      res,
      201,
      prescription,
      "Prescription created successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get prescriptions for doctor
 */
const getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.user.userId })
      .populate("patientId", "name email")
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, prescriptions);
  } catch (error) {
    next(error);
  }
};

/**
 * Create medical record
 */
const createMedicalRecord = async (req, res, next) => {
  try {
    const {
      patientId,
      appointmentId,
      diagnoses,
      testsOrdered,
      testResults,
      attachments,
      notes,
    } = req.body;

    const record = await MedicalRecord.create({
      patientId,
      doctorId: req.user.userId,
      appointmentId,
      diagnoses,
      testsOrdered,
      testResults,
      attachments,
      notes,
    });

    return sendResponse(
      res,
      201,
      record,
      "Medical record created successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAppointments,
  confirmAppointment,
  completeAppointment,
  getAvailableSlots,
  createPrescription,
  getPrescriptions,
  createMedicalRecord,
};
