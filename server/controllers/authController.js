const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const generateToken = require('../utils/generateToken');

// Helper: check if DB is connected before any query
const checkDBConnection = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ 
      error: 'Database not connected. Check MongoDB Atlas IP whitelist at https://cloud.mongodb.com → Network Access → Add your current IP address.'
    });
    return false;
  }
  return true;
};

const registerUser = async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields: name, username, email, password' });
  }

  if (!checkDBConnection(res)) return;

  try {
    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ error: 'Email already registered' });

    const usernameExists = await User.findOne({ username });
    if (usernameExists) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      online: true,
      lastSeen: new Date()
    });

    // Create default UserSettings for this user
    await UserSettings.create({ user: user._id });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        statusMessage: user.statusMessage,
        online: user.online
      }
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: err.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter email and password' });
  }

  if (!checkDBConnection(res)) return;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // Mark online
    user.online = true;
    user.lastSeen = new Date();
    await user.save();

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        statusMessage: user.statusMessage,
        online: user.online
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message });
  }
};


const getMe = async (req, res) => {
  if (!checkDBConnection(res)) return;
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const logoutUser = async (req, res) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.online = false;
        user.lastSeen = new Date();
        await user.save();
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registerUser, loginUser, getMe, logoutUser };
