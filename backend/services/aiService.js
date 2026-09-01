const axios = require('axios');

const MODAL_AI_URL = process.env.MODAL_AI_URL;

/**
 * Workout Plan Generator -> Generates robust 1-week master split without token truncation
 */
const generateWorkoutPlan = async (user, planType) => {
  const age = user.dob 
    ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970) 
    : 25;

  const prompt = `Create a 1-week repeating workout template for a ${age} year old weighing ${user.weight || 150}lbs with goal: ${user.goal || 'Hypertrophy'}.
Split Type: ${planType || 'Push Pull Legs (PPL)'}.
Requirement: Generate exactly the active days in the weekly split. Every workout day MUST have 5 to 6 targeted exercises.`;

  const system_prompt = `You are PocketTrainer AI, an elite CSCS strength coach.
Generate workout routines EXCLUSIVELY in valid, complete, minified raw JSON matching this schema:
{
  "title": "4-Week Hypertrophy Program",
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
          "benefits": "Primary horizontal compound push."
        }
      ]
    }
  ]
}

STRICT RULES:
1. CHEST DAYS: Bench Press, Incline Press, Dips, Chest Flyes. NEVER include Overhead Shoulder Press on Chest day.
2. SHOULDER DAYS: Overhead Press, Lateral Raises, Rear Delt Flyes, Front Raises.
3. BACK DAYS: Deadlifts, Lat Pulldowns, Barbell Rows, Seated Cable Rows, Face Pulls.
4. ARM DAYS: 3 Bicep exercises + 3 Tricep exercises. (Never include Shoulder Press on Arm day).
5. LEG DAYS: Squats, Leg Press, Romanian Deadlifts (RDLs), Hamstring Curls, Leg Extensions, Calf Raises.
6. VOLUME: Include 5 to 6 exercises per training day. Keep "benefits" concise (under 8 words) to save tokens.
7. Output strictly valid, closed JSON. No markdown backticks, no comments.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 3072, temperature: 0.15 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
    );

    let rawText = response.data.raw_json || '';
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Defensive parsing: ensure brackets are closed if slight network trim occurs
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

Update the schedule according to the user's request with 5 to 6 exercises per active training day.`;

  const system_prompt = `You are PocketTrainer AI routine architect. You MUST output ONLY valid, complete JSON matching this schema:
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
- 5 to 6 exercises per workout day.
- Never place Overhead Shoulder Press on Chest or Arm days.
- Keep benefits brief to ensure complete JSON closure.
- Output strictly raw JSON without markdown formatting or code fences.`;

  try {
    const response = await axios.post(
      MODAL_AI_URL,
      { prompt, system_prompt, max_tokens: 3072, temperature: 0.15 },
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