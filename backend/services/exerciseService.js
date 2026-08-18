const axios = require('axios');

// Direct reliable GIF fallback mappings for primary movements
const STATIC_EXERCISE_GIFS = {
  'bench press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/0.jpg',
  'dumbbell bench press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/0.jpg',
  'incline dumbbell press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Bench_Press/0.jpg',
  'squat': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/0.jpg',
  'goblet squat': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/0.jpg',
  'leg press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg',
  'deadlift': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Romanian_Deadlift/0.jpg',
  'dumbbell romanian deadlift': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Romanian_Deadlift/0.jpg',
  'shoulder press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/0.jpg',
  'seated dumbbell shoulder press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/0.jpg',
  'lat pulldown': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg',
  'cable row': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg',
  'seated cable row': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg',
  'pull-up': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg',
  'assisted pull-up': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg',
  'plank': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg',
  'bulgarian split squat': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bulgarian_Split_Squat/0.jpg',
  'dumbbell bulgarian split squat': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bulgarian_Split_Squat/0.jpg',
  'leg curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg',
  'lying leg curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg'
};

const getExerciseGif = async (exerciseName) => {
  const normalized = exerciseName.toLowerCase().trim();

  // 1. Instant check against static library (Zero API latency / no rate limits)
  for (const [key, url] of Object.entries(STATIC_EXERCISE_GIFS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }

  // 2. RapidAPI Search Fallback
  if (!process.env.RAPIDAPI_KEY || !process.env.RAPIDAPI_HOST) {
    return null;
  }

  try {
    // Simplify name (e.g. "Dumbbell Bulgarian Split Squat" -> "split squat")
    const simplifiedName = normalized
      .replace(/dumbbell|barbell|seated|lying|assisted/g, '')
      .trim();

    const options = {
      method: 'GET',
      url: `https://${process.env.RAPIDAPI_HOST}/exercises/name/${encodeURIComponent(simplifiedName)}`,
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST
      },
      timeout: 3000
    };

    const response = await axios.request(options);
    if (response.data && response.data.length > 0 && response.data[0].gifUrl) {
      return response.data[0].gifUrl;
    }

    return null;
  } catch (error) {
    return null;
  }
};

module.exports = { getExerciseGif };