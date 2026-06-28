const express = require('express');
const { createMeeting, getMeetingByRoomId, endMeeting } = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createMeeting);
router.get('/:roomId', protect, getMeetingByRoomId);
router.put('/:roomId/end', protect, endMeeting);

module.exports = router;
