const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

/**
 * Workout Plan Generator -> Forces strict JSON schema
 */
const generateWorkoutPlan = async (user, planType) => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Create a 4-week workout routine for a ${age} year old weighing ${user.weight}lbs with goal: ${user.goal}. Style: ${planType || 'General'}.`;
  
  const system_prompt = `You are PocketTrainer AI. You MUST generate workout routines exclusively in valid raw JSON matching this schema:
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
          "muscle": "Chest",
          "benefits": "Keep core tight and elbows tucked."
        }
      ]
    }
  ]
}
Do not write explanations or markdown outside the JSON.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 1024, temperature: 0.2 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
    );

    const rawText = response.data.raw_json;
    const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Generation Error:", error.response?.data || error.message);
    throw new Error("Failed to generate plan from AI model");
  }
};

/**
 * Conversational Chat -> Natural, accurate fitness coaching
 */
const generateChatResponse = async (message, user, context = '') => {
  try {
    const prompt = `User Stats: Weight ${user.weight}lbs, Goal: ${user.goal}. ${context}\nUser Question: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an expert personal fitness coach and sports nutritionist.
- Provide clear, accurate, motivational, and medically sound advice.
- Address the user's specific question directly (diet, exercises, adjustments, form tips).
- Format your response in clean, easy-to-read natural conversational text (bullet points are welcome for lists).
- NEVER output raw JSON or curly brackets unless explicitly asked for code.`;

    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 512, temperature: 0.6 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
    );

    return response.data.raw_json.trim();
  } catch (error) {
    console.error("Chat AI Error:", error.response?.data || error.message);
    throw new Error("Failed to generate chat response from AI model");
  }
};

module.exports = { generateWorkoutPlan, generateChatResponse };