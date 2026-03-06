const { prisma } = require("../config/database");
const { redisClient } = require("../config/redis");
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

    // Build Cache Key
    const cacheKey = `searchDoctors:${JSON.stringify(req.query)}`;

    // Try Redis Cache first
    if (redisClient.isReady) {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return sendResponse(res, 200, JSON.parse(cachedResult), "Fetched from cache");
      }
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const filter = { isVerified: true };

    if (specialization) {
      filter.specialization = { contains: specialization, mode: 'insensitive' };
    }

    if (minFee || maxFee) {
      filter.consultationFee = {};
      if (minFee) filter.consultationFee.gte = parseFloat(minFee);
      if (maxFee) filter.consultationFee.lte = parseFloat(maxFee);
    }

    if (hospital) {
      filter.hospitalName = { contains: hospital, mode: 'insensitive' };
    }

    if (name) {
      filter.user = {
        name: { contains: name, mode: 'insensitive' }
      };
    }

    const doctors = await prisma.doctorProfile.findMany({
      where: filter,
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
      take,
      skip,
      orderBy: { rating: 'desc' },
    });

    const total = await prisma.doctorProfile.count({ where: filter });

    const resultData = {
      doctors,
      pagination: { page: parseInt(page), limit: take, total },
    };

    // Cache the result for 1 hour
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(resultData));
    }

    return sendResponse(res, 200, resultData);
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

    const cacheKey = `doctorDetail:${doctorId}`;
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return sendResponse(res, 200, { doctor: JSON.parse(cached) }, "Fetched from cache");
      }
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(doctor));
    }

    return sendResponse(res, 200, { doctor });
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

    // Attempt to find by userId (which is also the user id in Prisma)
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        OR: [
          { id: doctorId },
          { userId: doctorId }
        ]
      }
    });

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.userId, date: new Date(date) }
    });

    const slots = generateAvailableSlots(doctor, date, appointments);

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
