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
 * Conversational Chat -> Grounded in sports science, anatomical accuracy, and conversational coaching
 */
const generateChatResponse = async (message, user, context = '') => {
  try {
    const age = user.dob
      ? Math.abs(new Date(Date.now() - new Date(user.dob).getTime()).getUTCFullYear() - 1970)
      : 25;

    const prompt = `User Stats: Age ${age}, Weight ${user.weight || 150}lbs, Goal: ${user.goal || 'Hypertrophy'}. ${context}\nUser Question: "${message}"`;
    
    const system_prompt = `You are Pocket Trainer, an elite certified strength and conditioning specialist (CSCS) and sports nutritionist.

Follow these strict kinesiology and exercise science rules:
1. ANATOMICAL ACCURACY:
   - Chest (Push): Horizontal pressing and flyes (Flat/Incline Bench Press, Dips, Chest Flyes). NEVER include Overhead Shoulder Press on Chest day.
   - Back (Pull): Vertical/horizontal pulling and hip hinges (Deadlifts, Lat Pulldowns, Bent-over Rows, Face Pulls).
   - Shoulders: Overhead pressing (OHP/Arnold Press), Lateral Raises, Rear Delt Flyes.
   - Arms: Strictly Biceps (curls) and Triceps (pushdowns, skull crushers). NEVER include Overhead Shoulder Press on Arm day.
   - Legs: Squats, Leg Press, Romanian Deadlifts (RDLs), Hamstring Curls, Leg Extensions, Calf Raises.
2. SPLIT INTEGRITY & VOLUME:
   - "Push / Pull / Legs (PPL)": Only Push (Chest/Shoulders/Triceps), Pull (Back/Rear Delts/Biceps), and Legs (Quads/Hamstrings/Calves).
   - "Single Muscle / Bro Split": Provide 3 to 5 distinct exercises per muscle group to ensure adequate hypertrophy volume.
3. CONVERSATIONAL TONE:
   - Provide accurate, motivating, direct, and medically sound advice.
   - Format workout suggestions in clean bullet points.
   - NEVER output raw JSON syntax or curly brackets in chat unless explicitly asked for code.`;

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

module.exports = { generateWorkoutPlan, generateChatResponse };