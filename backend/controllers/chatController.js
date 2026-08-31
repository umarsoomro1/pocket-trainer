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

// @desc    Send message to AI, auto-apply plan modifications to DB, and save history
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

    // 2. Fetch current active workout plan (if assigned)
    let currentPlan = null;
    if (user.active_program_id) {
      currentPlan = await WorkoutPlan.findById(user.active_program_id);
    }

    // 3. Call AI model with full workout context & modification capability
    const aiResult = await generateChatResponse(message.trim(), user, currentPlan);

    const replyText = aiResult.reply || "Your request has been processed.";

    // 4. If AI detected a split adjustment intent, update the WorkoutPlan in MongoDB
    if (aiResult.action === 'update_plan' && aiResult.updated_schedule && currentPlan) {
      currentPlan.schedule = aiResult.updated_schedule;
      await currentPlan.save();
      console.log(`[AI WORKOUT SYNC] Plan ${currentPlan._id} schedule updated successfully.`);
    }

    // 5. Save AI's response to Chat history
    await ChatMessage.create({ userId: user._id, text: replyText, isUser: false });

    // 6. Send reply back to frontend
    res.status(200).json({ 
      reply: replyText,
      planUpdated: aiResult.action === 'update_plan'
    });

  } catch (error) {
    console.error("Chat Controller Error:", error);
    res.status(500).json({ message: "Failed to communicate with AI trainer." });
  }
};

module.exports = { getChatHistory, sendChatMessage };