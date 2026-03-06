const { prisma } = require("../config/database");
const { sendResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

/**
 * Get admin dashboard stats
 */
const getStats = async (req, res, next) => {
  try {
    const totalPatients = await prisma.user.count({ where: { role: "PATIENT" } });
    const totalDoctors = await prisma.user.count({ where: { role: "DOCTOR" } });
    const totalAppointments = await prisma.appointment.count();

    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAppointments = await prisma.appointment.count({
      where: {
        date: { gte: today, lt: tomorrow },
      },
    });

    // Total revenue
    const revenueAgg = await prisma.invoice.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalAmount: true }
    });
    const totalRevenue = revenueAgg._sum.totalAmount || 0;

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

    // Prisma pagination uses skip and take
    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: filter,
      take,
      skip,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where: filter });

    return sendResponse(res, 200, {
      users,
      pagination: { page: parseInt(page), limit: take, total },
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

    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: doctorId } });
    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    const updated = await prisma.doctorProfile.update({
      where: { userId: doctorId },
      data: { isVerified: true }
    });

    return sendResponse(res, 200, updated, "Doctor approved successfully");
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

    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: doctorId } });
    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    // Since we use onDelete: Cascade in Prisma schema, deleting the User will delete the DoctorProfile
    await prisma.user.delete({ where: { id: doctorId } });

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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    return sendResponse(res, 200, updated, "User blocked successfully");
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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true }
    });

    return sendResponse(res, 200, updated, "User unblocked successfully");
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

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const filter = {};
    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;

    const appointments = await prisma.appointment.findMany({
      where: filter,
      include: {
        doctor: { select: { id: true, name: true, email: true } },
        patient: { select: { id: true, name: true, email: true } }
      },
      take,
      skip,
      orderBy: { date: 'desc' }
    });

    const total = await prisma.appointment.count({ where: filter });

    return sendResponse(res, 200, {
      appointments,
      pagination: { page: parseInt(page), limit: take, total },
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

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const filter = {};
    if (status) filter.paymentStatus = status;
    if (doctorId) filter.doctorId = doctorId;

    const invoices = await prisma.invoice.findMany({
      where: filter,
      include: {
        doctor: { select: { id: true, name: true, email: true } },
        patient: { select: { id: true, name: true, email: true } }
      },
      take,
      skip,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.invoice.count({ where: filter });

    return sendResponse(res, 200, {
      invoices,
      pagination: { page: parseInt(page), limit: take, total },
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
