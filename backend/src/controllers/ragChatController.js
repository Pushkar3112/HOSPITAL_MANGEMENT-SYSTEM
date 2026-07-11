const axios = require('axios');
const { sendResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { getCache, setCache } = require('../config/redis');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

/**
 * Query the RAG service — accepts both { query } and { message } from frontend
 */
const queryRAG = async (req, res, next) => {
    try {
        const { query, message, conversationHistory = [], conversation_history } = req.body;
        const userQuery = query || message;

        if (!userQuery || userQuery.trim().length === 0) {
            throw new ApiError(400, 'Query is required');
        }

        // Check Redis cache for identical queries (short TTL)
        const cacheKey = `rag:query:${userQuery.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 80)}`;
        const cached = await getCache(cacheKey);
        if (cached) {
            return sendResponse(res, 200, cached, 'AI response (cached)');
        }

        const payload = {
            query: userQuery.trim(),
            conversation_history: conversationHistory || conversation_history || [],
            user_id: req.user?.userId,
        };

        const response = await axios.post(`${RAG_SERVICE_URL}/chat`, payload, {
            timeout: 45000,
            headers: { 'Content-Type': 'application/json' },
        });

        const data = {
            answer: response.data.answer || response.data.reply || response.data.response,
            sources: response.data.sources || [],
            query_type: response.data.query_type || 'general',
            confidence: response.data.confidence || 0.8,
        };

        // Cache for 5 minutes (static info rarely changes)
        await setCache(cacheKey, data, 300);

        return sendResponse(res, 200, data, 'AI response generated');
    } catch (error) {
        if (error.response) {
            return next(new ApiError(error.response.status, error.response.data?.detail || 'RAG service error'));
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return next(new ApiError(503, 'AI service is currently unavailable. Please try again later.'));
        }
        if (error.code === 'ECONNABORTED') {
            return next(new ApiError(504, 'AI service request timed out. Please try again.'));
        }
        next(error);
    }
};

/**
 * Health check for RAG service
 */
const healthCheck = async (req, res, next) => {
    try {
        const response = await axios.get(`${RAG_SERVICE_URL}/health`, { timeout: 5000 });
        return sendResponse(res, 200, response.data, 'RAG service is healthy');
    } catch (error) {
        return sendResponse(res, 503, { status: 'unavailable', pipeline_ready: false }, 'RAG service is unavailable');
    }
};

/**
 * Search medical knowledge base
 */
const searchKnowledge = async (req, res, next) => {
    try {
        const { query, top_k = 5 } = req.body;
        if (!query || query.trim().length === 0) {
            throw new ApiError(400, 'Query is required');
        }
        const response = await axios.post(
            `${RAG_SERVICE_URL}/search`,
            { query: query.trim(), top_k: parseInt(top_k) },
            { timeout: 15000, headers: { 'Content-Type': 'application/json' } },
        );
        return sendResponse(res, 200, response.data, 'Search completed');
    } catch (error) {
        if (error.response) {
            return next(new ApiError(error.response.status, error.response.data?.detail || 'RAG service error'));
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return next(new ApiError(503, 'AI service is currently unavailable'));
        }
        next(error);
    }
};

// Keep backward compatibility
const chat = queryRAG;

module.exports = { chat, queryRAG, healthCheck, searchKnowledge };
