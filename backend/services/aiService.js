const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

/**
 * Workout Plan Generator -> Forces strict JSON schema & proper anatomical distribution
 */
const generateWorkoutPlan = async (user, planType) => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Create a 4-week workout routine for a ${age} year old weighing ${user.weight || 150}lbs with goal: ${user.goal || 'Hypertrophy'}. Style: ${planType || 'Push Pull Legs (PPL)'}. Provide 3 to 5 targeted exercises per workout day with proper sets and reps.`;
  
  const system_prompt = `You are PocketTrainer AI, an expert strength coach. You MUST generate workout routines exclusively in valid raw JSON matching this schema:
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
Strict kinesiology rules:
- Push days: Chest, Shoulders (Overhead press, lateral raises), Triceps.
- Pull days: Lats, Rows, Rear Delts, Biceps.
- Leg days: Squats, Leg Press, Romanian Deadlifts, Hamstring Curls, Calves.
- Arm days: Biceps and Triceps only.
Do not write explanations, greetings, or markdown fences outside the JSON.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 1536, temperature: 0.2 },
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
 * Conversational Chat -> Handles natural conversation AND structured routine modifications
 */

const generateChatResponse = async (message, user, currentPlan = null) => {
  try {
    const age = user.dob
      ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970)
      : 25;

    let activePlanContext = "No active routine loaded.";
    if (currentPlan) {
      activePlanContext = `Active Plan Title: "${currentPlan.title}". Current Day Index: ${user.current_day_index}. Full Schedule: ${JSON.stringify(currentPlan.schedule)}`;
    }

    const prompt = `User Stats: Age ${age}, Weight ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}.\nActive Workout Context: ${activePlanContext}\nUser Message: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an elite certified strength coach and sports nutritionist.
You handle both standard fitness conversations AND modifications to the user's active workout plan.

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with a valid JSON object matching one of these two structures:

1. FOR GENERAL QUESTIONS / NUTRITION / FORM ADVICE:
{
  "action": "reply_only",
  "reply": "Your clear, motivating, and anatomically accurate response here."
}

2. FOR WORKOUT MODIFICATIONS / SPLIT ADJUSTMENTS / EXERCISE SWAPS (When the user asks to change their split, adjust volume, replace exercises, or alter days):
{
  "action": "update_plan",
  "reply": "Conversational confirmation explaining what was changed and why.",
  "updated_schedule": [
    {
      "title": "Day 1 - Push",
      "type": "Strength",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps_target": "8-10",
          "rest_seconds": 90,
          "muscle": "Chest",
          "benefits": "Keep core tight and elbows tucked."
        }
      ]
    }
  ]
}

STRICT KINESIOLOGY RULES:
- Chest: Bench Press, Incline Press, Chest Flyes, Dips. NEVER put Overhead Press on chest day.
- Back: Deadlifts, Lat Pulldowns, Rows, Face Pulls.
- Shoulders: Overhead Press, Lateral Raises, Rear Delt Flyes.
- Arms: Strictly Biceps and Triceps. NEVER put Overhead Press on arm day.
- Legs: Squats, Leg Press, Romanian Deadlifts (RDLs), Hamstring Curls, Leg Extensions, Calf Raises.
- Volume: Always provide 3-5 exercises per muscle group when requested.
- Output ONLY the raw JSON object. Do not include markdown code fences or conversational text outside the JSON.`;

    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 1536, temperature: 0.2 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
    );

    const rawText = response.data.raw_json;
    const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(cleanText);
    } catch (parseErr) {
      return {
        action: "reply_only",
        reply: cleanText
      };
    }
  } catch (error) {
    console.error("Chat AI Error:", error.response?.data || error.message);
    throw new Error("Failed to generate chat response from AI model");
  }
};

module.exports = { generateWorkoutPlan, generateChatResponse };
