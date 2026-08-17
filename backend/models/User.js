const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true }, 
  weight: { type: Number, required: true }, 
  // NEW: Keep a log of weight changes for the chart
  weightHistory: [{
    weight: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],
  goal: { type: String, enum: ['weight_loss', 'muscle_gain', 'maintenance'], required: true },
  active_program_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan' },
  current_day_index: { type: Number, default: 1 },
  last_workout_date: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);