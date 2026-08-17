const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  workoutPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan'
  },
  day_index: { type: Number, required: true },
  date_completed: { type: Date, default: Date.now },
  notes: { type: String },
  // Array of exercises completed that day to track progressive overload
  performance: [{
    exercise_name: { type: String },
    sets_completed: { type: Number },
    weight_used: { type: Number }
  }]
}, { timestamps: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);