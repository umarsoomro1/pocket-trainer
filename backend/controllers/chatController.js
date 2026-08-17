const { GoogleGenAI } = require('@google/genai');
const ChatMessage = require('../models/ChatMessage');
const WorkoutPlan = require('../models/WorkoutPlan');

// Initialize the GoogleGenAI instance using your environment variable
const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });

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

    // 2. Build the dynamic user context
    // Calculate age from dob for the prompt
    const age = user.dob 
      ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
      : 25;

    let context = `User Stats: Age ${age}, Weight ${user.weight}lbs, Goal: ${user.goal}.`;
    
    if (user.active_program_id) {
      const plan = await WorkoutPlan.findById(user.active_program_id);
      if (plan) {
         context += ` Current Plan: ${plan.title}. The user is currently on day ${user.current_day_index} of this plan.`;
      }
    }

    // 3. Call the AI with context injected as system instructions
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: `You are an elite AI personal trainer named Pocket Trainer. Use the following user data to provide specific, medically safe fitness advice: ${context}. Keep your answers concise and directly actionable for a mobile app chat interface.`
      }
    });

    const aiReply = response.text.trim();

    // 4. Save AI's response to MongoDB
    await ChatMessage.create({ userId: user._id, text: aiReply, isUser: false });

    // 5. Send the reply back to the frontend
    res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ message: "Failed to communicate with AI trainer." });
  }
};

module.exports = { getChatHistory, sendChatMessage };