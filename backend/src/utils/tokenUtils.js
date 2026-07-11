const jwt = require('jsonwebtoken');

const generateToken = (userId, role, type = 'access') => {
    const secret = type === 'access'
        ? process.env.JWT_SECRET
        : process.env.JWT_REFRESH_SECRET;
    const expiresIn = type === 'access'
        ? (process.env.JWT_EXPIRE || '15m')
        : (process.env.JWT_REFRESH_EXPIRE || '7d');

    return jwt.sign({ userId, role }, secret, { expiresIn });
};

const generateAuthTokens = (userId, role) => {
    return {
        accessToken: generateToken(userId, role, 'access'),
        refreshToken: generateToken(userId, role, 'refresh'),
    };
};

const verifyToken = (token, type = 'access') => {
    const secret = type === 'access'
        ? process.env.JWT_SECRET
        : process.env.JWT_REFRESH_SECRET;
    return jwt.verify(token, secret);
};

module.exports = { generateToken, generateAuthTokens, verifyToken };
