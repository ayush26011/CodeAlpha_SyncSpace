const express = require('express');
const { 
  getMessages, 
  createMessage, 
  deleteMessage, 
  markAsSeen, 
  addReaction, 
  removeReaction,
  toggleStarMessage,
  forwardMessage,
  searchMessages
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:conversationId', protect, getMessages);
router.post('/:conversationId', protect, createMessage);
router.delete('/:messageId', protect, deleteMessage);
router.put('/:messageId/seen', protect, markAsSeen);
router.post('/:messageId/reaction', protect, addReaction);
router.delete('/:messageId/reaction', protect, removeReaction);

router.put('/:messageId/star', protect, toggleStarMessage);
router.post('/:messageId/forward', protect, forwardMessage);
router.get('/:conversationId/search', protect, searchMessages);

module.exports = router;
