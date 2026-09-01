const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

// Canonical verified exercise taxonomy
const EXERCISE_POOLS = {
  Chest: [
    { name: "Barbell Bench Press", sets: 4, reps_target: "8-10", rest_seconds: 90, muscle: "Chest", benefits: "Primary pectoral compound builder" },
    { name: "Incline Dumbbell Press", sets: 3, reps_target: "10-12", rest_seconds: 75, muscle: "Chest", benefits: "Upper chest hypertrophy" },
    { name: "Decline Barbell Press", sets: 3, reps_target: "10-12", rest_seconds: 75, muscle: "Chest", benefits: "Lower pectoral activation" },
    { name: "Dumbbell Chest Fly", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Chest", benefits: "Pectoral stretch and isolation" },
    { name: "Cable Crossover", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Chest", benefits: "Continuous inner chest tension" },
    { name: "Chest Dips", sets: 3, reps_target: "10-12", rest_seconds: 60, muscle: "Chest", benefits: "Lower pec development and mass" }
  ],
  Back: [
    { name: "Barbell Deadlift", sets: 4, reps_target: "6-8", rest_seconds: 120, muscle: "Back", benefits: "Posterior chain power and density" },
    { name: "Lat Pulldown", sets: 3, reps_target: "10-12", rest_seconds: 75, muscle: "Back", benefits: "Latissimus dorsi width" },
    { name: "Bent-Over Barbell Row", sets: 3, reps_target: "8-10", rest_seconds: 90, muscle: "Back", benefits: "Mid-back thickness and rhomboids" },
    { name: "Seated Cable Row", sets: 3, reps_target: "10-12", rest_seconds: 60, muscle: "Back", benefits: "Lower lat and mid-trap focus" },
    { name: "Face Pulls", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Back", benefits: "Rear deltoid and rotator cuff health" },
    { name: "Barbell Shrugs", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Back", benefits: "Upper trapezius development" }
  ],
  Shoulders: [
    { name: "Standing Overhead Press", sets: 4, reps_target: "8-10", rest_seconds: 90, muscle: "Shoulders", benefits: "Anterior delt and vertical push strength" },
    { name: "Dumbbell Lateral Raise", sets: 4, reps_target: "12-15", rest_seconds: 60, muscle: "Shoulders", benefits: "Lateral delt cap width" },
    { name: "Arnold Press", sets: 3, reps_target: "10-12", rest_seconds: 75, muscle: "Shoulders", benefits: "Rotational shoulder hypertrophy" },
    { name: "Reverse Pec Deck Fly", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Shoulders", benefits: "Posterior deltoid isolation" },
    { name: "Front Dumbbell Raise", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Shoulders", benefits: "Anterior deltoid definition" }
  ],
  Legs: [
    { name: "Barbell Back Squat", sets: 4, reps_target: "8-10", rest_seconds: 120, muscle: "Legs", benefits: "Quad and glute compound driver" },
    { name: "Romanian Deadlift (RDL)", sets: 3, reps_target: "8-10", rest_seconds: 90, muscle: "Legs", benefits: "Hamstring and glute stretch" },
    { name: "Leg Press", sets: 3, reps_target: "10-12", rest_seconds: 90, muscle: "Legs", benefits: "High-volume quad hypertrophy" },
    { name: "Lying Leg Curl", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Legs", benefits: "Hamstring isolation" },
    { name: "Leg Extension", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Legs", benefits: "Direct quadricep burnout" },
    { name: "Standing Calf Raise", sets: 4, reps_target: "15-20", rest_seconds: 45, muscle: "Legs", benefits: "Gastrocnemius development" }
  ],
  Arms: [
    { name: "Barbell Bicep Curl", sets: 3, reps_target: "10-12", rest_seconds: 60, muscle: "Biceps", benefits: "Bicep peak and overall mass" },
    { name: "Dumbbell Hammer Curl", sets: 3, reps_target: "10-12", rest_seconds: 60, muscle: "Biceps", benefits: "Brachialis and forearm thickness" },
    { name: "Preacher Curl", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Biceps", benefits: "Strict isolated bicep contraction" },
    { name: "Skull Crushers", sets: 3, reps_target: "10-12", rest_seconds: 60, muscle: "Triceps", benefits: "Tricep long-head mass" },
    { name: "Triceps Rope Pushdown", sets: 3, reps_target: "12-15", rest_seconds: 45, muscle: "Triceps", benefits: "Lateral head lockout tension" },
    { name: "Overhead Tricep Extension", sets: 3, reps_target: "10-12", rest_seconds: 60, muscle: "Triceps", benefits: "Tricep stretch under load" }
  ]
};

// Deterministic sanitizer: Cleanses and replaces hallucinatory or misclassified exercises
const sanitizeSessionExercises = (dayTitle, exercises) => {
  const title = (dayTitle || '').toLowerCase();
  
  // Single Muscle Chest Check
  if (title.includes('chest') && !title.includes('push') && !title.includes('bicep') && !title.includes('back')) {
    return EXERCISE_POOLS.Chest.slice(0, 6);
  }
  // Single Muscle Back Check
  if (title.includes('back') && !title.includes('pull') && !title.includes('tricep')) {
    return EXERCISE_POOLS.Back.slice(0, 6);
  }
  // Single Muscle Shoulder Check
  if (title.includes('shoulder') && !title.includes('arm')) {
    return EXERCISE_POOLS.Shoulders.slice(0, 5);
  }
  // Single Muscle Leg Check
  if (title.includes('leg')) {
    return EXERCISE_POOLS.Legs.slice(0, 6);
  }
  // Single Muscle Arm Check
  if (title.includes('arm')) {
    return EXERCISE_POOLS.Arms.slice(0, 6);
  }

  // General Filter for Push/Pull/Double-Muscle splits
  const sanitized = [];
  const usedNames = new Set();

  for (const ex of exercises) {
    const nameLower = (ex.name || '').toLowerCase();
    
    // Disallow shoulder presses on non-shoulder/non-push sessions
    if (nameLower.includes('shoulder press') || nameLower.includes('overhead press') || nameLower.includes('rotation')) {
      if (!title.includes('push') && !title.includes('shoulder') && !title.includes('upper')) {
        continue; // drop hallucinated movement
      }
    }
    // Disallow tricep movements on pure chest days
    if (nameLower.includes('tricep') || nameLower.includes('pushdown') || nameLower.includes('kickback')) {
      if (title.includes('chest') && !title.includes('push') && !title.includes('tricep')) {
        continue;
      }
    }

    if (!usedNames.has(ex.name)) {
      usedNames.add(ex.name);
      sanitized.push(ex);
    }
  }

  // Ensure minimum volume (5 exercises) by backfilling from relevant pool
  let fallbackPool = EXERCISE_POOLS.Chest;
  if (title.includes('back') || title.includes('pull')) fallbackPool = EXERCISE_POOLS.Back;
  if (title.includes('leg')) fallbackPool = EXERCISE_POOLS.Legs;
  if (title.includes('shoulder')) fallbackPool = EXERCISE_POOLS.Shoulders;

  let poolIdx = 0;
  while (sanitized.length < 5 && poolIdx < fallbackPool.length) {
    if (!usedNames.has(fallbackPool[poolIdx].name)) {
      sanitized.push(fallbackPool[poolIdx]);
      usedNames.add(fallbackPool[poolIdx].name);
    }
    poolIdx++;
  }

  return sanitized.slice(0, 6);
};

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
      const repaired = cleaned.replace(/,\s*([\]}])/g, '$1').replace(/}\s*{/g, '},{');
      return JSON.parse(repaired);
    } catch (err) {
      return null;
    }
  }
};

/**
 * Generate Workout Plan
 */
const generateWorkoutPlan = async (user, planType = "Push Pull Legs (PPL)") => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Create a 1-week master workout plan for a ${age}yo (${user.weight || 150}lbs), Goal: ${user.goal || 'Hypertrophy'}, Split Style: "${planType}". Provide 5-6 exercises per day.`;

  const system_prompt = `You are PocketTrainer AI. Generate a workout plan in valid raw JSON matching this schema:
{
  "title": "Hypertrophy Program",
  "schedule": [
    {
      "title": "Day 1 - Chest",
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
Output strictly raw JSON without markdown.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 3072, temperature: 0.1 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
    );

    const parsed = safeJsonParse(response.data.raw_json || '');
    if (!parsed || !parsed.schedule) throw new Error("Could not parse AI output.");

    // Enforce programmatic biomechanical validation on every session
    parsed.schedule = parsed.schedule.map((session) => ({
      ...session,
      exercises: sanitizeSessionExercises(session.title, session.exercises || [])
    }));

    return parsed;
  } catch (error) {
    console.error("AI Generation Error:", error.response?.data || error.message);
    throw new Error("Failed to generate plan from AI model");
  }
};

/**
 * Conversational Chat
 */
const generateChatResponse = async (message, user, context = '') => {
  try {
    const age = user.dob
      ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970)
      : 25;

    const prompt = `User Stats: Age ${age}, Weight ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}. ${context}\nUser Request: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an expert CSCS personal trainer.
- Answer questions with motivating, medically accurate advice.
- When answering about a single-muscle chest day, discuss ONLY chest movements (Bench, Incline, Dips, Flyes). Never suggest shoulders, triceps, or legs for chest day.
- Format lists with clean markdown bullets. Do not output raw JSON.`;

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
 * Workout Modifier
 */
const modifyWorkoutPlan = async (userModificationPrompt, currentPlan, currentDayIndex = 1) => {
  const dayIdx = (currentDayIndex - 1) % currentPlan.schedule.length;
  const currentSession = currentPlan.schedule[dayIdx];

  const prompt = `Current Session: ${JSON.stringify(currentSession)}\nUser Request: "${userModificationPrompt}"\nUpdate this session with 5 to 6 valid exercises.`;

  const system_prompt = `You are PocketTrainer AI routine architect. Output ONLY valid raw JSON for this session:
{
  "title": "${currentSession?.title || 'Session'}",
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
Output strictly raw JSON without markdown.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 1536, temperature: 0.1 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
    );

    const parsedSession = safeJsonParse(response.data.raw_json || '');
    if (parsedSession && parsedSession.exercises) {
      parsedSession.exercises = sanitizeSessionExercises(parsedSession.title, parsedSession.exercises);
    }
    return parsedSession;
  } catch (error) {
    console.error("Modify Workout AI Error:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { generateWorkoutPlan, generateChatResponse, modifyWorkoutPlan };