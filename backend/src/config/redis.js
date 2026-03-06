const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380',
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected successfully'));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Could not connect to Redis:', err);
    }
};

module.exports = { redisClient, connectRedis };
