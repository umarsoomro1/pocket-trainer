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

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message content is required." });
    }

    // 1. Save user's message to MongoDB
    await ChatMessage.create({ userId: user._id, text: message.trim(), isUser: true });

    // 2. Build dynamic user context (Age, Weight, Active Plan, and Day)
    const age = user.dob
      ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970)
      : 25;

    let context = `Age: ${age}, Weight: ${user.weight || 150}lbs, Goal: ${user.goal || 'General Fitness'}.`;

    if (user.active_program_id) {
      const plan = await WorkoutPlan.findById(user.active_program_id);
      if (plan) {
        context += ` Active Program: "${plan.title}" (currently on Day ${user.current_day_index} of ${plan.schedule.length}).`;
      }
    }

    // 3. Call your fine-tuned model via aiService
    const aiReply = await generateChatResponse(message.trim(), user, context);

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