const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

/**
 * Workout Plan Generator -> Enforces 5-6 exercises per day, explicit biomechanics, and clean JSON
 */
const generateWorkoutPlan = async (user, planType) => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Create a 4-week workout routine for a ${age} year old weighing ${user.weight || 150}lbs with goal: ${user.goal || 'Hypertrophy'}.
Split Style: ${planType || 'Push Pull Legs (PPL)'}.
Requirement: Each training session MUST contain exactly 5 to 6 targeted exercises with sets, reps, and rest periods.`;

  const system_prompt = `You are PocketTrainer AI, an elite CSCS strength and conditioning specialist.
You generate workout routines EXCLUSIVELY in valid raw JSON matching this schema:
{
  "title": "Program Title",
  "schedule": [
    {
      "title": "Day 1 - Chest & Triceps (Push)",
      "type": "Strength",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps_target": "8-10",
          "rest_seconds": 90,
          "muscle": "Chest",
          "benefits": "Primary horizontal compound push for pectoral thickness."
        },
        {
          "name": "Incline Dumbbell Press",
          "sets": 3,
          "reps_target": "10-12",
          "rest_seconds": 75,
          "muscle": "Chest",
          "benefits": "Targets the clavicular head of the pectoralis major."
        },
        {
          "name": "Chest Dips",
          "sets": 3,
          "reps_target": "10-12",
          "rest_seconds": 60,
          "muscle": "Chest",
          "benefits": "Develops the lower pectoral boundary."
        },
        {
          "name": "Cable Chest Flyes",
          "sets": 3,
          "reps_target": "12-15",
          "rest_seconds": 60,
          "muscle": "Chest",
          "benefits": "Continuous tension across the sternal fibers."
        },
        {
          "name": "Skull Crushers",
          "sets": 3,
          "reps_target": "10-12",
          "rest_seconds": 60,
          "muscle": "Triceps",
          "benefits": "Isolates the long and medial heads of the triceps."
        },
        {
          "name": "Tricep Rope Pushdown",
          "sets": 3,
          "reps_target": "12-15",
          "rest_seconds": 45,
          "muscle": "Triceps",
          "benefits": "Maximizes lockout and lateral head contraction."
        }
      ]
    }
  ]
}

STRICT EXERCISE RULES:
1. CHEST DAYS: Horizontal presses and flyes only. NEVER include Overhead Shoulder Press or Arnold Press on Chest day.
2. SHOULDER DAYS: Overhead Press, Lateral Raises, Front Raises, Face Pulls, Reverse Flyes.
3. BACK DAYS: Deadlifts, Lat Pulldowns, Barbell Rows, Cable Rows, Shrugs.
4. ARM DAYS: 3 Bicep exercises (Curls) + 3 Tricep exercises (Extensions/Pushdowns). NEVER include shoulder presses on Arm day.
5. LEG DAYS: Barbell Squats, Romanian Deadlifts (RDLs), Leg Press, Leg Extensions, Lying Leg Curls, Standing Calf Raises.
6. VOLUME RULE: Every workout day must include 5 to 6 exercises.
Output ONLY the raw JSON object. Do not include markdown code fences or conversational text.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 2048, temperature: 0.15 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 75000 }
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
 * Pure Conversational Chat -> No JSON output
 */
const generateChatResponse = async (message, user, context = '') => {
  try {
    const age = user.dob
      ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970)
      : 25;

    const prompt = `User Stats: Age ${age}, Weight ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}. ${context}\nUser Question: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an elite certified strength coach and sports nutritionist.

Rules:
1. Provide motivating, accurate, clear, and medically sound advice.
2. Format exercise lists and tips using clean markdown bullet points.
3. NEVER output raw JSON, curly brackets, or programming schemas. Answer in natural conversational English.
4. Kinesiology Rules:
   - Chest (Push): Bench Press, Incline Press, Dips, Flyes (never include Overhead Press on chest day).
   - Back (Pull): Deadlifts, Lat Pulldowns, Rows, Face Pulls.
   - Arms: Biceps and Triceps only.
   - Shoulders: Overhead Press, Lateral Raises, Rear Delt Flyes.
   - Legs: Squats, Leg Press, Romanian Deadlifts, Hamstring Curls, Calves.`;

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
 * Dedicated Workout Plan Modifier -> Applies user modifications directly to active routine
 */
const modifyWorkoutPlan = async (userModificationPrompt, currentPlan) => {
  const prompt = `Current Routine Title: "${currentPlan.title}".
Current Schedule: ${JSON.stringify(currentPlan.schedule)}

User Modification Request: "${userModificationPrompt}"

Update the entire workout schedule according to the user's request. Ensure each active day has 5 to 6 exercises adhering to kinesiology rules.`;

  const system_prompt = `You are PocketTrainer AI routine architect. You MUST output ONLY valid JSON matching this schema:
{
  "title": "Program Title",
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
          "benefits": "Keep core tight."
        }
      ]
    }
  ]
}
Rules:
- Provide 5 to 6 exercises per workout day.
- Never place Overhead Shoulder Press on Chest or Arm days.
- Output strictly raw JSON without markdown formatting or code fences.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 2048, temperature: 0.15 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 75000 }
    );

    const rawText = response.data.raw_json;
    const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Modify Workout AI Error:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { generateWorkoutPlan, generateChatResponse, modifyWorkoutPlan };