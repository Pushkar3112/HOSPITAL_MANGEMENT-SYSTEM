const DoctorProfile = require("../models/DoctorProfile");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const { sendResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const { generateAvailableSlots } = require("../utils/appointmentUtils");

/**
 * Search doctors
 */
const searchDoctors = async (req, res, next) => {
  try {
    const {
      specialization,
      name,
      hospital,
      minFee,
      maxFee,
      page = 1,
      limit = 10,
    } = req.query;
    const filter = { isVerified: true };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    if (minFee || maxFee) {
      filter.consultationFee = {};
      if (minFee) filter.consultationFee.$gte = minFee;
      if (maxFee) filter.consultationFee.$lte = maxFee;
    }

    if (hospital) {
      filter.hospitalName = { $regex: hospital, $options: "i" };
    }

    const doctors = await DoctorProfile.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });

    // Populate user details
    const result = await Promise.all(
      doctors.map(async (doctor) => {
        const user = await User.findById(doctor.userId).select(
          "name email phone"
        );
        return { ...doctor.toObject(), user };
      })
    );

    const total = await DoctorProfile.countDocuments(filter);

    return sendResponse(res, 200, {
      doctors: result,
      pagination: { page, limit, total },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor details
 */
const getDoctorDetail = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    const user = await User.findById(doctorId);

    return sendResponse(res, 200, {
      doctor: { ...doctor.toObject(), user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available slots for a doctor
 */
const getDoctorSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      throw new ApiError(400, "Date is required");
    }

    console.log(
      `\n[getDoctorSlots] Requested - doctorId: ${doctorId}, date: ${date}`
    );

    // Try to find doctor by _id first (from DoctorProfile), then by userId
    let doctor = await DoctorProfile.findById(doctorId);
    if (!doctor) {
      doctor = await DoctorProfile.findOne({ userId: doctorId });
    }

    if (!doctor) {
      console.log(`[getDoctorSlots] Doctor not found with id: ${doctorId}`);
      throw new ApiError(404, "Doctor not found");
    }

    console.log(`[getDoctorSlots] Doctor found:`, doctor.userId);
    console.log(
      `[getDoctorSlots] Available days: ${doctor.availableDays}, Hours: ${doctor.dailyStartTime}-${doctor.dailyEndTime}`
    );

    const appointments = await Appointment.find({ doctorId: doctor.userId });
    console.log(
      `[getDoctorSlots] Found ${appointments.length} appointments for this doctor`
    );

    const slots = generateAvailableSlots(doctor, date, appointments);
    console.log(`[getDoctorSlots] Generated ${slots.length} available slots`);

    return sendResponse(res, 200, { slots });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchDoctors,
  getDoctorDetail,
  getDoctorSlots,
};
