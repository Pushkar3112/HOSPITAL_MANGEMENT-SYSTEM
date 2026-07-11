const express = require('express');
const router = express.Router();
const { queryRAG, healthCheck, searchKnowledge } = require('../controllers/ragChatController');
const { authenticate } = require('../middlewares/authMiddleware');

// Health check is public
router.get('/health', healthCheck);

// Protected routes require auth
router.use(authenticate);
router.post('/query', queryRAG);   // frontend uses /query
router.post('/chat', queryRAG);    // backward compat
router.post('/search', searchKnowledge);

module.exports = router;
