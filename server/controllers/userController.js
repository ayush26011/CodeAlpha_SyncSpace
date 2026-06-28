const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  const { name, bio, statusMessage } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.statusMessage = statusMessage || user.statusMessage;
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'syncspace_avatars',
      transformation: [{ width: 150, height: 150, crop: 'fill' }]
    });

    // Remove local temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.avatar = {
      url: result.secure_url,
      publicId: result.public_id
    };
    await user.save();

    res.json(user);
  } catch (err) {
    console.error("Avatar Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
};

const searchUsers = async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json([]);
  }

  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStatus = async (req, res) => {
  const { online, statusMessage } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (online !== undefined) {
      user.online = online;
      if (!online) {
        user.lastSeen = new Date();
      }
    }
    if (statusMessage !== undefined) {
      user.statusMessage = statusMessage;
    }
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMe, updateProfile, uploadAvatar, searchUsers, getUserById, updateStatus };
