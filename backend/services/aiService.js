const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

const SPLIT_RULES = `
SPLIT ARCHITECTURES (Select 5 to 6 balanced exercises per active training day):

1. "PUSH / PULL / LEGS (PPL)":
   - Push Day: Dynamic mix of Chest, Shoulders, and Triceps.
   - Pull Day: Dynamic mix of Back, Rear Delts, and Biceps.
   - Leg Day: Dynamic mix of Quads, Hamstrings, Glutes, and Calves.

2. "BRO SPLIT (SINGLE MUSCLE)":
   - Focus exclusively on ONE muscle group per session (Chest Day, Back Day, Shoulder Day, Leg Day, Arm Day).
   - All 5 to 6 exercises in that session must strictly target that single muscle group (e.g., Chest Day contains ONLY chest exercises; zero triceps, zero shoulders).

3. "DOUBLE MUSCLE SPLIT" (e.g., Chest & Biceps, Back & Triceps, Chest & Back, Shoulders & Arms):
   - Focus exclusively on the TWO designated muscle groups for that day.
   - Intelligently distribute the 5 to 6 exercises between both target muscle groups.

4. "UPPER / LOWER":
   - Upper Body Day: Balanced distribution across Chest, Back, Shoulders, and Arms.
   - Lower Body Day: Balanced distribution across Quads, Hamstrings, Glutes, and Calves.

KINESIOLOGY CONSTRAINTS:
- Never put Overhead Shoulder Press on Chest-only or Arm-only days.
- Ensure every active workout day contains exactly 5 to 6 exercises.
- Keep the "benefits" field concise (under 8 words) to maintain fast generation and prevent JSON truncation.
`;

// Helper: Safely parses JSON and attempts bracket repair if needed
const safeJsonParse = (str) => {
  let cleaned = str.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    try {
      const repaired = cleaned
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/}\s*{/g, '},{');
      return JSON.parse(repaired);
    } catch (innerErr) {
      return null;
    }
  }
};

/**
 * Generate Initial Plan for Any of the 4 Splits
 */
const generateWorkoutPlan = async (user, planType = "Push Pull Legs (PPL)") => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Create a 1-week master template for a ${age}yo (${user.weight || 150}lbs), Goal: ${user.goal || 'Hypertrophy'}.
Selected Split: "${planType}".
Generate all active training days in the split. Provide exactly 5 to 6 targeted exercises per day with proper sets and reps.`;

  const system_prompt = `You are PocketTrainer AI, an expert strength and conditioning coach.
${SPLIT_RULES}

You MUST output ONLY valid raw JSON matching this schema:
{
  "title": "Custom Master Split",
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
          "benefits": "Primary compound chest builder"
        }
      ]
    }
  ]
}
Output strictly raw JSON without markdown formatting or code blocks.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 3072, temperature: 0.2 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
    );

    const parsed = safeJsonParse(response.data.raw_json || '');
    if (!parsed) throw new Error("Could not parse AI workout output.");
    return parsed;
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

    const prompt = `User Stats: Age ${age}, Weight ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}. ${context}\nUser Request: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an expert personal fitness coach and nutritionist.
${SPLIT_RULES}

Rules:
1. Provide motivating, accurate, clear, and medically sound advice.
2. Format exercise lists and tips using clean markdown bullet points.
3. NEVER output raw JSON or code formatting in chat. Respond in natural conversational English.`;

    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 650, temperature: 0.3 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
    );

    return (response.data.raw_json || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("Chat AI Error:", error.response?.data || error.message);
    throw new Error("Failed to generate chat response from AI model");
  }
};

/**
 * Dedicated Workout Plan Modifier
 */
const modifyWorkoutPlan = async (userModificationPrompt, currentPlan, currentDayIndex = 1) => {
  const dayIdx = (currentDayIndex - 1) % currentPlan.schedule.length;
  const currentSession = currentPlan.schedule[dayIdx];

  const prompt = `Active Program Title: "${currentPlan.title}"
Current Session Data to Modify: ${JSON.stringify(currentSession)}
User Modification Request: "${userModificationPrompt}"

Apply the requested changes to this session. Provide 5 to 6 intelligently distributed exercises adhering to the split rules.`;

  const system_prompt = `You are PocketTrainer AI routine architect.
${SPLIT_RULES}

You MUST output ONLY valid raw JSON for this single session:
{
  "title": "${currentSession?.title || 'Updated Session'}",
  "type": "Strength",
  "exercises": [
    {
      "name": "Barbell Bench Press",
      "sets": 4,
      "reps_target": "8-10",
      "rest_seconds": 90,
      "muscle": "Chest",
      "benefits": "Primary compound chest builder"
    }
  ]
}
Output strictly valid JSON with no markdown tags or code blocks.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 1536, temperature: 0.15 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
    );

    return safeJsonParse(response.data.raw_json || '');
  } catch (error) {
    console.error("Modify Workout AI Error:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { generateWorkoutPlan, generateChatResponse, modifyWorkoutPlan };