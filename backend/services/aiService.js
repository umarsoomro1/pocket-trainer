const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;
const AI_API_KEY = process.env.AI_API_KEY;

// Canonical verified exercise pools for all muscle groups including Core / Abs
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
  ],
  Core: [
    { name: "Hanging Leg Raise", sets: 3, reps_target: "12-15", rest_seconds: 60, muscle: "Abs", benefits: "Lower abdominal compression and hip flexors" },
    { name: "Cable Kneeling Crunch", sets: 3, reps_target: "15-20", rest_seconds: 60, muscle: "Abs", benefits: "Upper abdominal progressive overload" },
    { name: "Ab Wheel Rollout", sets: 3, reps_target: "10-12", rest_seconds: 60, muscle: "Abs", benefits: "Anti-extension core stabilization" },
    { name: "Plank to Push-Up", sets: 3, reps_target: "45-60s", rest_seconds: 45, muscle: "Abs", benefits: "Isometric core endurance and stability" }
  ]
};

// Deterministic Plan Builder for all 4 Splits with alternating Abs programming
const buildDeterministicPlan = (planType) => {
  const type = (planType || '').toLowerCase();

  // 1. Single Muscle (Bro Split) - Abs on Day 2 (Back) and Day 4 (Legs)
  if (type.includes('bro') || type.includes('single')) {
    return {
      title: "5-Day Single Muscle Hypertrophy Split",
      schedule: [
        { title: "Day 1 - Chest", type: "Strength", exercises: EXERCISE_POOLS.Chest.slice(0, 5) },
        { title: "Day 2 - Back & Abs", type: "Strength", exercises: [...EXERCISE_POOLS.Back.slice(0, 4), EXERCISE_POOLS.Core[0]] },
        { title: "Day 3 - Shoulders", type: "Strength", exercises: EXERCISE_POOLS.Shoulders.slice(0, 5) },
        { title: "Day 4 - Legs & Abs", type: "Strength", exercises: [...EXERCISE_POOLS.Legs.slice(0, 4), EXERCISE_POOLS.Core[1]] },
        { title: "Day 5 - Arms", type: "Strength", exercises: EXERCISE_POOLS.Arms.slice(0, 6) }
      ]
    };
  }

  // 2. Double Muscle Split - Abs on Day 1 (Chest & Biceps) and Day 3 (Shoulders & Abs)
  if (type.includes('double')) {
    return {
      title: "4-Day Double Muscle Hypertrophy Split",
      schedule: [
        { title: "Day 1 - Chest, Biceps & Abs", type: "Strength", exercises: [...EXERCISE_POOLS.Chest.slice(0, 3), ...EXERCISE_POOLS.Arms.slice(0, 2), EXERCISE_POOLS.Core[0]] },
        { title: "Day 2 - Back & Triceps", type: "Strength", exercises: [...EXERCISE_POOLS.Back.slice(0, 3), ...EXERCISE_POOLS.Arms.slice(3, 6)] },
        { title: "Day 3 - Shoulders & Abs", type: "Strength", exercises: [...EXERCISE_POOLS.Shoulders.slice(0, 4), EXERCISE_POOLS.Core[1]] },
        { title: "Day 4 - Legs", type: "Strength", exercises: EXERCISE_POOLS.Legs.slice(0, 5) }
      ]
    };
  }

  // 3. Upper / Lower Split - Abs on Lower Body days to keep upper compound capacity peak
  if (type.includes('upper') || type.includes('lower')) {
    return {
      title: "4-Day Upper / Lower Split",
      schedule: [
        { title: "Day 1 - Upper Body (Power)", type: "Strength", exercises: [EXERCISE_POOLS.Chest[0], EXERCISE_POOLS.Back[1], EXERCISE_POOLS.Shoulders[0], EXERCISE_POOLS.Back[2], EXERCISE_POOLS.Arms[0], EXERCISE_POOLS.Arms[3]] },
        { title: "Day 2 - Lower Body & Abs (Power)", type: "Strength", exercises: [...EXERCISE_POOLS.Legs.slice(0, 4), EXERCISE_POOLS.Core[0]] },
        { title: "Day 3 - Upper Body (Hypertrophy)", type: "Strength", exercises: [EXERCISE_POOLS.Chest[1], EXERCISE_POOLS.Chest[3], EXERCISE_POOLS.Back[3], EXERCISE_POOLS.Shoulders[1], EXERCISE_POOLS.Arms[1], EXERCISE_POOLS.Arms[4]] },
        { title: "Day 4 - Lower Body & Abs (Hypertrophy)", type: "Strength", exercises: [EXERCISE_POOLS.Legs[1], EXERCISE_POOLS.Legs[2], EXERCISE_POOLS.Legs[3], EXERCISE_POOLS.Legs[4], EXERCISE_POOLS.Core[2]] }
      ]
    };
  }

  // 4. Default: Push / Pull / Legs (PPL) - Abs alternate on Pull and Legs
  return {
    title: "Push Pull Legs (PPL) Split",
    schedule: [
      { title: "Day 1 - Push", type: "Strength", exercises: [EXERCISE_POOLS.Chest[0], EXERCISE_POOLS.Chest[1], EXERCISE_POOLS.Chest[3], EXERCISE_POOLS.Shoulders[0], EXERCISE_POOLS.Arms[3], EXERCISE_POOLS.Arms[4]] },
      { title: "Day 2 - Pull & Abs", type: "Strength", exercises: [EXERCISE_POOLS.Back[0], EXERCISE_POOLS.Back[1], EXERCISE_POOLS.Back[2], EXERCISE_POOLS.Arms[0], EXERCISE_POOLS.Arms[1], EXERCISE_POOLS.Core[0]] },
      { title: "Day 3 - Legs & Abs", type: "Strength", exercises: [EXERCISE_POOLS.Legs[0], EXERCISE_POOLS.Legs[1], EXERCISE_POOLS.Legs[2], EXERCISE_POOLS.Legs[4], EXERCISE_POOLS.Legs[5], EXERCISE_POOLS.Core[1]] }
    ]
  };
};

