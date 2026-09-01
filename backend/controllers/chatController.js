const ChatMessage = require('../models/ChatMessage');
const WorkoutPlan = require('../models/WorkoutPlan');
const { generateChatResponse, modifyWorkoutPlan } = require('../services/aiService');

// Detects workout alteration intents
const isModificationIntent = (text) => {
  const pattern = /(change|modify|update|adjust|switch|replace|add|increase|more exercises?|fewer exercises?|split|routine|workout plan|hypertrophy|sets|reps)/i;
  return pattern.test(text);
};

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

// @desc    Send message to AI, auto-sync modifications to DB, and save history
// @route   POST /api/chat
// @access  Private
const sendChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message content is required." });
    }

    const cleanMsg = message.trim();

    // 1. Save user's message to MongoDB
    await ChatMessage.create({ userId: user._id, text: cleanMsg, isUser: true });

    // 2. Fetch current workout plan
    let currentPlan = null;
    if (user.active_program_id) {
      currentPlan = await WorkoutPlan.findById(user.active_program_id);
    }

    let planWasUpdated = false;

    // 3. Mutate MongoDB routine if modification intent is present
    if (currentPlan && isModificationIntent(cleanMsg)) {
      const updatedPlanResult = await modifyWorkoutPlan(cleanMsg, currentPlan);
      if (updatedPlanResult && updatedPlanResult.schedule && updatedPlanResult.schedule.length > 0) {
        currentPlan.schedule = updatedPlanResult.schedule;
        if (updatedPlanResult.title) currentPlan.title = updatedPlanResult.title;
        await currentPlan.save();
        planWasUpdated = true;
      }
    }

    // 4. Generate conversational response
    let context = '';
    if (currentPlan) {
      context = `Active Plan: "${currentPlan.title}". Current Day: ${user.current_day_index}.`;
      if (planWasUpdated) {
        context += ` (System Status: The user's active workout plan in the database has just been successfully updated with 5-6 exercises per day according to their instructions).`;
      }
    }

    let aiReply = await generateChatResponse(cleanMsg, user, context);
    aiReply = aiReply.replace(/```json/gi, '').replace(/```/g, '').trim();

    // 5. Save AI reply to chat history
    await ChatMessage.create({ userId: user._id, text: aiReply, isUser: false });

    // 6. Return response
    res.status(200).json({ 
      reply: aiReply,
      planUpdated: planWasUpdated
    });

  } catch (error) {
    console.error("Chat Controller Error:", error);
    res.status(500).json({ message: "Failed to communicate with AI trainer." });
  }
};

module.exports = { getChatHistory, sendChatMessage };