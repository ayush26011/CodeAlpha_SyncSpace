import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { User, Bell, Eye, Shield, Video, X, Upload } from 'lucide-react';

export default function SettingsModal({ onClose }) {
  const { user, updateProfileDetails, updateAvatarImage } = useAuth();
  const { settings, updatePrivacy, updateNotifications, updateAppearance, updateSecurity } = useSettings();

  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || '');
  const [saveStatus, setSaveStatus] = useState('');

  // Local setting states synced from settings context
  const [privacy, setPrivacy] = useState({ showOnlineStatus: true, showLastSeen: true });
  const [notifications, setNotifications] = useState({ messageNotifications: true, callNotifications: true, sound: true });
  const [appearance, setAppearance] = useState({ theme: 'coastal', compactMode: false });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (settings) {
      if (settings.privacy) setPrivacy(settings.privacy);
      if (settings.notifications) setNotifications(settings.notifications);
      if (settings.appearance) setAppearance(settings.appearance);
    }
  }, [settings]);

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Eye size={16} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={16} /> }
  ];

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSaveStatus('Uploading avatar...');
      try {
        const res = await updateAvatarImage(file);
        setAvatarPreview(res.avatar.url);
        setSaveStatus('Avatar updated!');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        console.error(err);
        setSaveStatus('Upload failed.');
      }
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus('Saving profile...');
    try {
      await updateProfileDetails(name, bio, statusMessage);
      setSaveStatus('Profile updated!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus('Error saving profile.');
    }
  };

  const handlePrivacyToggle = async (key) => {
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);
    try {
      await updatePrivacy(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationToggle = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await updateNotifications(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAppearanceToggle = async (key) => {
    const updated = { ...appearance, [key]: !appearance[key] };
    setAppearance(updated);
    try {
      await updateAppearance(updated);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="settings-overlay" style={{ zIndex: 1000 }}>
      <motion.div 
        className="settings-modal glass"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      >
        {/* Sidebar Nav */}
        <div className="settings-sidebar">
          <h2>Settings</h2>
          <ul className="settings-menu">
            {menuItems.map((item) => (
              <li
                key={item.id}
                className={`settings-menu-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Settings Body */}
        <div className="settings-body">
          <div className="settings-body-header">
            <h3>{menuItems.find(m => m.id === activeTab)?.label} Settings</h3>
            <button type="button" className="btn-close-modal" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="flex-center" style={{ gap: '1.5rem', justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
                <img src={avatarPreview} alt="Avatar" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--secondary)' }} />
                <button type="button" className="btn-social" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} style={{ marginRight: '6px' }} /> Upload Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="settings-input-group">
                <label htmlFor="settings-name">Display Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="settings-input-group">
                <label htmlFor="settings-bio">Biography</label>
                <textarea
                  id="settings-bio"
                  rows="2"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div className="settings-input-group">
                <label htmlFor="settings-status-msg">Status Message</label>
                <input
                  id="settings-status-msg"
                  type="text"
                  value={statusMessage}
                  placeholder="What is on your mind?"
                  onChange={(e) => setStatusMessage(e.target.value)}
                />
              </div>
              <div className="flex-center" style={{ justifyContent: 'space-between', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary">Save Changes</button>
                {saveStatus && <span style={{ fontSize: '0.9rem', color: 'var(--highlight)' }}>{saveStatus}</span>}
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="toggle-group">
                <div className="toggle-info">
                  <h4>Message Alerts</h4>
                  <p>Send desktop and push notifications for inbound messages.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!notifications.messageNotifications}
                    onChange={() => handleNotificationToggle('messageNotifications')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-info">
                  <h4>Call Alerts</h4>
                  <p>Trigger overlays and rings for incoming voice/video calls.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!notifications.callNotifications}
                    onChange={() => handleNotificationToggle('callNotifications')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-info">
                  <h4>Play Sound Effects</h4>
                  <p>Play smooth notification sounds for call ringtones and incoming messages.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!notifications.sound}
                    onChange={() => handleNotificationToggle('sound')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="toggle-group">
                <div className="toggle-info">
                  <h4>Compact Mode</h4>
                  <p>Decrease general layout spacing for compact viewing.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!appearance.compactMode}
                    onChange={() => handleAppearanceToggle('compactMode')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="toggle-group">
                <div className="toggle-info">
                  <h4>Show Online Status</h4>
                  <p>Allow other workspace members to see if you are currently online.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!privacy.showOnlineStatus}
                    onChange={() => handlePrivacyToggle('showOnlineStatus')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-info">
                  <h4>Show Last Seen</h4>
                  <p>Allow users to see the timestamp of your last active connection.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!privacy.showLastSeen}
                    onChange={() => handlePrivacyToggle('showLastSeen')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
