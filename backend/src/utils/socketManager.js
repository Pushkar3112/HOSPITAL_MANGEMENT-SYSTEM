const { Server } = require('socket.io');
const { prisma } = require('../config/database');
const { verifyToken } = require('./tokenUtils');

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Auth middleware for socket
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication required'));
            const decoded = verifyToken(token, 'access');
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.userId;
        console.log(`🔌 Socket connected: ${userId}`);

        // Join personal room
        socket.join(`user:${userId}`);

        // Send message
        socket.on('send_message', async (data) => {
            try {
                const { receiverId, message, sessionId } = data;

                // Get or create session
                let session;
                if (sessionId) {
                    session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
                }

                if (!session) {
                    // Determine patientId and doctorId
                    const sender = await prisma.user.findUnique({ where: { id: userId } });
                    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

                    const patientId = sender.role === 'PATIENT' ? userId : receiverId;
                    const doctorId = sender.role === 'DOCTOR' ? userId : receiverId;

                    session = await prisma.chatSession.upsert({
                        where: { patientId_doctorId: { patientId, doctorId } },
                        update: { lastMessage: message, lastMessageAt: new Date() },
                        create: { patientId, doctorId, lastMessage: message, lastMessageAt: new Date() },
                    });
                } else {
                    await prisma.chatSession.update({
                        where: { id: session.id },
                        data: { lastMessage: message, lastMessageAt: new Date() },
                    });
                }

                // Save message
                const chatMessage = await prisma.chatMessage.create({
                    data: {
                        sessionId: session.id,
                        senderId: userId,
                        receiverId,
                        message,
                    },
                    include: {
                        sender: { select: { id: true, name: true, avatar: true } },
                    },
                });

                // Emit to both sender and receiver
                io.to(`user:${userId}`).emit('new_message', { ...chatMessage, sessionId: session.id });
                io.to(`user:${receiverId}`).emit('new_message', { ...chatMessage, sessionId: session.id });

            } catch (err) {
                console.error('Socket send_message error:', err.message);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Mark messages as read
        socket.on('mark_read', async (data) => {
            try {
                const { sessionId } = data;
                await prisma.chatMessage.updateMany({
                    where: { sessionId, receiverId: userId },
                    data: { isRead: true },
                });
            } catch (err) {
                console.error('Socket mark_read error:', err.message);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${userId}`);
        });
    });

    return io;
};

const getIO = () => io;

module.exports = { initializeSocket, getIO };
