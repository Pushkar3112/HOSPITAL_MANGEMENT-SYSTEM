const { prisma } = require("../config/database");
const { sendResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

/**
 * Get patient profile
 */
const getProfile = async (req, res, next) => {
  try {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.userId },
    });
    if (!patientProfile) {
      throw new ApiError(404, "Patient profile not found");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    return sendResponse(res, 200, {
      user: {
        id: user.id,
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

    const patientProfile = await prisma.patientProfile.upsert({
      where: { userId: req.user.userId },
      update: {
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        bloodGroup,
        address,
        emergencyContact,
        allergies: allergies || [],
        chronicConditions: chronicConditions || [],
      },
      create: {
        userId: req.user.userId,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        bloodGroup,
        address,
        emergencyContact,
        allergies: allergies || [],
        chronicConditions: chronicConditions || [],
      },
    });

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

    const appointments = await prisma.appointment.findMany({
      where: filter,
      include: {
        doctor: { select: { id: true, name: true, email: true } },
        patient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

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

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (appointment.patientId !== req.user.userId) {
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

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        paymentStatus: appointment.paymentStatus === "PAID" ? "REFUNDED" : undefined,
      },
    });

    return sendResponse(
      res,
      200,
      updatedAppointment,
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
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: req.user.userId },
      include: {
        doctor: { select: { id: true, name: true, email: true } },
        appointment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

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
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.user.userId },
      include: {
        doctor: { select: { id: true, name: true, email: true } },
        appointment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

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

    const invoices = await prisma.invoice.findMany({
      where: filter,
      include: {
        doctor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

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
