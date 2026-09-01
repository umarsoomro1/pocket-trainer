const ChatMessage = require('../models/ChatMessage');
const WorkoutPlan = require('../models/WorkoutPlan');
const { generateChatResponse, modifyWorkoutPlan } = require('../services/aiService');

const isModificationIntent = (text) => {
  const pattern = /(change|modify|update|adjust|switch|replace|swap|add|increase|more exercises?|fewer exercises?|split|routine|workout plan|hypertrophy|sets|reps)/i;
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
    await ChatMessage.create({ userId: user._id, text: cleanMsg, isUser: true });

    let currentPlan = null;
    if (user.active_program_id) {
      currentPlan = await WorkoutPlan.findById(user.active_program_id);
    }

    let planWasUpdated = false;

    // Mutate MongoDB routine if modification intent is triggered
    if (currentPlan && isModificationIntent(cleanMsg)) {
      const updatedPlanResult = await modifyWorkoutPlan(cleanMsg, currentPlan);
      
      if (updatedPlanResult && Array.isArray(updatedPlanResult.schedule) && updatedPlanResult.schedule.length > 0) {
        currentPlan.schedule = updatedPlanResult.schedule;
        if (updatedPlanResult.title) currentPlan.title = updatedPlanResult.title;
        
        // Ensure Mongoose detects nested array modifications
        currentPlan.markModified('schedule');
        await currentPlan.save();
        planWasUpdated = true;
        console.log(`[AI WORKOUT SYNC] Plan ${currentPlan._id} schedule successfully updated and saved in MongoDB.`);
      } else {
        console.warn("[AI WORKOUT SYNC] Modification returned null or invalid schedule. Retaining existing plan.");
      }
    }

    // Build context for chat response
    let context = '';
    if (currentPlan) {
      context = `Active Plan: "${currentPlan.title}". Current Day: ${user.current_day_index}.`;
      if (planWasUpdated) {
        context += ` (System Notice: The user's active workout plan was just successfully updated in MongoDB with proper muscle biomechanics).`;
      }
    }

    let aiReply = await generateChatResponse(cleanMsg, user, context);

    await ChatMessage.create({ userId: user._id, text: aiReply, isUser: false });

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