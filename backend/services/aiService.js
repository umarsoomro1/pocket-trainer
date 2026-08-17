const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });

const generateWorkoutPlan = async (user, planType) => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25; 

  const prompt = `
    You are an expert fitness AI. Create a 4-week JSON workout plan for a ${age} year old weighing ${user.weight}lbs.
    Their primary goal is: ${user.goal}. 
    The workout split/style must strictly follow this structure: ${planType || 'General'}.

    Your response MUST be valid JSON matching this exact structure, with no markdown formatting or extra text outside the JSON:
    {
      "title": "Program Title",
      "schedule": [
        {
          "title": "Day 1 - Push",
          "type": "Strength",
          "exercises": [
            {
              "name": "Barbell Bench Press",
              "sets": 3,
              "reps_target": "8-10",
              "rest_seconds": 90,
              "muscle": "Chest, Triceps, Anterior Delts", 
              "benefits": "Keep core tight. Focus on a controlled eccentric movement."
            }
          ]
        }
      ]
    }
    
    CRITICAL RULES:
    1. Keep the "muscle" field extremely concise (just the primary muscle names).
    2. Keep the "benefits" field to a single, short sentence focusing on form or the primary mechanical benefit.
    3. If it is a Rest or Active Recovery day, leave the "exercises" array completely empty ([]).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const cleanText = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate plan");
  }
};

// NEW: Conversational AI function for the Chat Screen
const generateChatResponse = async (message, user) => {
  try {
    const prompt = `
      You are an elite AI personal trainer named Pocket Trainer. 
      You are talking to a user who weighs ${user.weight}lbs and whose primary goal is: ${user.goal}. 
      Keep your answers highly concise, motivating, and strictly related to fitness, nutrition, or recovery.
      
      User says: "${message}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    return response.text.trim();
  } catch (error) {
    console.error("Chat AI Error:", error);
    throw new Error("Failed to generate chat response");
  }
};

// Make sure to export BOTH functions
module.exports = { generateWorkoutPlan, generateChatResponse };