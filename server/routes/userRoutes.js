const express = require('express');
const { getMe, updateProfile, uploadAvatar, searchUsers, getUserById, updateStatus } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUserById);
router.put('/status', protect, updateStatus);

module.exports = router;
