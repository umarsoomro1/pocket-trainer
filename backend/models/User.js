const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  weight: { type: Number },
  dob: { type: String },
  goal: { type: String },
  active_program_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan' },
  current_day_index: { type: Number, default: 1 },
  last_workout_date: { type: Date },
  // Password Reset Fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // F16: Declared paths so Mongoose strict mode persists them to MongoDB
  lastOtpSentAt: { type: Date },
  weightHistory: [
    {
      weight: { type: Number, required: true },
      date: { type: Date, default: Date.now }
    }
  ],
  // F13: Token version counter for server-side revocation
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);