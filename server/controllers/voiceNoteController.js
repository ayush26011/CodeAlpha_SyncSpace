const VoiceNote = require('../models/VoiceNote');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

const uploadVoiceNote = async (req, res) => {
  const { conversationId } = req.params;
  const { duration, waveformData } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No audio recording file provided' });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'syncspace_voice_notes',
      resource_type: 'video' // Audio files are uploaded as 'video' resource type in Cloudinary
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const voiceNote = await VoiceNote.create({
      owner: req.user._id,
      conversation: conversationId,
      url: result.secure_url,
      publicId: result.public_id,
      duration: duration || 0,
      waveformData: waveformData ? JSON.parse(waveformData) : []
    });

    res.status(201).json(voiceNote);
  } catch (err) {
    console.error("Voice Note Cloudinary Upload Error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadVoiceNote };
