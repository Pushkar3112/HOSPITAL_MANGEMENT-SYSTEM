const { prisma } = require('../config/database');
const { sendResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { generateAvailableSlots } = require('../utils/appointmentUtils');
const { setCache, getCache, deleteCache, deleteCachePattern } = require('../config/redis');

const getProfile = async (req, res, next) => {
    try {
        const cacheKey = `doctor:profile:${req.user.userId}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const [user, profile] = await Promise.all([
            prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { id: true, name: true, email: true, phone: true, avatar: true },
            }),
            prisma.doctorProfile.findUnique({ where: { userId: req.user.userId } }),
        ]);

        if (!profile) throw new ApiError(404, 'Doctor profile not found');
        const data = { user, profile };
        await setCache(cacheKey, data, 300);
        return sendResponse(res, 200, data);
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const {
            name, phone, specialization, qualifications, yearsOfExperience,
            hospitalName, consultationFee, availableDays, dailyStartTime,
            dailyEndTime, slotDurationMinutes, customBreaks, maxPatientsPerSlot,
        } = req.body;

        if (name || phone) {
            await prisma.user.update({
                where: { id: req.user.userId },
                data: {
                    ...(name && { name }),
                    ...(phone && { phone }),
                },
            });
        }

        const profile = await prisma.doctorProfile.update({
            where: { userId: req.user.userId },
            data: {
                ...(specialization !== undefined && { specialization }),
                ...(qualifications !== undefined && { qualifications: qualifications || [] }),
                ...(yearsOfExperience !== undefined && { yearsOfExperience }),
                ...(hospitalName !== undefined && { hospitalName }),
                ...(consultationFee !== undefined && { consultationFee }),
                ...(availableDays !== undefined && { availableDays: availableDays || [] }),
                ...(dailyStartTime !== undefined && { dailyStartTime }),
                ...(dailyEndTime !== undefined && { dailyEndTime }),
                ...(slotDurationMinutes !== undefined && { slotDurationMinutes }),
                ...(customBreaks !== undefined && { customBreaks: customBreaks || [] }),
                ...(maxPatientsPerSlot !== undefined && { maxPatientsPerSlot }),
            },
        });

        await deleteCache(`doctor:profile:${req.user.userId}`);
        await deleteCachePattern(`doctor-search:*`);
        return sendResponse(res, 200, profile, 'Profile updated successfully');
    } catch (error) {
        next(error);
    }
};

const getAppointments = async (req, res, next) => {
    try {
        const { status, date } = req.query;
        const cacheKey = `doctor:appointments:${req.user.userId}:${status || 'all'}:${date || 'all'}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const where = { doctorId: req.user.userId };
        if (status) where.status = status;
        if (date) {
            const d = new Date(date);
            const d2 = new Date(date);
            d2.setDate(d2.getDate() + 1);
            where.date = { gte: d, lt: d2 };
        }

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                patient: {
                    select: { id: true, name: true, email: true, phone: true, avatar: true },
                },
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });

        await setCache(cacheKey, appointments, 120);
        return sendResponse(res, 200, appointments);
    } catch (error) {
        next(error);
    }
};

const confirmAppointment = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
        if (!appointment) throw new ApiError(404, 'Appointment not found');
        if (appointment.doctorId !== req.user.userId) throw new ApiError(403, 'Unauthorized');
        if (appointment.status !== 'PENDING') throw new ApiError(400, 'Appointment is not PENDING');

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CONFIRMED' },
        });
        await deleteCachePattern(`doctor:appointments:${req.user.userId}:*`);
        await deleteCachePattern(`patient:appointments:${appointment.patientId}:*`);
        return sendResponse(res, 200, updated, 'Appointment confirmed');
    } catch (error) {
        next(error);
    }
};

const completeAppointment = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
        if (!appointment) throw new ApiError(404, 'Appointment not found');
        if (appointment.doctorId !== req.user.userId) throw new ApiError(403, 'Unauthorized');
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
            throw new ApiError(400, 'Appointment cannot be completed in its current status');
        }

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'COMPLETED' },
        });
        await deleteCachePattern(`doctor:appointments:${req.user.userId}:*`);
        await deleteCachePattern(`patient:appointments:${appointment.patientId}:*`);
        return sendResponse(res, 200, updated, 'Appointment completed');
    } catch (error) {
        next(error);
    }
};

