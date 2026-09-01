const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

// Canonical verified exercise pools for all muscle groups
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

// Deterministic Plan Builder for all 4 Splits
const buildDeterministicPlan = (planType) => {
  const type = (planType || '').toLowerCase();

  // 1. Single Muscle (Bro Split)
  if (type.includes('bro') || type.includes('single')) {
    return {
      title: "5-Day Single Muscle Hypertrophy Split",
      schedule: [
        { title: "Day 1 - Chest", type: "Strength", exercises: EXERCISE_POOLS.Chest.slice(0, 6) },
        { title: "Day 2 - Back", type: "Strength", exercises: EXERCISE_POOLS.Back.slice(0, 6) },
        { title: "Day 3 - Shoulders", type: "Strength", exercises: EXERCISE_POOLS.Shoulders.slice(0, 5) },
        { title: "Day 4 - Legs", type: "Strength", exercises: EXERCISE_POOLS.Legs.slice(0, 6) },
        { title: "Day 5 - Arms", type: "Strength", exercises: EXERCISE_POOLS.Arms.slice(0, 6) }
      ]
    };
  }

  // 2. Double Muscle Split
  if (type.includes('double')) {
    return {
      title: "4-Day Double Muscle Hypertrophy Split",
      schedule: [
        { title: "Day 1 - Chest & Biceps", type: "Strength", exercises: [...EXERCISE_POOLS.Chest.slice(0, 3), ...EXERCISE_POOLS.Arms.slice(0, 3)] },
        { title: "Day 2 - Back & Triceps", type: "Strength", exercises: [...EXERCISE_POOLS.Back.slice(0, 3), ...EXERCISE_POOLS.Arms.slice(3, 6)] },
        { title: "Day 3 - Shoulders & Abs", type: "Strength", exercises: EXERCISE_POOLS.Shoulders.slice(0, 5) },
        { title: "Day 4 - Legs", type: "Strength", exercises: EXERCISE_POOLS.Legs.slice(0, 6) }
      ]
    };
  }

  // 3. Upper / Lower Split
  if (type.includes('upper') || type.includes('lower')) {
    return {
      title: "4-Day Upper / Lower Split",
      schedule: [
        { title: "Day 1 - Upper Body (Power)", type: "Strength", exercises: [EXERCISE_POOLS.Chest[0], EXERCISE_POOLS.Back[1], EXERCISE_POOLS.Shoulders[0], EXERCISE_POOLS.Back[2], EXERCISE_POOLS.Arms[0], EXERCISE_POOLS.Arms[3]] },
        { title: "Day 2 - Lower Body (Power)", type: "Strength", exercises: EXERCISE_POOLS.Legs.slice(0, 6) },
        { title: "Day 3 - Upper Body (Hypertrophy)", type: "Strength", exercises: [EXERCISE_POOLS.Chest[1], EXERCISE_POOLS.Chest[3], EXERCISE_POOLS.Back[3], EXERCISE_POOLS.Shoulders[1], EXERCISE_POOLS.Arms[1], EXERCISE_POOLS.Arms[4]] },
        { title: "Day 4 - Lower Body (Hypertrophy)", type: "Strength", exercises: [EXERCISE_POOLS.Legs[1], EXERCISE_POOLS.Legs[2], EXERCISE_POOLS.Legs[3], EXERCISE_POOLS.Legs[4], EXERCISE_POOLS.Legs[5]] }
      ]
    };
  }

  // 4. Default: Push / Pull / Legs (PPL)
  return {
    title: "Push Pull Legs (PPL) Split",
    schedule: [
      { title: "Day 1 - Push", type: "Strength", exercises: [EXERCISE_POOLS.Chest[0], EXERCISE_POOLS.Chest[1], EXERCISE_POOLS.Chest[3], EXERCISE_POOLS.Shoulders[0], EXERCISE_POOLS.Arms[3], EXERCISE_POOLS.Arms[4]] },
      { title: "Day 2 - Pull", type: "Strength", exercises: [EXERCISE_POOLS.Back[0], EXERCISE_POOLS.Back[1], EXERCISE_POOLS.Back[2], EXERCISE_POOLS.Back[4], EXERCISE_POOLS.Arms[0], EXERCISE_POOLS.Arms[1]] },
      { title: "Day 3 - Legs", type: "Strength", exercises: EXERCISE_POOLS.Legs.slice(0, 6) }
    ]
  };
};

