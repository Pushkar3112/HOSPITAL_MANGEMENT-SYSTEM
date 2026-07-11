const { prisma } = require('../config/database');
const { sendResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { setCache, getCache } = require('../config/redis');
const { generateAvailableSlots } = require('../utils/appointmentUtils');

const searchDoctors = async (req, res, next) => {
    try {
        const {
            specialization, search, name, date, minFee, maxFee,
            page = 1, limit = 12, sort = 'rating',
        } = req.query;

        const searchTerm = search || name;
        const cacheKey = `doctor-search:${JSON.stringify(req.query)}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const userWhere = { role: 'DOCTOR', isActive: true };
        if (searchTerm) {
            userWhere.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
            ];
        }

        // Build profile filter - don't require isVerified to show all doctors
        const profileWhere = {};
        if (specialization) {
            profileWhere.specialization = { contains: specialization, mode: 'insensitive' };
        }
        if (minFee !== undefined) profileWhere.consultationFee = { ...(profileWhere.consultationFee || {}), gte: parseFloat(minFee) };
        if (maxFee !== undefined) profileWhere.consultationFee = { ...(profileWhere.consultationFee || {}), lte: parseFloat(maxFee) };

        const orderBy = sort === 'fee_asc'
            ? { doctorProfile: { consultationFee: 'asc' } }
            : sort === 'fee_desc'
            ? { doctorProfile: { consultationFee: 'desc' } }
            : sort === 'experience'
            ? { doctorProfile: { yearsOfExperience: 'desc' } }
            : { doctorProfile: { rating: 'desc' } };

        const whereClause = {
            ...userWhere,
            ...(Object.keys(profileWhere).length > 0 && { doctorProfile: profileWhere }),
            doctorProfile: { isNot: null, ...profileWhere }, // ensure profile exists
        };

        const [doctors, total] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true, name: true, email: true, avatar: true,
                    doctorProfile: {
                        select: {
                            specialization: true, qualifications: true, yearsOfExperience: true,
                            hospitalName: true, consultationFee: true, availableDays: true,
                            dailyStartTime: true, dailyEndTime: true, isVerified: true,
                            rating: true, totalRatings: true,
                        },
                    },
                },
                skip,
                take: parseInt(limit),
                orderBy,
            }),
            prisma.user.count({ where: whereClause }),
        ]);

        const result = {
            doctors,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        };

        await setCache(cacheKey, result, 120); // shorter TTL for search
        return sendResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
};

const getDoctorById = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const cacheKey = `doctor:public:${doctorId}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const doctor = await prisma.user.findUnique({
            where: { id: doctorId, role: 'DOCTOR', isActive: true },
            select: { id: true, name: true, email: true, avatar: true, doctorProfile: true },
        });

        if (!doctor || !doctor.doctorProfile) throw new ApiError(404, 'Doctor not found');

        await setCache(cacheKey, doctor, 600);
        return sendResponse(res, 200, doctor);
    } catch (error) {
        next(error);
    }
};

const getDoctorSlots = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;
        if (!date) throw new ApiError(400, 'Date is required');

        const cacheKey = `doctor:slots:${doctorId}:${date}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const doctor = await prisma.doctorProfile.findUnique({ where: { userId: doctorId } });
        if (!doctor) throw new ApiError(404, 'Doctor not found');

        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                date: {
                    gte: new Date(date),
                    lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
                },
                status: { notIn: ['CANCELLED'] },
            },
        });

        const slots = generateAvailableSlots(doctor, date, appointments);
        await setCache(cacheKey, slots, 60);
        return sendResponse(res, 200, slots);
    } catch (error) {
        next(error);
    }
};

const getSpecializations = async (req, res, next) => {
    try {
        const cacheKey = 'doctor-search:specializations';
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const profiles = await prisma.doctorProfile.findMany({
            select: { specialization: true },
            distinct: ['specialization'],
            orderBy: { specialization: 'asc' },
        });

        const specializations = profiles.map(p => p.specialization).filter(Boolean);
        await setCache(cacheKey, specializations, 3600);
        return sendResponse(res, 200, specializations);
    } catch (error) {
        next(error);
    }
};

module.exports = { searchDoctors, getDoctorById, getDoctorSlots, getSpecializations };
