const express = require('express');
const { 
  getSettings, 
  updatePrivacySettings, 
  updateNotificationSettings, 
  updateAppearanceSettings, 
  updateSecuritySettings 
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/privacy', protect, updatePrivacySettings);
router.put('/notifications', protect, updateNotificationSettings);
router.put('/appearance', protect, updateAppearanceSettings);
router.put('/security', protect, updateSecuritySettings);

module.exports = router;
