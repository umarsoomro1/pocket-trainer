const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

/**
 * Workout Plan Generator -> Compact, highly structured 1-week routine template
 */
const generateWorkoutPlan = async (user, planType) => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Generate a 1-week master workout split for a ${age}yo (${user.weight || 150}lbs), Goal: ${user.goal || 'Hypertrophy'}, Style: ${planType || 'Push Pull Legs (PPL)'}. Include 3 to 4 training days with 5-6 exercises per day.`;

  const system_prompt = `You are PocketTrainer AI. Generate a workout plan in valid, complete raw JSON matching this schema:
{
  "title": "4-Week Hypertrophy Program",
  "schedule": [
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
          "benefits": "Compound chest builder"
        }
      ]
    }
  ]
}
Strict Rules:
- 5 to 6 exercises per workout day.
- Chest: Bench Press, Incline Press, Dips, Flyes (no Overhead Press on chest day).
- Back: Deadlifts, Rows, Lat Pulldowns, Face Pulls.
- Shoulders: Overhead Press, Lateral Raises, Rear Delt Flyes.
- Arms: Strictly Biceps and Triceps.
- Legs: Squats, Leg Press, RDLs, Leg Curls, Calf Raises.
- Keep "benefits" to under 5 words to prevent token cutoff.
- Output ONLY complete raw JSON. Ensure all brackets and strings are closed properly.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 4096, temperature: 0.15 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
    );

    let rawText = response.data.raw_json || '';
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Extract exact JSON boundaries
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(rawText);
  } catch (error) {
    console.error("AI Generation Error:", error.response?.data || error.message);
    throw new Error("Failed to generate plan from AI model");
  }
};

/**
 * Pure Conversational Chat
 */
const generateChatResponse = async (message, user, context = '') => {
  try {
    const age = user.dob
      ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970)
      : 25;

    const prompt = `User Stats: Age ${age}, Weight ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}. ${context}\nUser Question: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an expert personal fitness coach.
- Give accurate, medically sound coaching advice.
- Use clean bullet points for exercise suggestions.
- NEVER output raw JSON or code formatting in chat.
- Biomechanics: Never include Overhead Press on Chest or Arm days.`;

    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 650, temperature: 0.3 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
    );

    return response.data.raw_json.trim();
  } catch (error) {
    console.error("Chat AI Error:", error.response?.data || error.message);
    throw new Error("Failed to generate chat response from AI model");
  }
};

/**
 * Dedicated Workout Plan Modifier
 */
const modifyWorkoutPlan = async (userModificationPrompt, currentPlan) => {
  const prompt = `Current Routine: "${currentPlan.title}".
Schedule: ${JSON.stringify(currentPlan.schedule)}
Modification: "${userModificationPrompt}"
Update the complete schedule with 5-6 exercises per day. Keep benefits short.`;

  const system_prompt = `You are PocketTrainer AI routine architect. Output ONLY valid, complete raw JSON:
{
  "title": "Updated Program Title",
  "schedule": [
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
          "benefits": "Compound chest builder"
        }
      ]
    }
  ]
}
Output strictly valid JSON with no markdown tags.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 4096, temperature: 0.15 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
    );

    let rawText = response.data.raw_json || '';
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(rawText);
  } catch (error) {
    console.error("Modify Workout AI Error:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { generateWorkoutPlan, generateChatResponse, modifyWorkoutPlan };