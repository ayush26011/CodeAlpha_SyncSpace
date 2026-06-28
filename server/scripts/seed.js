require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const seedDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ Error: MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("🚀 Seeding: Connected to MongoDB Atlas");

    // Clear old data
    await User.deleteMany({});
    await UserSettings.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    console.log("🧹 Cleared existing database records.");

    // Create default users
    const defaultPassword = await bcrypt.hash('password123', 10);
    const users = await User.create([
      {
        name: 'Ayush Tiwari',
        username: 'ayush',
        email: 'ayush@syncspace.io',
        password: defaultPassword,
        bio: 'Product Designer at SyncSpace',
        online: true,
        avatar: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
      },
      {
        name: 'Elena Rostova',
        username: 'elena',
        email: 'elena@syncspace.io',
        password: defaultPassword,
        bio: 'Lead Frontend Engineer',
        online: false,
        avatar: { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80' }
      },
      {
        name: 'Marcus Chen',
        username: 'marcus',
        email: 'marcus@syncspace.io',
        password: defaultPassword,
        bio: 'Infrastructure Architect',
        online: true,
        avatar: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' }
      },
      {
        name: 'Sarah Jenkins',
        username: 'sarah',
        email: 'sarah@syncspace.io',
        password: defaultPassword,
        bio: 'Growth & Operations',
        online: false,
        avatar: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }
      }
    ]);

    // Create user settings for each user
    for (const u of users) {
      await UserSettings.create({ user: u._id });
    }

    console.log("👤 Created 4 seeded users with default settings.");

    // Create default channels
    const channels = await Conversation.create([
      {
        type: 'group',
        name: 'design-system',
        avatar: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80',
        participants: users.map(u => ({ user: u._id, role: u.username === 'ayush' ? 'admin' : 'member' }))
      },
      {
        type: 'group',
        name: 'general-sync',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80',
        participants: users.map(u => ({ user: u._id, role: 'member' }))
      }
    ]);

    console.log("💬 Seeded default workspace groups.");
    console.log("🌱 Database seeding complete successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
    process.exit(1);
  }
};

seedDB();
