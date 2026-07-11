const passport = require('passport');
const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateAuthTokens, verifyToken, generateToken } = require('../utils/tokenUtils');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const { deleteCache } = require('../config/redis');

const register = async (req, res, next) => {
    try {
        const { name, email, phone, password, role } = req.body;

        if (!name || !email || !password) {
            throw new ApiError(400, 'Name, email and password are required');
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new ApiError(409, 'User with this email already exists');

        const passwordHash = await hashPassword(password);
        const userRole = ['PATIENT', 'DOCTOR', 'ADMIN'].includes(role) ? role : 'PATIENT';

        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { name, email, phone: phone || '', passwordHash, role: userRole },
            });
            if (userRole === 'PATIENT') {
                await tx.patientProfile.create({ data: { userId: newUser.id } });
            } else if (userRole === 'DOCTOR') {
                await tx.doctorProfile.create({
                    data: {
                        userId: newUser.id,
                        specialization: 'Not Specified',
                        yearsOfExperience: 0,
                        hospitalName: 'Not Specified',
                        consultationFee: 0,
                    },
                });
            }
            return newUser;
        });

        const tokens = generateAuthTokens(user.id, user.role);

        return sendResponse(res, 201, {
            user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            ...tokens,
        }, 'Registration successful');
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) throw new ApiError(400, 'Email and password are required');

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new ApiError(401, 'Invalid email or password');
        if (!user.isActive) throw new ApiError(403, 'Your account has been blocked');
        if (!user.passwordHash) throw new ApiError(400, 'Please login with Google');

        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) throw new ApiError(401, 'Invalid email or password');

        const tokens = generateAuthTokens(user.id, user.role);

        return sendResponse(res, 200, {
            user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            ...tokens,
        }, 'Login successful');
    } catch (error) {
        next(error);
    }
};

const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'], session: false });

const googleCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user) => {
        try {
            if (err || !user) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
            }
            const tokens = generateAuthTokens(user.id, user.role);
            const redirectUrl = `${process.env.FRONTEND_URL}/auth/google/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&role=${user.role}`;
            return res.redirect(redirectUrl);
        } catch (error) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
        }
    })(req, res, next);
};

const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                avatar: true,
                isActive: true,
                createdAt: true,
            },
        });
        if (!user) throw new ApiError(404, 'User not found');
        return sendResponse(res, 200, user);
    } catch (error) {
        next(error);
    }
};

const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw new ApiError(401, 'Refresh token required');

        const decoded = verifyToken(refreshToken, 'refresh');
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || !user.isActive) throw new ApiError(401, 'Invalid user');

        const newAccessToken = generateToken(user.id, user.role, 'access');
        return sendResponse(res, 200, { accessToken: newAccessToken }, 'Token refreshed');
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        return sendResponse(res, 200, {}, 'Logout successful');
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, googleAuth, googleCallback, getMe, refreshAccessToken, logout };
