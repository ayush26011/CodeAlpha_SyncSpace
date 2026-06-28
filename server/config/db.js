const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ CRITICAL: MONGO_URI is missing from environment variables (.env).");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`❌ HINT: Check that your current IP is whitelisted in MongoDB Atlas → Network Access → Add IP Address.`);
    // DO NOT call process.exit(1) — keep server alive so frontend gets proper HTTP errors
  }
};

module.exports = { connectDB };

