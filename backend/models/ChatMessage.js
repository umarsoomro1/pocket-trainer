const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  isUser: { type: Boolean, required: true } // true = User, false = AI
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);