const sanitizeModifiedSession = (title, exercises) => {
  const t = (title || '').toLowerCase();
  const sanitized = [];
  const seen = new Set();

  for (const ex of exercises) {
    if (!ex || !ex.name) continue;
    const nameLower = ex.name.toLowerCase();

    // Guard: Prevent shoulder presses on pure chest bro-split days
    if ((nameLower.includes('shoulder press') || nameLower.includes('overhead press')) &&
        t.includes('chest') && !t.includes('push') && !t.includes('shoulder')) {
      continue;
    }

    // Guard: Prevent triceps on pure chest bro-split days
    if ((nameLower.includes('tricep') || nameLower.includes('pushdown') || nameLower.includes('kickback')) &&
        t.includes('chest') && !t.includes('push') && !t.includes('arm')) {
      continue;
    }

    if (!seen.has(ex.name.toLowerCase())) {
      seen.add(ex.name.toLowerCase());
      sanitized.push(ex);
    }
  }

  // Determine fallback muscle pool
  let pool = EXERCISE_POOLS.Chest;
  if (t.includes('back') || t.includes('pull')) pool = EXERCISE_POOLS.Back;
  if (t.includes('shoulder')) pool = EXERCISE_POOLS.Shoulders;
  if (t.includes('leg')) pool = EXERCISE_POOLS.Legs;
  if (t.includes('arm')) pool = EXERCISE_POOLS.Arms;

  let idx = 0;
  while (sanitized.length < 5 && idx < pool.length) {
    if (!seen.has(pool[idx].name.toLowerCase())) {
      sanitized.push(pool[idx]);
      seen.add(pool[idx].name.toLowerCase());
    }
    idx++;
  }

  return sanitized.slice(0, 6);
};

const safeJsonParse = (str) => {
  if (!str) return null;
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

/**
 * Conversational Chat Handler
 */
const generateChatResponse = async (message, user, context = '') => {
  try {
    const age = user.dob
      ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970)
      : 25;

    const prompt = `User Stats: Age ${age}, Weight ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}. ${context}\nUser Message: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an elite certified fitness trainer, sports kinesiologist, and sports nutritionist.
Rules:
1. Provide comprehensive, motivating, clear, and medically sound guidance.
2. For nutrition requests, provide exact meal breakdowns, gram-level macros, and timing advice.
3. If the user successfully modified an exercise, congratulate them and summarize the update briefly.
4. Format responses cleanly in markdown. Do NOT wrap conversational advice in JSON blocks.`;

    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 2048, temperature: 0.25 },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': AI_API_KEY
        }, 
        timeout: 75000 
      }
    );

    return (response.data.raw_json || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("Chat AI Error:", error.response?.data || error.message);
    throw new Error("Failed to generate chat response from AI model");
  }
};

/**
 * Robust Workout Session Modifier via Modal LLM
 */
const modifyWorkoutPlan = async (userModificationPrompt, currentPlan, targetDayIndex = 0) => {
  const currentSession = currentPlan.schedule[targetDayIndex];
  if (!currentSession) return null;

  const prompt = `CURRENT SESSION TITLE: "${currentSession.title}"
EXISTING EXERCISES:
${JSON.stringify(currentSession.exercises, null, 2)}

USER MODIFICATION REQUEST:
"${userModificationPrompt}"

INSTRUCTIONS:
Update the exercises array by executing the user request (swap, add, remove, or substitute).
Keep 5 to 6 balanced exercises. Retain any existing exercises that were not targeted for change.`;

  const system_prompt = `You are PocketTrainer AI routine architect.
Return ONLY valid JSON matching this schema:
{
  "title": "${currentSession.title}",
  "type": "Strength",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 4,
      "reps_target": "8-12",
      "rest_seconds": 60,
      "muscle": "Target Muscle",
      "benefits": "Brief physiological benefit"
    }
  ]
}
Output strictly raw JSON without explanations or markdown tags.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 2048, temperature: 0.1 },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': AI_API_KEY
        }, 
        timeout: 75000 
      }
    );

    const parsed = safeJsonParse(response.data.raw_json || '');
    if (parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
      parsed.title = currentSession.title;
      parsed.type = currentSession.type || "Strength";
      parsed.exercises = sanitizeModifiedSession(currentSession.title, parsed.exercises);
      return parsed;
    }

    return null;
  } catch (error) {
    console.error("Modify Workout AI Error:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { 
  EXERCISE_POOLS,
  generateWorkoutPlan, 
  generateChatResponse, 
  modifyWorkoutPlan 
};