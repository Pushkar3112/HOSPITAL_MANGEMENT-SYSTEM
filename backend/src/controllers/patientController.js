const { prisma } = require('../config/database');
const { sendResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { setCache, getCache, deleteCache, deleteCachePattern } = require('../config/redis');

const getProfile = async (req, res, next) => {
    try {
        const cacheKey = `patient:profile:${req.user.userId}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const [user, profile] = await Promise.all([
            prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { id: true, name: true, email: true, phone: true, avatar: true, createdAt: true },
            }),
            prisma.patientProfile.findUnique({ where: { userId: req.user.userId } }),
        ]);

        if (!profile) throw new ApiError(404, 'Patient profile not found');
        const data = { user, profile };
        await setCache(cacheKey, data, 300);
        return sendResponse(res, 200, data);
    } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, gender, dateOfBirth, bloodGroup, address, emergencyContact, allergies, chronicConditions } = req.body;

        if (name || phone) {
            await prisma.user.update({
                where: { id: req.user.userId },
                data: { ...(name && { name }), ...(phone && { phone }) },
            });
        }

        const profile = await prisma.patientProfile.upsert({
            where: { userId: req.user.userId },
            update: {
                ...(gender !== undefined && { gender }),
                ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
                ...(bloodGroup !== undefined && { bloodGroup }),
                ...(address !== undefined && { address }),
                ...(emergencyContact !== undefined && { emergencyContact }),
                ...(allergies !== undefined && { allergies: allergies || [] }),
                ...(chronicConditions !== undefined && { chronicConditions: chronicConditions || [] }),
            },
            create: {
                userId: req.user.userId,
                gender, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                bloodGroup, address, emergencyContact,
                allergies: allergies || [], chronicConditions: chronicConditions || [],
            },
        });

        await deleteCache(`patient:profile:${req.user.userId}`);
        return sendResponse(res, 200, profile, 'Profile updated successfully');
    } catch (error) { next(error); }
};

const getAppointments = async (req, res, next) => {
    try {
        const { status } = req.query;
        const cacheKey = `patient:appointments:${req.user.userId}:${status || 'all'}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const where = { patientId: req.user.userId };
        if (status) where.status = status;

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                doctor: {
                    select: {
                        id: true, name: true, email: true, avatar: true,
                        doctorProfile: { select: { specialization: true, hospitalName: true, consultationFee: true } },
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        await setCache(cacheKey, appointments, 120);
        return sendResponse(res, 200, appointments);
    } catch (error) { next(error); }
};

const cancelAppointment = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
        if (!appointment) throw new ApiError(404, 'Appointment not found');
        if (appointment.patientId !== req.user.userId) throw new ApiError(403, 'Unauthorized');
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
            throw new ApiError(400, 'Cannot cancel this appointment');
        }

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CANCELLED' },
        });

        await deleteCachePattern(`patient:appointments:${req.user.userId}:*`);
        await deleteCachePattern(`patient:dashboard:${req.user.userId}`);
        return sendResponse(res, 200, updated, 'Appointment cancelled successfully');
    } catch (error) { next(error); }
};

const getMedicalHistory = async (req, res, next) => {
    try {
        const cacheKey = `patient:medical:${req.user.userId}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const records = await prisma.medicalRecord.findMany({
            where: { patientId: req.user.userId },
            include: {
                doctor: {
                    select: {
                        id: true, name: true, avatar: true,
                        doctorProfile: { select: { specialization: true } },
                    },
                },
                appointment: { select: { id: true, date: true, startTime: true, visitType: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        await setCache(cacheKey, records, 300);
        return sendResponse(res, 200, records);
    } catch (error) { next(error); }
};

const getPrescriptions = async (req, res, next) => {
    try {
        const cacheKey = `patient:prescriptions:${req.user.userId}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const prescriptions = await prisma.prescription.findMany({
            where: { patientId: req.user.userId },
            include: {
                doctor: {
                    select: {
                        id: true, name: true, avatar: true,
                        doctorProfile: { select: { specialization: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        await setCache(cacheKey, prescriptions, 300);
        return sendResponse(res, 200, prescriptions);
    } catch (error) { next(error); }
};

const getInvoices = async (req, res, next) => {
    try {
        const cacheKey = `patient:invoices:${req.user.userId}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const invoices = await prisma.invoice.findMany({
            where: { patientId: req.user.userId },
            include: { doctor: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });

        await setCache(cacheKey, invoices, 300);
        return sendResponse(res, 200, invoices);
    } catch (error) { next(error); }
};

const getDashboardStats = async (req, res, next) => {
    try {
        const cacheKey = `patient:dashboard:${req.user.userId}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const [totalAppointments, upcomingAppointments, totalPrescriptions, totalMedicalRecords] = await Promise.all([
            prisma.appointment.count({ where: { patientId: req.user.userId } }),
            prisma.appointment.findMany({
                where: {
                    patientId: req.user.userId,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                    date: { gte: new Date() },
                },
                include: {
                    doctor: {
                        select: {
                            id: true, name: true, avatar: true,
                            doctorProfile: { select: { specialization: true, hospitalName: true } },
                        },
                    },
                },
                orderBy: { date: 'asc' },
                take: 3,
            }),
            prisma.prescription.count({ where: { patientId: req.user.userId } }),
            prisma.medicalRecord.count({ where: { patientId: req.user.userId } }),
        ]);

        const data = { totalAppointments, upcomingAppointments, totalPrescriptions, totalMedicalRecords };
        await setCache(cacheKey, data, 120);
        return sendResponse(res, 200, data);
    } catch (error) { next(error); }
};

module.exports = { getProfile, updateProfile, getAppointments, cancelAppointment, getMedicalHistory, getPrescriptions, getInvoices, getDashboardStats };
