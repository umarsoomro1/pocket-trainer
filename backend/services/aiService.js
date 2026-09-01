const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

const EXERCISE_RULES = `
STRICT EXERCISE TAXONOMY (DO NOT MIX CATEGORIES):
- PUSH / CHEST / TRICEPS ONLY: Flat Barbell Bench Press, Incline Dumbbell Press, Decline Press, Dumbbell Chest Fly, Cable Crossover, Chest Dips, Push-Ups, Tricep Rope Pushdown, Skull Crushers, Overhead Tricep Extension.
  * FORBIDDEN ON PUSH/CHEST DAYS: Rows, Deadlifts, Lat Pulldowns, Pull-Ups, Bicep Curls, Squats, Leg Curls, Planks, Leg Raises, Overhead Shoulder Press.
- PULL / BACK / BICEPS ONLY: Deadlifts, Barbell Bent-Over Row, Lat Pulldowns, Seated Cable Row, Face Pulls, Dumbbell Bicep Curls, Hammer Curls, Preacher Curls.
- LEGS / LOWER BODY ONLY: Barbell Back Squats, Romanian Deadlifts (RDL), Leg Press, Leg Extensions, Lying Leg Curls, Standing Calf Raises.
- SHOULDERS ONLY: Standing Overhead Press, Dumbbell Lateral Raises, Front Raises, Reverse Pec Deck, Arnold Press.
`;

/**
 * Generate Initial Plan
 */
const generateWorkoutPlan = async (user, planType) => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Create a 1-week master workout split for a ${age}yo weighing ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}, Split Style: ${planType || 'Push Pull Legs'}. Exactly 5 to 6 exercises per workout day.`;

  const system_prompt = `You are PocketTrainer AI, a strict CSCS strength coach.
${EXERCISE_RULES}

You MUST output ONLY valid JSON matching this schema:
{
  "title": "Hypertrophy Mastery Split",
  "schedule": [
    {
      "title": "Day 1 - Push (Chest & Triceps)",
      "type": "Strength",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps_target": "8-10",
          "rest_seconds": 90,
          "muscle": "Chest",
          "benefits": "Primary pectoral hypertrophy compound."
        },
        {
          "name": "Incline Dumbbell Press",
          "sets": 3,
          "reps_target": "10-12",
          "rest_seconds": 75,
          "muscle": "Chest",
          "benefits": "Upper pectoral development."
        },
        {
          "name": "Dumbbell Chest Fly",
          "sets": 3,
          "reps_target": "12-15",
          "rest_seconds": 60,
          "muscle": "Chest",
          "benefits": "Pectoral stretch and isolation."
        },
        {
          "name": "Cable Crossover",
          "sets": 3,
          "reps_target": "12-15",
          "rest_seconds": 60,
          "muscle": "Chest",
          "benefits": "Constant inner chest tension."
        },
        {
          "name": "Skull Crushers",
          "sets": 3,
          "reps_target": "10-12",
          "rest_seconds": 60,
          "muscle": "Triceps",
          "benefits": "Long-head tricep extension."
        },
        {
          "name": "Triceps Rope Pushdown",
          "sets": 3,
          "reps_target": "12-15",
          "rest_seconds": 45,
          "muscle": "Triceps",
          "benefits": "Lateral tricep head burnout."
        }
      ]
    }
  ]
}
Output strictly pure raw JSON. No markdown code blocks, no backticks, no comments.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 3072, temperature: 0.1 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
    );

    let rawText = (response.data.raw_json || '').replace(/```json/gi, '').replace(/```/g, '').trim();
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

    const prompt = `User Stats: Age ${age}, Weight ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}. ${context}\nUser Request: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an expert personal fitness coach.
${EXERCISE_RULES}

Rules:
1. When discussing Push/Chest days, ONLY mention Chest and Tricep exercises. NEVER suggest rows, deadlifts, leg exercises, or core on chest day.
2. Use clean markdown bullet points for exercise listings.
3. NEVER output raw JSON or code formatting in chat. Respond in clean, encouraging coaching prose.`;

    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 650, temperature: 0.2 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
    );

    return (response.data.raw_json || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("Chat AI Error:", error.response?.data || error.message);
    throw new Error("Failed to generate chat response from AI model");
  }
};

/**
 * Workout Plan Modifier -> Applies updates strictly to the active schedule
 */
const modifyWorkoutPlan = async (userModificationPrompt, currentPlan) => {
  const prompt = `Current Plan Title: "${currentPlan.title}".
Current Schedule Data: ${JSON.stringify(currentPlan.schedule)}

User Modification Request: "${userModificationPrompt}"

Apply the user's requested changes directly to this plan. Ensure every training day has 5-6 exercises following strict kinesiology guidelines.`;

  const system_prompt = `You are PocketTrainer AI routine architect.
${EXERCISE_RULES}

You MUST output ONLY valid raw JSON with the complete updated schedule matching this exact schema:
{
  "title": "${currentPlan.title}",
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
          "benefits": "Primary pectoral builder."
        }
      ]
    }
  ]
}
Output strictly valid JSON. Do not wrap in markdown or backticks.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 3072, temperature: 0.1 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
    );

    let rawText = (response.data.raw_json || '').replace(/```json/gi, '').replace(/```/g, '').trim();
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