const { verifyToken } = require('../utils/tokenUtils');
const ApiError = require('../utils/apiError');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token, 'access');
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError(403, 'Access denied'));
        }
        next();
    };
};

module.exports = { authenticate, authorize };
