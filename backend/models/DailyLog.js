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

// Compound indexes for user workout history and progress tracking
dailyLogSchema.index({ userId: 1, date_completed: -1 });
dailyLogSchema.index({ userId: 1, workoutPlanId: 1 });

module.exports = mongoose.model('DailyLog', dailyLogSchema);