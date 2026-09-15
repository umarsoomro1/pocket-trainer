const express = require('express');
const router = express.Router();
const { getChatHistory, sendChatMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimiter');

// F14: Wire chatLimiter to guard Modal LLM compute billing and database load
router.get('/', protect, chatLimiter, getChatHistory);
router.post('/', protect, chatLimiter, sendChatMessage);

module.exports = router;