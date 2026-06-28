const express = require('express');
const { getCallLogs, getCallLogById, createCallLog } = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/logs', protect, getCallLogs);
router.get('/logs/:id', protect, getCallLogById);
router.post('/log', protect, createCallLog);

module.exports = router;
