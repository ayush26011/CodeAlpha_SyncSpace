const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['direct', 'group'], required: true },
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    muted: { type: Boolean, default: false },
    wallpaper: { type: String, default: '' }
  }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map()
  },
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
