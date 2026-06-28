const mongoose = require('mongoose');

const VoiceNoteSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  duration: { type: Number, default: 0 }, // in seconds
  waveformData: [{ type: Number }]
}, { timestamps: true });

module.exports = mongoose.model('VoiceNote', VoiceNoteSchema);
