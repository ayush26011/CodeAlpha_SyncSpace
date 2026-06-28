const MeetingRoom = require('../models/MeetingRoom');

const createMeeting = async (req, res) => {
  const { roomId, title } = req.body;
  if (!roomId) return res.status(400).json({ error: 'Room ID is required' });

  try {
    let room = await MeetingRoom.findOne({ roomId, active: true });
    if (room) {
      return res.json(room); // Return existing active room
    }

    room = await MeetingRoom.create({
      roomId,
      title: title || 'SyncSpace Collaborative Meeting',
      host: req.user._id,
      active: true,
      startedAt: new Date()
    });

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMeetingByRoomId = async (req, res) => {
  try {
    const room = await MeetingRoom.findOne({ roomId: req.params.roomId })
      .populate('host', 'name username avatar')
      .populate('participants.user', 'name username avatar');

    if (!room) return res.status(404).json({ error: 'Meeting room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const endMeeting = async (req, res) => {
  try {
    const room = await MeetingRoom.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Meeting room not found' });

    room.active = false;
    room.endedAt = new Date();
    await room.save();

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createMeeting, getMeetingByRoomId, endMeeting };
