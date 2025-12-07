const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const Invoice = require("../models/Invoice");
const { sendResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

/**
 * Get admin dashboard stats
 */
const getStats = async (req, res, next) => {
  try {
    const totalPatients = await User.countDocuments({ role: "PATIENT" });
    const totalDoctors = await User.countDocuments({ role: "DOCTOR" });
    const totalAppointments = await Appointment.countDocuments();

    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAppointments = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    // Total revenue
    const invoices = await Invoice.find({ paymentStatus: "PAID" });
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0
    );

    return sendResponse(res, 200, {
      totalPatients,
      totalDoctors,
      totalAppointments,
      todaysAppointments,
      totalRevenue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return sendResponse(res, 200, {
      users,
      pagination: { page, limit, total },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve doctor
 */
const approveDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    doctor.isVerified = true;
    await doctor.save();

    return sendResponse(res, 200, doctor, "Doctor approved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Reject doctor
 */
const rejectDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await DoctorProfile.findOneAndRemove({ userId: doctorId });
    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    // Delete user
    await User.findByIdAndRemove(doctorId);

    return sendResponse(res, 200, {}, "Doctor registration rejected");
  } catch (error) {
    next(error);
  }
};

/**
 * Block user
 */
const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return sendResponse(res, 200, user, "User blocked successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Unblock user
 */
const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return sendResponse(res, 200, user, "User unblocked successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Get all appointments
 */
const getAppointments = async (req, res, next) => {
  try {
    const { status, doctorId, patientId, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name email")
      .populate("patientId", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await Appointment.countDocuments(filter);

    return sendResponse(res, 200, {
      appointments,
      pagination: { page, limit, total },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invoices
 */
const getInvoices = async (req, res, next) => {
  try {
    const { status, doctorId, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.paymentStatus = status;
    if (doctorId) filter.doctorId = doctorId;

    const invoices = await Invoice.find(filter)
      .populate("doctorId", "name email")
      .populate("patientId", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Invoice.countDocuments(filter);

    return sendResponse(res, 200, {
      invoices,
      pagination: { page, limit, total },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  approveDoctor,
  rejectDoctor,
  blockUser,
  unblockUser,
  getAppointments,
  getInvoices,
};