// Post-sanitizer for modified sessions to prevent LLM anatomical drift
const sanitizeModifiedSession = (title, exercises) => {
  const t = (title || '').toLowerCase();
  const sanitized = [];
  const seen = new Set();

  for (const ex of exercises) {
    if (!ex || !ex.name) continue;
    const nameLower = ex.name.toLowerCase();

    // Guard: Prevent shoulder presses/rotations on pure chest days
    if ((nameLower.includes('shoulder press') || nameLower.includes('overhead press') || nameLower.includes('rotation')) &&
        t.includes('chest') && !t.includes('push') && !t.includes('shoulder')) {
      continue;
    }

    // Guard: Prevent triceps on pure chest bro-split days
    if ((nameLower.includes('tricep') || nameLower.includes('pushdown') || nameLower.includes('kickback')) &&
        t.includes('chest') && !t.includes('push') && !t.includes('arm')) {
      continue;
    }

    if (!seen.has(ex.name)) {
      seen.add(ex.name);
      sanitized.push(ex);
    }
  }

  // Backfill if exercises dropped below 5
  let pool = EXERCISE_POOLS.Chest;
  if (t.includes('back') || t.includes('pull')) pool = EXERCISE_POOLS.Back;
  if (t.includes('shoulder')) pool = EXERCISE_POOLS.Shoulders;
  if (t.includes('leg')) pool = EXERCISE_POOLS.Legs;
  if (t.includes('arm')) pool = EXERCISE_POOLS.Arms;

  let idx = 0;
  while (sanitized.length < 5 && idx < pool.length) {
    if (!seen.has(pool[idx].name)) {
      sanitized.push(pool[idx]);
      seen.add(pool[idx].name);
    }
    idx++;
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
    } catch (innerErr) {
      return null;
    }
  }
};

const generateWorkoutPlan = async (user, planType = "Push Pull Legs (PPL)") => {
  return buildDeterministicPlan(planType);
};

const generateChatResponse = async (message, user, context = '') => {
  try {
    const age = user.dob
      ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970)
      : 25;

    const prompt = `User Stats: Age ${age}, Weight ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}. ${context}\nUser Request: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an expert personal fitness coach.
Rules:
1. Provide motivating, accurate, and scientifically sound advice.
2. If discussing a single-muscle Chest day, recommend ONLY chest movements. Never put shoulder press, triceps, or legs on chest day.
3. Format advice in clean markdown bullet points. Never output raw JSON.`;

    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 450, temperature: 0.2 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    return (response.data.raw_json || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("Chat AI Error:", error.response?.data || error.message);
    throw new Error("Failed to generate chat response from AI model");
  }
};

const modifyWorkoutPlan = async (userModificationPrompt, currentPlan, targetDayIndex = 0) => {
  const currentSession = currentPlan.schedule[targetDayIndex];

  const prompt = `Current Session to Modify: ${JSON.stringify(currentSession)}\nUser Request: "${userModificationPrompt}"\nProvide 5 to 6 valid exercises adhering strictly to the muscle focus.`;

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
Output strictly raw JSON without markdown tags.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 1024, temperature: 0.1 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    const parsed = safeJsonParse(response.data.raw_json || '');
    if (parsed && Array.isArray(parsed.exercises)) {
      parsed.exercises = sanitizeModifiedSession(parsed.title || currentSession.title, parsed.exercises);
    }
    return parsed;
  } catch (error) {
    console.error("Modify Workout AI Error:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { generateWorkoutPlan, generateChatResponse, modifyWorkoutPlan };