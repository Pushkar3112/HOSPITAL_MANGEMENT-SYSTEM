const { prisma } = require('../config/database');
const { sendResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { generateAvailableSlots } = require('../utils/appointmentUtils');
const { deleteCachePattern } = require('../config/redis');

const bookAppointment = async (req, res, next) => {
    try {
        const {
            doctorId, date, startTime, visitType, reasonForVisit,
        } = req.body;

        if (!doctorId || !date || !startTime || !visitType) {
            throw new ApiError(400, 'Doctor ID, date, start time, and visit type are required');
        }

        // Get doctor profile for fee and slot calculation
        const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorId } });
        if (!doctorProfile) throw new ApiError(404, 'Doctor profile not found');

        // Check if slot is available
        const existingAppointments = await prisma.appointment.findMany({ where: { doctorId } });
        const slots = generateAvailableSlots(doctorProfile, date, existingAppointments);
        const slot = slots.find(s => s.startTime === startTime);

        if (!slot) throw new ApiError(400, 'Invalid time slot');
        if (!slot.available && !slot.isAvailable) throw new ApiError(409, 'This time slot is already booked');

        // Calculate end time
        const endTime = slot.endTime;

        const appointment = await prisma.appointment.create({
            data: {
                patientId: req.user.userId,
                doctorId,
                date: new Date(date),
                startTime,
                endTime,
                visitType,
                reasonForVisit,
                consultationFee: doctorProfile.consultationFee,
                status: 'CONFIRMED', // auto-confirm for testing convenience
                paymentStatus: 'UNPAID',
            },
            include: {
                doctor: {
                    select: {
                        id: true, name: true, email: true, avatar: true,
                        doctorProfile: { select: { specialization: true, hospitalName: true } },
                    },
                },
            },
        });

        await deleteCachePattern(`patient:appointments:${req.user.userId}:*`);
        await deleteCachePattern(`doctor:appointments:${doctorId}:*`);
        await deleteCachePattern(`doctor:slots:${doctorId}:*`);
        await deleteCachePattern(`patient:dashboard:${req.user.userId}`);
        await deleteCachePattern(`doctor:dashboard:${doctorId}`);

        return sendResponse(res, 201, appointment, 'Appointment booked successfully');
    } catch (error) {
        next(error);
    }
};

const getAppointmentById = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                patient: {
                    select: {
                        id: true, name: true, email: true, phone: true, avatar: true,
                        patientProfile: true,
                    },
                },
                doctor: {
                    select: {
                        id: true, name: true, email: true, avatar: true,
                        doctorProfile: true,
                    },
                },
                prescription: true,
                medicalRecords: true,
                invoices: true,
            },
        });

        if (!appointment) throw new ApiError(404, 'Appointment not found');

        // Ensure the requesting user is either the patient or doctor
        if (
            appointment.patientId !== req.user.userId
            && appointment.doctorId !== req.user.userId
            && req.user.role !== 'ADMIN'
        ) {
            throw new ApiError(403, 'Access denied');
        }

        return sendResponse(res, 200, appointment);
    } catch (error) {
        next(error);
    }
};

const updateAppointmentNotes = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;
        const { notesFromDoctor } = req.body;

        const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
        if (!appointment) throw new ApiError(404, 'Appointment not found');
        if (appointment.doctorId !== req.user.userId) throw new ApiError(403, 'Only the doctor can add notes');

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { notesFromDoctor },
        });

        await deleteCachePattern(`doctor:appointments:${req.user.userId}:*`);
        return sendResponse(res, 200, updated, 'Notes updated successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = { bookAppointment, getAppointmentById, updateAppointmentNotes };
