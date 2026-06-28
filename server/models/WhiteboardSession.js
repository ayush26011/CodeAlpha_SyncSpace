const mongoose = require('mongoose');

const WhiteboardSessionSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'MeetingRoom' },
  strokes: [{
    prevX: Number,
    prevY: Number,
    currX: Number,
    currY: Number,
    color: String,
    size: Number
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('WhiteboardSession', WhiteboardSessionSchema);
