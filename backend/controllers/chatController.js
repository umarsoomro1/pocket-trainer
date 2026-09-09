const ChatMessage = require('../models/ChatMessage');
const WorkoutPlan = require('../models/WorkoutPlan');
const { generateChatResponse, modifyWorkoutPlan } = require('../services/aiService');
const { getExerciseGif } = require('../services/exerciseService');

// F7: Prompt length constraint
const MAX_MESSAGE_LENGTH = 500;

// Broad, natural intent detection for routine mutations
const isModificationIntent = (text) => {
  const clean = text.trim().toLowerCase();

  // 1. Immediately ignore read-only / informational queries
  const isReadOnly = /^(what|how|show|view|tell me|explain|can you explain|list|describe|preview)\b/i.test(clean);
  const containsMutationVerb = /\b(change|replace|swap|update|modify|substitute|switch|remove|delete|add|put|insert|give me abs|include abs)\b/i.test(clean);
  
  if (isReadOnly && !containsMutationVerb) {
    return false;
  }

  // 2. Trigger if any mutation verb or exercise swap phrase is present
  const mutationActionRegex = /\b(change|modify|update|adjust|switch|replace|swap|substitute|remove|delete|add|put|instead of|to my workout|in my workout|to day)\b/i;
  return mutationActionRegex.test(clean);
};

// Resolves which schedule day the user is targeting
const resolveTargetDayIndex = (text, schedule, currentDayIndex) => {
  const lower = text.toLowerCase();

  // 1. Explicit Day Number (e.g. "day 2", "day 3")
  const dayMatch = lower.match(/day\s*(\d+)/i);
  if (dayMatch && dayMatch[1]) {
    const parsedDay = parseInt(dayMatch[1], 10);
    if (parsedDay >= 1 && parsedDay <= schedule.length) {
      return parsedDay - 1;
    }
  }

  // 2. Explicit Muscle Target
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

  // 3. Fallback to user's currently active day index
  return (currentDayIndex - 1) % schedule.length;
};

// @desc    Get user's chat history (bounded to last 50 items)
// @route   GET /api/chat
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    
    // Fetch newest messages first up to limit, then reverse to restore chronological reading order
    const messages = await ChatMessage.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

// @desc    Send message to AI, conditionally update DB on routine changes, record chat
// @route   POST /api/chat
// @access  Private
const sendChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message content is required." });
    }

    const cleanMsg = message.trim();

    // F7: Guard against prompt injection and excessive compute drainage
    if (cleanMsg.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Message exceeds the ${MAX_MESSAGE_LENGTH} character limit. Please shorten your question.`
      });
    }

    await ChatMessage.create({ userId: user._id, text: cleanMsg, isUser: true });

    let currentPlan = null;
    if (user.active_program_id) {
      currentPlan = await WorkoutPlan.findById(user.active_program_id);
    }

    let planWasUpdated = false;

    // Mutate MongoDB routine if modification intent is detected
    if (currentPlan && currentPlan.schedule?.length > 0 && isModificationIntent(cleanMsg)) {
      const targetIdx = resolveTargetDayIndex(cleanMsg, currentPlan.schedule, user.current_day_index || 1);
      const updatedSession = await modifyWorkoutPlan(cleanMsg, currentPlan, targetIdx);

      if (updatedSession && Array.isArray(updatedSession.exercises) && updatedSession.exercises.length > 0) {
        // Fetch demonstration GIFs for any newly introduced exercises in parallel
        const gifLookups = updatedSession.exercises.map(async (ex) => {
          const oldEx = currentPlan.schedule[targetIdx].exercises.find(
            e => e.name.toLowerCase() === ex.name.toLowerCase()
          );
          if (oldEx && oldEx.gif_url) {
            ex.gif_url = oldEx.gif_url;
          } else {
            try {
              const fetchPromise = getExerciseGif(ex.name);
              const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
              ex.gif_url = await Promise.race([fetchPromise, timeoutPromise]);
            } catch (e) {
              ex.gif_url = null;
            }
          }
        });

        await Promise.allSettled(gifLookups);

        currentPlan.schedule[targetIdx] = updatedSession;
        currentPlan.markModified('schedule');
        await currentPlan.save();

        planWasUpdated = true;
        console.log(`[AI WORKOUT SYNC] Schedule index ${targetIdx} ("${currentPlan.schedule[targetIdx].title}") updated in MongoDB.`);
      } else {
        console.warn("[AI WORKOUT SYNC] Model did not return a valid replacement session structure.");
      }
    }

    // Build context for conversational LLM
    let context = '';
    if (currentPlan) {
      const fullScheduleSummary = currentPlan.schedule
        .map((s, idx) => `Day ${idx + 1}: ${s.title} (${(s.exercises || []).map(e => e.name).join(', ')})`)
        .join(' | ');

      context = `Active Plan: "${currentPlan.title}". Current Day: Day ${user.current_day_index}. Schedule: [${fullScheduleSummary}].`;

      if (planWasUpdated) {
        context += ` (System Status: The database was just updated to reflect the user's requested exercise change).`;
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
    next(error);
  }
};

module.exports = { getChatHistory, sendChatMessage };