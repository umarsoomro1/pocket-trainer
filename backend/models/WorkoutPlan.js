const mongoose = require('mongoose');

const workoutPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  schedule: [
    {
      title: { type: String, required: true },
      type: { type: String, required: true },
      exercises: [
        {
          name: { type: String, required: true },
          sets: { type: Number, required: true },
          reps_target: { type: String, required: true },
          rest_seconds: { type: Number, required: true },
          muscle: { type: String },
          benefits: { type: String },
          gif_url: { type: String } // NEW: Store the fetched GIF link
        }
      ]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);