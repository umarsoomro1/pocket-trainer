const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

/**
 * Generate structured workout plan from your fine-tuned Llama model on Modal
 */
const generateWorkoutPlan = async (user, planType) => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Create a 4-week JSON workout plan for a ${age} year old weighing ${user.weight}lbs with the goal: ${user.goal}. Split style: ${planType || 'General'}. Return valid raw JSON matching {"title": "...", "schedule": [{"title": "Day 1 - Push", "type": "Strength", "exercises": [{"name": "Barbell Bench Press", "sets": 3, "reps_target": "8-10", "rest_seconds": 90, "muscle": "Chest", "benefits": "Keep core tight."}]}]}`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
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
 * Generate conversational responses from your fine-tuned model on Modal
 */
const generateChatResponse = async (message, user, context = '') => {
  try {
    const prompt = `User Stats: Weight ${user.weight}lbs, Goal: ${user.goal}. ${context} User asks: "${message}"`;

    const response = await axios.post(
      MODAL_AI_URL,
      { prompt },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000
      }
    );

    const rawText = response.data.raw_json;
    return rawText.trim();
  } catch (error) {
    console.error("Chat AI Error:", error.response?.data || error.message);
    throw new Error("Failed to generate chat response from AI model");
  }
};

module.exports = { generateWorkoutPlan, generateChatResponse };