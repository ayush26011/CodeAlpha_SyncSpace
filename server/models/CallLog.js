const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  type: { type: String, enum: ['voice', 'video', 'meeting'], required: true },
  status: { type: String, enum: ['missed', 'rejected', 'accepted', 'ended'], default: 'missed' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 }, // in seconds
  roomId: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CallLog', CallLogSchema);
