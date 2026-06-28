const express = require('express');
const { 
  createDirectConversation, 
  createGroupConversation, 
  getConversations, 
  getConversationById, 
  updateConversation, 
  addParticipants, 
  removeParticipant,
  togglePinConversation,
  toggleArchiveConversation,
  toggleMuteConversation,
  updateChatWallpaper
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/direct', protect, createDirectConversation);
router.post('/group', protect, createGroupConversation);
router.get('/', protect, getConversations);
router.get('/:id', protect, getConversationById);
router.put('/:id', protect, updateConversation);
router.post('/:id/participants', protect, addParticipants);
router.delete('/:id/participants/:userId', protect, removeParticipant);

router.put('/:id/pin', protect, togglePinConversation);
router.put('/:id/archive', protect, toggleArchiveConversation);
router.put('/:id/mute', protect, toggleMuteConversation);
router.put('/:id/wallpaper', protect, updateChatWallpaper);

module.exports = router;
