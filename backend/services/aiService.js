const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

const EXERCISE_RULES = `
STRICT EXERCISE TAXONOMY (DO NOT MIX CATEGORIES):
- PUSH / CHEST / TRICEPS ONLY: Barbell Bench Press, Incline Dumbbell Press, Decline Press, Dumbbell Chest Fly, Cable Crossover, Chest Dips, Push-Ups, Tricep Rope Pushdown, Skull Crushers, Overhead Tricep Extension.
  * FORBIDDEN ON PUSH/CHEST DAYS: Rows, Deadlifts, Lat Pulldowns, Pull-Ups, Bicep Curls, Squats, Leg Curls, Planks, Leg Raises, Overhead Shoulder Press.
- PULL / BACK / BICEPS ONLY: Deadlifts, Barbell Bent-Over Row, Lat Pulldowns, Seated Cable Row, Face Pulls, Dumbbell Bicep Curls, Hammer Curls, Preacher Curls.
- LEGS / LOWER BODY ONLY: Barbell Back Squats, Romanian Deadlifts (RDL), Leg Press, Leg Extensions, Lying Leg Curls, Standing Calf Raises.
- SHOULDERS ONLY: Standing Overhead Press, Dumbbell Lateral Raises, Front Raises, Reverse Pec Deck, Arnold Press.
`;

// Helper: Safely parses JSON and attempts bracket repair if truncated
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
    // Basic repair for trailing commas or unclosed arrays
    try {
      const repaired = cleaned
        .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
        .replace(/}\s*{/g, '},{');
      return JSON.parse(repaired);
    } catch (innerErr) {
      console.error("JSON Repair Failed:", innerErr.message);
      return null;
    }
  }
};

/**
 * Workout Plan Generator -> Initial plan creation (1-Week Master Split)
 */
const generateWorkoutPlan = async (user, planType) => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Create a 1-week master workout split for a ${age}yo (${user.weight || 150}lbs), Goal: ${user.goal || 'Hypertrophy'}, Style: ${planType || 'Push Pull Legs'}. Exactly 5 to 6 exercises per training day.`;

  const system_prompt = `You are PocketTrainer AI. Generate a workout plan EXCLUSIVELY in valid raw JSON matching this schema:
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
          "benefits": "Primary chest builder"
        }
      ]
    }
  ]
}
${EXERCISE_RULES}
Output ONLY raw valid JSON.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 3072, temperature: 0.1 },
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
 * Pure Conversational Chat -> No JSON output
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
3. NEVER output raw JSON or code formatting in chat. Respond in clean coaching English.`;

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
 * Dedicated Workout Plan Modifier -> Compact modification focused on targeted day
 */
const modifyWorkoutPlan = async (userModificationPrompt, currentPlan, currentDayIndex = 1) => {
  const dayIdx = (currentDayIndex - 1) % currentPlan.schedule.length;
  const currentSession = currentPlan.schedule[dayIdx];

  const prompt = `Current Session to modify: ${JSON.stringify(currentSession)}
User Request: "${userModificationPrompt}"

Apply the modification to this session. Provide exactly 5 to 6 exercises adhering to kinesiology rules.`;

  const system_prompt = `You are PocketTrainer AI routine architect.
${EXERCISE_RULES}

You MUST output ONLY valid raw JSON for this single session matching this exact schema:
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
      "benefits": "Primary chest builder"
    },
    {
      "name": "Incline Dumbbell Press",
      "sets": 3,
      "reps_target": "10-12",
      "rest_seconds": 75,
      "muscle": "Chest",
      "benefits": "Upper chest hypertrophy"
    },
    {
      "name": "Dumbbell Chest Fly",
      "sets": 3,
      "reps_target": "12-15",
      "rest_seconds": 60,
      "muscle": "Chest",
      "benefits": "Chest stretch and isolation"
    },
    {
      "name": "Cable Crossover",
      "sets": 3,
      "reps_target": "12-15",
      "rest_seconds": 60,
      "muscle": "Chest",
      "benefits": "Constant inner chest tension"
    },
    {
      "name": "Triceps Rope Pushdown",
      "sets": 3,
      "reps_target": "12-15",
      "rest_seconds": 45,
      "muscle": "Triceps",
      "benefits": "Tricep lateral head lockout"
    },
    {
      "name": "Skull Crushers",
      "sets": 3,
      "reps_target": "10-12",
      "rest_seconds": 60,
      "muscle": "Triceps",
      "benefits": "Tricep long head development"
    }
  ]
}
Output strictly valid JSON with no markdown tags or code blocks.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 1536, temperature: 0.1 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
    );

    const parsedSession = safeJsonParse(response.data.raw_json || '');
    return parsedSession;
  } catch (error) {
    console.error("Modify Workout AI Error:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { generateWorkoutPlan, generateChatResponse, modifyWorkoutPlan };