const getAvailableSlots = async (req, res, next) => {
    try {
        const { date, doctorId } = req.query;
        const targetDoctorId = doctorId || req.user.userId;
        if (!date) throw new ApiError(400, 'Date is required');

        const cacheKey = `doctor:slots:${targetDoctorId}:${date}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const doctor = await prisma.doctorProfile.findUnique({ where: { userId: targetDoctorId } });
        if (!doctor) throw new ApiError(404, 'Doctor not found');

        const appointments = await prisma.appointment.findMany({ where: { doctorId: targetDoctorId } });
        const slots = generateAvailableSlots(doctor, date, appointments);

        await setCache(cacheKey, slots, 60);
        return sendResponse(res, 200, slots);
    } catch (error) {
        next(error);
    }
};

const createPrescription = async (req, res, next) => {
    try {
        const {
            patientId, appointmentId, medications, lifestyleAdvice,
            followUpDate, diagnosis, notes, templateId,
        } = req.body;

        if (!patientId) throw new ApiError(400, 'Patient ID is required');
        if (!medications || !Array.isArray(medications) || medications.length === 0) {
            throw new ApiError(400, 'At least one medication is required');
        }

        const prescription = await prisma.$transaction(async (tx) => {
            const rx = await tx.prescription.create({
                data: {
                    patientId,
                    doctorId: req.user.userId,
                    medications,
                    lifestyleAdvice,
                    followUpDate: followUpDate ? new Date(followUpDate) : null,
                    diagnosis,
                    notes,
                    isFromTemplate: !!templateId,
                    templateId: templateId || null,
                },
            });

            if (appointmentId) {
                await tx.appointment.update({
                    where: { id: appointmentId },
                    data: { prescriptionId: rx.id },
                });
            }

            // Auto-create a medical record linking this prescription
            await tx.medicalRecord.create({
                data: {
                    patientId,
                    doctorId: req.user.userId,
                    appointmentId: appointmentId || null,
                    diagnoses: diagnosis ? [diagnosis] : [],
                    testsOrdered: [],
                    testResults: [],
                    attachments: [],
                    notes: notes || null,
                    prescriptionId: rx.id,
                },
            });

            return rx;
        });

        await deleteCachePattern(`patient:prescriptions:${patientId}:*`);
        await deleteCachePattern(`patient:medical:${patientId}`);
        await deleteCachePattern(`doctor:appointments:${req.user.userId}:*`);
        return sendResponse(res, 201, prescription, 'Prescription created & medical record updated');
    } catch (error) {
        next(error);
    }
};

const createMedicalRecord = async (req, res, next) => {
    try {
        const {
            patientId, appointmentId, diagnoses, testsOrdered,
            testResults, attachments, notes, prescriptionId,
        } = req.body;

        if (!patientId) throw new ApiError(400, 'Patient ID is required');

        const record = await prisma.medicalRecord.create({
            data: {
                patientId,
                doctorId: req.user.userId,
                appointmentId: appointmentId || null,
                diagnoses: diagnoses || [],
                testsOrdered: testsOrdered || [],
                testResults: testResults || [],
                attachments: attachments || [],
                notes,
                prescriptionId: prescriptionId || null,
            },
        });

        await deleteCachePattern(`patient:medical:${patientId}`);
        return sendResponse(res, 201, record, 'Medical record created successfully');
    } catch (error) {
        next(error);
    }
};

const createInvoice = async (req, res, next) => {
    try {
        const { patientId, appointmentId, totalAmount, items, paymentMode } = req.body;

        if (!patientId) throw new ApiError(400, 'Patient ID is required');
        if (!totalAmount) throw new ApiError(400, 'Total amount is required');

        const invoice = await prisma.invoice.create({
            data: {
                patientId,
                doctorId: req.user.userId,
                appointmentId: appointmentId || null,
                totalAmount,
                items: items || [],
                paymentMode: paymentMode || 'CASH',
                paymentStatus: paymentMode === 'CASH' ? 'PAID' : 'UNPAID',
            },
        });

        await deleteCachePattern(`patient:invoices:${patientId}`);
        return sendResponse(res, 201, invoice, 'Invoice created successfully');
    } catch (error) {
        next(error);
    }
};

const getPatients = async (req, res, next) => {
    try {
        const cacheKey = `doctor:patients:${req.user.userId}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        // Get all unique patients who have had appointments with this doctor
        const appointments = await prisma.appointment.findMany({
            where: { doctorId: req.user.userId },
            select: { patientId: true },
            distinct: ['patientId'],
        });

        const patientIds = appointments.map(a => a.patientId);

        const patients = await prisma.user.findMany({
            where: { id: { in: patientIds } },
            select: {
                id: true, name: true, email: true, phone: true, avatar: true,
                patientProfile: { select: { gender: true, dateOfBirth: true, bloodGroup: true, allergies: true, chronicConditions: true } },
            },
        });

        await setCache(cacheKey, patients, 300);
        return sendResponse(res, 200, patients);
    } catch (error) {
        next(error);
    }
};

