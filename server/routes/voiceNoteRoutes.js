const express = require('express');
const { uploadVoiceNote } = require('../controllers/voiceNoteController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.post('/:conversationId', protect, upload.single('file'), uploadVoiceNote);

module.exports = router;
