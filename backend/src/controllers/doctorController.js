const { prisma } = require("../config/database");
const { sendResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const { generateAvailableSlots } = require("../utils/appointmentUtils");

/**
 * Get doctor profile
 */
const getProfile = async (req, res, next) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.userId },
    });
    if (!doctorProfile) {
      throw new ApiError(404, "Doctor profile not found");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    return sendResponse(res, 200, {
      user: {
        id: user.id,
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

    const doctorProfile = await prisma.doctorProfile.update({
      where: { userId: req.user.userId },
      data: {
        specialization,
        qualifications: qualifications || [],
        yearsOfExperience,
        hospitalName,
        consultationFee,
        availableDays: availableDays || [],
        dailyStartTime,
        dailyEndTime,
        slotDurationMinutes,
        customBreaks: customBreaks || [],
        maxPatientsPerSlot,
      },
    });

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
      filter.date = { gte: startDate, lt: endDate };
    }

    const appointments = await prisma.appointment.findMany({
      where: filter,
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ],
    });

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

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (appointment.doctorId !== req.user.userId) {
      throw new ApiError(403, "Unauthorized");
    }

    if (appointment.status !== "PENDING") {
      throw new ApiError(400, "Appointment is not in PENDING status");
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CONFIRMED" }
    });

    return sendResponse(res, 200, updated, "Appointment confirmed");
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

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (appointment.doctorId !== req.user.userId) {
      throw new ApiError(403, "Unauthorized");
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "COMPLETED" }
    });

    return sendResponse(
      res,
      200,
      updated,
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

    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.user.userId } });
    if (!doctor) {
      throw new ApiError(404, "Doctor profile not found");
    }

    const appointments = await prisma.appointment.findMany({ where: { doctorId: req.user.userId } });
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

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId: req.user.userId,
        medications: medications || [],
        lifestyleAdvice,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      }
    });

    // Link prescription to appointment via the Appointment's prescriptionId FK
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { prescriptionId: prescription.id }
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
    const prescriptions = await prisma.prescription.findMany({
      where: { doctorId: req.user.userId },
      include: {
        patient: { select: { id: true, name: true, email: true } },
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

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId: req.user.userId,
        appointmentId,
        diagnoses: diagnoses || [],
        testsOrdered: testsOrdered || [],
        testResults: testResults || [],
        attachments: attachments || [],
        notes,
      }
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
