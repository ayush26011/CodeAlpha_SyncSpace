const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'image', 'file', 'voice', 'video', 'system'], default: 'text' },
  text: { type: String, default: '' },
  file: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    name: { type: String, default: '' },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: '' }
  },
  voice: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    duration: { type: Number, default: 0 }
  },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true }
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now }
  }],
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeleted: { type: Boolean, default: false },
  starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
