const CallLog = require('../models/CallLog');

const getCallLogs = async (req, res) => {
  try {
    const logs = await CallLog.find({
      $or: [
        { caller: req.user._id },
        { receiver: req.user._id },
        { participants: req.user._id }
      ]
    })
      .populate('caller', 'name username avatar online lastSeen')
      .populate('receiver', 'name username avatar online lastSeen')
      .populate('participants', 'name username avatar')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCallLogById = async (req, res) => {
  try {
    const log = await CallLog.findById(req.params.id)
      .populate('caller', 'name username avatar online lastSeen')
      .populate('receiver', 'name username avatar online lastSeen')
      .populate('participants', 'name username avatar');
    
    if (!log) return res.status(404).json({ error: 'Call log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCallLog = async (req, res) => {
  const { receiverId, participants, conversationId, type, status, duration, roomId, startedAt, endedAt } = req.body;

  try {
    const log = await CallLog.create({
      caller: req.user._id,
      receiver: receiverId || null,
      participants: participants || [req.user._id, receiverId].filter(Boolean),
      conversation: conversationId || null,
      type: type || 'voice',
      status: status || 'missed',
      duration: duration || 0,
      roomId: roomId || '',
      startedAt: startedAt || new Date(),
      endedAt: endedAt || new Date()
    });

    const populated = await CallLog.findById(log._id)
      .populate('caller', 'name username avatar')
      .populate('receiver', 'name username avatar');

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create CallLog Error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCallLogs, getCallLogById, createCallLog };
