const ChatMessage = require('../models/ChatMessage');
const WorkoutPlan = require('../models/WorkoutPlan');
const { generateChatResponse, modifyWorkoutPlan } = require('../services/aiService');

// Strict Action-Verb intent detection
const isModificationIntent = (text) => {
  const clean = text.trim().toLowerCase();

  // 1. Immediately ignore read-only / informational questions
  const isQuestion = /^(what|how|show|view|tell me|explain|can you explain|list|describe|preview)\b/i.test(clean);
  if (isQuestion && !/(change|replace|swap|update|modify|substitute|switch|remove|delete|add)/i.test(clean)) {
    return false;
  }

  // 2. Only trigger if explicit mutation action verbs are present
  const mutationActionRegex = /\b(change|modify|update|adjust|switch|replace|swap|substitute|remove|delete|add)\b/i;
  return mutationActionRegex.test(clean);
};

// Determines which schedule day the user is targeting in their message
const resolveTargetDayIndex = (text, schedule, currentDayIndex) => {
  const lower = text.toLowerCase();

  // Check explicit day numbers first (e.g., "day 2", "day 3")
  const dayMatch = lower.match(/day\s*(\d+)/i);
  if (dayMatch && dayMatch[1]) {
    const parsedDay = parseInt(dayMatch[1], 10);
    if (parsedDay >= 1 && parsedDay <= schedule.length) {
      return parsedDay - 1;
    }
  }
  
  // Check muscle names in prompt (e.g. "chest", "back", "leg", "push", "pull", "arm", "shoulder")
  for (let i = 0; i < schedule.length; i++) {
    const titleLower = schedule[i].title.toLowerCase();
    if (lower.includes('chest') && titleLower.includes('chest')) return i;
    if (lower.includes('back') && titleLower.includes('back')) return i;
    if (lower.includes('shoulder') && titleLower.includes('shoulder')) return i;
    if (lower.includes('leg') && titleLower.includes('leg')) return i;
    if (lower.includes('arm') && titleLower.includes('arm')) return i;
    if (lower.includes('push') && titleLower.includes('push')) return i;
    if (lower.includes('pull') && titleLower.includes('pull')) return i;
  }

  // Fallback to active day
  return (currentDayIndex - 1) % schedule.length;
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

// @desc    Send message to AI, conditionally update DB on strict mutation intent, save history
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

    // Mutate MongoDB routine ONLY if strict modification action intent is present
    if (currentPlan && currentPlan.schedule?.length > 0 && isModificationIntent(cleanMsg)) {
      const targetIdx = resolveTargetDayIndex(cleanMsg, currentPlan.schedule, user.current_day_index || 1);
      const updatedSession = await modifyWorkoutPlan(cleanMsg, currentPlan, targetIdx);

      if (updatedSession && Array.isArray(updatedSession.exercises) && updatedSession.exercises.length > 0) {
        currentPlan.schedule[targetIdx] = updatedSession;
        currentPlan.markModified('schedule');
        await currentPlan.save();
        
        planWasUpdated = true;
        console.log(`[AI WORKOUT SYNC] Schedule index ${targetIdx} ("${currentPlan.schedule[targetIdx].title}") updated in MongoDB.`);
      } else {
        console.warn("[AI WORKOUT SYNC] Modification failed to parse or returned invalid exercises.");
      }
    }

    // Build context for conversational reply
    let context = '';
    if (currentPlan) {
      const fullScheduleSummary = currentPlan.schedule
        .map((s, idx) => `Day ${idx + 1}: ${s.title} (${(s.exercises || []).map(e => e.name).join(', ')})`)
        .join(' | ');

      context = `Active Plan: "${currentPlan.title}". Current Active Day: Day ${user.current_day_index}. Full Plan Outline: [${fullScheduleSummary}].`;

      if (planWasUpdated) {
        context += ` (System Status: The user's active workout plan was just successfully updated in the database).`;
      }
    }

    let aiReply = await generateChatResponse(cleanMsg, user, context);
    aiReply = aiReply.replace(/```json/gi, '').replace(/```/g, '').trim();

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