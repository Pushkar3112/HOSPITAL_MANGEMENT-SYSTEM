const { prisma } = require('../config/database');
const { sendResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { setCache, getCache, deleteCachePattern } = require('../config/redis');

const getAllUsers = async (req, res, next) => {
    try {
        const { role, page = 1, limit = 20, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true, name: true, email: true, phone: true, role: true,
                    isActive: true, avatar: true, createdAt: true,
                    doctorProfile: { select: { specialization: true, isVerified: true } },
                },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        return sendResponse(res, 200, {
            users,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                patientProfile: true,
                doctorProfile: true,
            },
        });
        if (!user) throw new ApiError(404, 'User not found');
        return sendResponse(res, 200, user);
    } catch (error) {
        next(error);
    }
};

const toggleUserStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new ApiError(404, 'User not found');

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
        });

        return sendResponse(res, 200, { id: updated.id, isActive: updated.isActive }, `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
        next(error);
    }
};

const verifyDoctor = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorId } });
        if (!profile) throw new ApiError(404, 'Doctor profile not found');

        const updated = await prisma.doctorProfile.update({
            where: { userId: doctorId },
            data: { isVerified: !profile.isVerified },
        });

        await deleteCachePattern('doctor-search:*');
        return sendResponse(res, 200, updated, `Doctor ${updated.isVerified ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
        next(error);
    }
};

const getDashboardStats = async (req, res, next) => {
    try {
        const cacheKey = 'admin:dashboard';
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            totalPatients,
            totalDoctors,
            totalAppointments,
            todayAppointments,
            pendingAppointments,
            thisMonthAppointments,
            recentUsers,
        ] = await Promise.all([
            prisma.user.count({ where: { role: 'PATIENT' } }),
            prisma.user.count({ where: { role: 'DOCTOR' } }),
            prisma.appointment.count(),
            prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
            prisma.appointment.count({ where: { status: 'PENDING' } }),
            prisma.appointment.count({ where: { createdAt: { gte: thisMonthStart } } }),
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
            }),
        ]);

        const data = {
            totalUsers: totalPatients + totalDoctors,
            totalPatients,
            totalDoctors,
            totalAppointments,
            todayAppointments,
            pendingAppointments,
            completedAppointments: await prisma.appointment.count({ where: { status: 'COMPLETED' } }),
            thisMonthAppointments,
            recentUsers,
            recentAppointments: await prisma.appointment.findMany({
                take: 8,
                orderBy: { createdAt: 'desc' },
                include: {
                    patient: { select: { id: true, name: true } },
                    doctor: { select: { id: true, name: true } },
                },
            }),
        };

        await setCache(cacheKey, data, 120);
        return sendResponse(res, 200, data);
    } catch (error) {
        next(error);
    }
};

const getAllAppointments = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20, date } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (status) where.status = status;
        if (date) {
            const d = new Date(date);
            const d2 = new Date(date);
            d2.setDate(d2.getDate() + 1);
            where.date = { gte: d, lt: d2 };
        }

        const [appointments, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                include: {
                    patient: { select: { id: true, name: true, email: true, avatar: true } },
                    doctor: {
                        select: {
                            id: true, name: true, email: true, avatar: true,
                            doctorProfile: { select: { specialization: true } },
                        },
                    },
                },
                skip,
                take: parseInt(limit),
                orderBy: { date: 'desc' },
            }),
            prisma.appointment.count({ where }),
        ]);

        return sendResponse(res, 200, {
            appointments,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new ApiError(404, 'User not found');
        if (user.role === 'ADMIN') throw new ApiError(403, 'Cannot delete admin users');

        await prisma.user.delete({ where: { id: userId } });
        return sendResponse(res, 200, {}, 'User deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    toggleUserStatus,
    verifyDoctor,
    getDashboardStats,
    getAllAppointments,
    deleteUser,
};
