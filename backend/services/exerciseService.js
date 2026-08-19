// Direct animated CDN GIF references
const EXERCISE_GIF_MAP = {
  // Barbell Bench Press Variants
  'barbell bench press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif',
  'incline barbell bench press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Barbell-Bench-Press.gif',
  'decline barbell bench press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Decline-Barbell-Bench-Press.gif',
  
  // Dumbbell Press Variants
  'dumbbell bench press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Press.gif',
  'incline dumbbell press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Dumbbell-Press.gif',
  'dumbbell press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Press.gif',

  // Generic Bench Press (Defaults to Barbell)
  'bench press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif',
  'bench': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif',

  // Shoulders & Overhead
  'overhead press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Shoulder-Press.gif',
  'military press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Shoulder-Press.gif',
  'seated dumbbell shoulder press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif',
  'shoulder press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif',

  // Triceps & Arms
  'tricep pushdown': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Tricep-Pushdown.gif',
  'pushdown': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Tricep-Pushdown.gif',
  'tricep extension': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Overhead-Dumbbell-Triceps-Extension.gif',
  'skull crusher': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Triceps-Extension.gif',
  'dip': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Triceps-Dips.gif',
  'bicep curl': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Curl.gif',
  'hammer curl': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif',

  // Back & Legs
  'lat pulldown': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif',
  'pull-up': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif',
  'pull up': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif',
  'cable row': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Cable-Row.gif',
  'squat': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif',
  'goblet squat': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Goblet-Squat.gif',
  'deadlift': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Deadlift.gif',
  'romanian deadlift': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Romanian-Deadlift.gif',
  'leg press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Press.gif',
  'leg curl': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Leg-Curl.gif',
  'plank': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Plank.gif'
};

// Pre-sort keys once by length descending (longest phrases matched first)
const SORTED_EXERCISE_KEYS = Object.keys(EXERCISE_GIF_MAP).sort((a, b) => b.length - a.length);

const getExerciseGif = async (exerciseName) => {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase().trim();

  for (const key of SORTED_EXERCISE_KEYS) {
    if (name.includes(key)) {
      return EXERCISE_GIF_MAP[key];
    }
  }

  return null;
};

module.exports = { getExerciseGif };