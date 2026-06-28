const express = require('express');
const { getWhiteboardSession, saveWhiteboardStrokes, clearWhiteboardSession } = require('../controllers/whiteboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:roomId', protect, getWhiteboardSession);
router.post('/:roomId', protect, saveWhiteboardStrokes);
router.delete('/:roomId', protect, clearWhiteboardSession);

module.exports = router;
