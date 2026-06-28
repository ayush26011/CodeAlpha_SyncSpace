const WhiteboardSession = require('../models/WhiteboardSession');

const getWhiteboardSession = async (req, res) => {
  const { roomId } = req.params;
  try {
    let session = await WhiteboardSession.findOne({ roomId, active: true });
    if (!session) {
      session = await WhiteboardSession.create({
        roomId,
        strokes: [],
        createdBy: req.user._id
      });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const saveWhiteboardStrokes = async (req, res) => {
  const { roomId } = req.params;
  const { strokes } = req.body; // array of strokes

  try {
    let session = await WhiteboardSession.findOne({ roomId, active: true });
    if (!session) {
      session = new WhiteboardSession({ roomId, createdBy: req.user._id });
    }
    
    // Append or overwrite strokes
    session.strokes = [...session.strokes, ...strokes];
    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const clearWhiteboardSession = async (req, res) => {
  const { roomId } = req.params;
  try {
    const session = await WhiteboardSession.findOne({ roomId, active: true });
    if (session) {
      session.strokes = [];
      await session.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getWhiteboardSession, saveWhiteboardStrokes, clearWhiteboardSession };
