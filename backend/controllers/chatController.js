const ChatMessage = require('../models/ChatMessage');
const WorkoutPlan = require('../models/WorkoutPlan');
const { generateChatResponse } = require('../services/aiService');

// @desc    Get user's chat history
// @route   GET /api/chat
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send message to AI and save to DB
// @route   POST /api/chat
// @access  Private
const sendChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    // 1. Save user's message to MongoDB
    await ChatMessage.create({ userId: user._id, text: message, isUser: true });

    // 2. Build dynamic user context
    let context = '';
    if (user.active_program_id) {
      const plan = await WorkoutPlan.findById(user.active_program_id);
      if (plan) {
        context = `Current Plan: ${plan.title}. The user is currently on day ${user.current_day_index} of this plan.`;
      }
    }

    // 3. Call your fine-tuned model via aiService
    const aiReply = await generateChatResponse(message, user, context);

    // 4. Save AI's response to MongoDB
    await ChatMessage.create({ userId: user._id, text: aiReply, isUser: false });

    // 5. Send reply back to frontend
    res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error("Chat Controller Error:", error);
    res.status(500).json({ message: "Failed to communicate with AI trainer." });
  }
};

module.exports = { getChatHistory, sendChatMessage };