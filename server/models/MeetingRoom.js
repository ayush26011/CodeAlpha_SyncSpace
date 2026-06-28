const mongoose = require('mongoose');

const MeetingRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  title: { type: String, default: 'SyncSpace Collaborative Meeting' },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date }
  }],
  active: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MeetingRoom', MeetingRoomSchema);
