const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  privacy: {
    showOnlineStatus: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true },
    allowMessagesFrom: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    allowCallsFrom: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' }
  },
  notifications: {
    messageNotifications: { type: Boolean, default: true },
    callNotifications: { type: Boolean, default: true },
    groupNotifications: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    desktop: { type: Boolean, default: false }
  },
  appearance: {
    theme: { type: String, default: 'coastal' },
    chatWallpaper: { type: String, default: '' },
    compactMode: { type: Boolean, default: false }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    loginAlerts: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
