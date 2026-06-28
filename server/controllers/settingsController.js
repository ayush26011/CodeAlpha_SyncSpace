const UserSettings = require('../models/UserSettings');

const getSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = await UserSettings.create({ user: req.user._id });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePrivacySettings = async (req, res) => {
  const { privacy } = req.body;
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.user._id },
      { $set: { privacy } },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateNotificationSettings = async (req, res) => {
  const { notifications } = req.body;
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.user._id },
      { $set: { notifications } },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateAppearanceSettings = async (req, res) => {
  const { appearance } = req.body;
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.user._id },
      { $set: { appearance } },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSecuritySettings = async (req, res) => {
  const { security } = req.body;
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.user._id },
      { $set: { security } },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSettings,
  updatePrivacySettings,
  updateNotificationSettings,
  updateAppearanceSettings,
  updateSecuritySettings
};
