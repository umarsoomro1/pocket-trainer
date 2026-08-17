const express = require('express');
const router = express.Router();
const { getChatHistory, sendChatMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getChatHistory);
router.post('/', protect, sendChatMessage);

module.exports = router;