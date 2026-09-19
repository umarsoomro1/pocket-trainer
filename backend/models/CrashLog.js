const mongoose = require('mongoose');

const crashLogSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['server', 'client'],
      default: 'server',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    stack: {
      type: String,
    },
    route: {
      type: String,
    },
    method: {
      type: String,
    },
    ip: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Device OS, app version, React component stack
      default: {},
    },
  },
  { timestamps: true }
);

// Auto-delete records after 30 days (2,592,000 seconds) to conserve storage
crashLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
// Fast filtered lookups by crash source or affected user
crashLogSchema.index({ source: 1, createdAt: -1 });
crashLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CrashLog', crashLogSchema);