const getDashboardStats = async (req, res, next) => {
    try {
        const cacheKey = `doctor:dashboard:${req.user.userId}`;
        const cached = await getCache(cacheKey);
        if (cached) return sendResponse(res, 200, cached);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalAppointments,
            todayAppointments,
            pendingAppointments,
            totalPatients,
            upcomingAppointments,
        ] = await Promise.all([
            prisma.appointment.count({ where: { doctorId: req.user.userId } }),
            prisma.appointment.findMany({
                where: {
                    doctorId: req.user.userId,
                    date: { gte: today, lt: tomorrow },
                },
                include: {
                    patient: { select: { id: true, name: true, email: true, avatar: true } },
                },
                orderBy: { startTime: 'asc' },
            }),
            prisma.appointment.count({
                where: { doctorId: req.user.userId, status: 'PENDING' },
            }),
            prisma.appointment.findMany({
                where: { doctorId: req.user.userId },
                select: { patientId: true },
                distinct: ['patientId'],
            }),
            prisma.appointment.findMany({
                where: {
                    doctorId: req.user.userId,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                    date: { gte: new Date() },
                },
                include: {
                    patient: { select: { id: true, name: true, email: true, avatar: true } },
                },
                orderBy: { date: 'asc' },
                take: 5,
            }),
        ]);

        const data = {
            totalAppointments,
            todayAppointments,
            pendingAppointments,
            totalPatients: totalPatients.length,
            upcomingAppointments,
        };

        await setCache(cacheKey, data, 120);
        return sendResponse(res, 200, data);
    } catch (error) {
        next(error);
    }
};

// Prescription Templates
const getTemplates = async (req, res, next) => {
    try {
        const templates = await prisma.prescriptionTemplate.findMany({
            where: { doctorId: req.user.userId },
            orderBy: { createdAt: 'desc' },
        });
        return sendResponse(res, 200, templates);
    } catch (error) {
        next(error);
    }
};

const createTemplate = async (req, res, next) => {
    try {
        const { name, medications, lifestyleAdvice, diagnosis, notes, followUpDays } = req.body;
        if (!name) throw new ApiError(400, 'Template name is required');
        if (!medications || !Array.isArray(medications) || medications.length === 0) {
            throw new ApiError(400, 'At least one medication is required');
        }

        const template = await prisma.prescriptionTemplate.create({
            data: {
                doctorId: req.user.userId,
                name,
                medications,
                lifestyleAdvice,
                diagnosis,
                notes,
                followUpDays,
            },
        });
        return sendResponse(res, 201, template, 'Template created successfully');
    } catch (error) {
        next(error);
    }
};

const updateTemplate = async (req, res, next) => {
    try {
        const { templateId } = req.params;
        const { name, medications, lifestyleAdvice, diagnosis, notes, followUpDays } = req.body;

        const template = await prisma.prescriptionTemplate.findUnique({ where: { id: templateId } });
        if (!template) throw new ApiError(404, 'Template not found');
        if (template.doctorId !== req.user.userId) throw new ApiError(403, 'Unauthorized');

        const updated = await prisma.prescriptionTemplate.update({
            where: { id: templateId },
            data: {
                ...(name && { name }),
                ...(medications && { medications }),
                ...(lifestyleAdvice !== undefined && { lifestyleAdvice }),
                ...(diagnosis !== undefined && { diagnosis }),
                ...(notes !== undefined && { notes }),
                ...(followUpDays !== undefined && { followUpDays }),
            },
        });
        return sendResponse(res, 200, updated, 'Template updated successfully');
    } catch (error) {
        next(error);
    }
};

const deleteTemplate = async (req, res, next) => {
    try {
        const { templateId } = req.params;
        const template = await prisma.prescriptionTemplate.findUnique({ where: { id: templateId } });
        if (!template) throw new ApiError(404, 'Template not found');
        if (template.doctorId !== req.user.userId) throw new ApiError(403, 'Unauthorized');

        await prisma.prescriptionTemplate.delete({ where: { id: templateId } });
        return sendResponse(res, 200, {}, 'Template deleted successfully');
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
    createMedicalRecord,
    createInvoice,
    getPatients,
    getDashboardStats,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
};
