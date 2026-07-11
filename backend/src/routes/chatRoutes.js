const express = require('express');
const router = express.Router();
const { getSessions, getMessages, getOrCreateSession, getUnreadCount } = require('../controllers/chatController');
const { authenticate } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticate);

router.get('/sessions', getSessions);
router.post('/sessions', getOrCreateSession);
router.get('/sessions/:sessionId/messages', getMessages);
router.get('/unread', getUnreadCount);

module.exports = router;
