const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  weight: { type: Number },
  dob: { type: String },
  goal: { type: String },
  active_program_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan' },
  current_day_index: { type: Number, default: 1 },
  last_workout_date: { type: Date },
  // Password Reset Fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);