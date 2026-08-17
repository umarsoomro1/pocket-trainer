const axios = require('axios');

const getExerciseGif = async (exerciseName) => {
  try {
    const options = {
      method: 'GET',
      // Ensure we are using the exact search endpoint format for ExerciseDB
      url: `https://${process.env.RAPIDAPI_HOST}/exercises/name/${encodeURIComponent(exerciseName.toLowerCase())}`,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    
    // Log the success to confirm it's pulling data
    if (response.data && response.data.length > 0) {
      console.log(`Successfully fetched GIF for: ${exerciseName}`);
      return response.data[0].gifUrl; 
    }
    
    console.log(`ExerciseDB returned no matches for: ${exerciseName}`);
    return null; 
  } catch (error) {
    // This will print the exact RapidAPI error code (like 403 Forbidden or 429 Too Many Requests)
    console.error(`RapidAPI Error for ${exerciseName}:`, error.response?.status, error.response?.data || error.message);
    return null; 
  }
};

module.exports = { getExerciseGif };