const express = require('express');
const { uploadFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadFile);

module.exports = router;
