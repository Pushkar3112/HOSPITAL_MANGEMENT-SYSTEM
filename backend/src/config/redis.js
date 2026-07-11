const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380',
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error:', err.message));
redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Could not connect to Redis:', err.message);
    }
};

// Cache helpers
const setCache = async (key, value, ttlSeconds = 300) => {
    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
        console.error('Redis setCache error:', err.message);
    }
};

const getCache = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Redis getCache error:', err.message);
        return null;
    }
};

const deleteCache = async (key) => {
    try {
        await redisClient.del(key);
    } catch (err) {
        console.error('Redis deleteCache error:', err.message);
    }
};

const deleteCachePattern = async (pattern) => {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (err) {
        console.error('Redis deleteCachePattern error:', err.message);
    }
};

module.exports = { redisClient, connectRedis, setCache, getCache, deleteCache, deleteCachePattern };
