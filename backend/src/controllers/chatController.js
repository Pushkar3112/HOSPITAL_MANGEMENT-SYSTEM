const { prisma } = require('../config/database');
const { sendResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Get all chat sessions for the current user.
 * Uses nested `select` (not `include`) inside the top-level `include`.
 */
const getSessions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        const where = role === 'PATIENT'
            ? { patientId: userId }
            : role === 'DOCTOR'
            ? { doctorId: userId }
            : {};

        const sessions = await prisma.chatSession.findMany({
            where,
            include: {
                patient: {
                    select: { id: true, name: true, avatar: true, email: true },
                },
                doctor: {
                    // Use nested SELECT inside include — no mixing of include+select on same relation
                    select: {
                        id: true, name: true, avatar: true, email: true,
                        doctorProfile: { select: { specialization: true } },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { id: true, message: true, senderId: true, createdAt: true, isRead: true },
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });

        return sendResponse(res, 200, sessions);
    } catch (error) { next(error); }
};

/**
 * Get messages for a specific chat session (paginated, oldest-first).
 */
const getMessages = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
        if (!session) throw new ApiError(404, 'Chat session not found');

        if (session.patientId !== req.user.userId && session.doctorId !== req.user.userId) {
            throw new ApiError(403, 'Access denied');
        }

        const [messages, total] = await Promise.all([
            prisma.chatMessage.findMany({
                where: { sessionId },
                include: {
                    sender: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.chatMessage.count({ where: { sessionId } }),
        ]);

        // Mark incoming messages as read
        await prisma.chatMessage.updateMany({
            where: { sessionId, receiverId: req.user.userId, isRead: false },
            data: { isRead: true },
        });

        return sendResponse(res, 200, {
            messages: messages.reverse(),
            pagination: { total, page: parseInt(page), limit: parseInt(limit) },
        });
    } catch (error) { next(error); }
};

/**
 * Get or create a chat session between the logged-in user and another user.
 */
const getOrCreateSession = async (req, res, next) => {
    try {
        const { otherUserId } = req.body;
        if (!otherUserId) throw new ApiError(400, 'Other user ID is required');

        const [currentUser, otherUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, role: true } }),
            prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true, role: true } }),
        ]);

        if (!otherUser) throw new ApiError(404, 'User not found');

        let patientId, doctorId;
        if (currentUser.role === 'PATIENT' && otherUser.role === 'DOCTOR') {
            patientId = currentUser.id; doctorId = otherUser.id;
        } else if (currentUser.role === 'DOCTOR' && otherUser.role === 'PATIENT') {
            doctorId = currentUser.id; patientId = otherUser.id;
        } else {
            throw new ApiError(400, 'Chat must be between a patient and a doctor');
        }

        const session = await prisma.chatSession.upsert({
            where: { patientId_doctorId: { patientId, doctorId } },
            update: {},
            create: { patientId, doctorId },
            include: {
                patient: { select: { id: true, name: true, avatar: true } },
                doctor: {
                    select: {
                        id: true, name: true, avatar: true,
                        doctorProfile: { select: { specialization: true } },
                    },
                },
            },
        });

        return sendResponse(res, 200, session, 'Session ready');
    } catch (error) { next(error); }
};

/**
 * Get total unread message count for the current user.
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await prisma.chatMessage.count({
            where: { receiverId: req.user.userId, isRead: false },
        });
        return sendResponse(res, 200, { unreadCount: count });
    } catch (error) { next(error); }
};

module.exports = { getSessions, getMessages, getOrCreateSession, getUnreadCount };
