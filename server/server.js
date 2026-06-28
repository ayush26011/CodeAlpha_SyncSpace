require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Startup Integrity Checks & Diagnostics
console.log("🛠️  SyncSpace Startup Diagnosis...");
const REQUIRED_ENVS = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
let hasErrors = false;

REQUIRED_ENVS.forEach((key) => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Missing Variable: "${key}"`);
    hasErrors = true;
  } else {
    // Mask sensitive configs
    const masked = value.length > 8 ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}` : '*******';
    console.log(`✅ Configured: "${key}" = ${masked}`);
  }
});

if (hasErrors) {
  console.error("❌ Startup diagnostics failed. Exiting server.");
  process.exit(1);
}

// Connect Database
connectDB();

const app = express();

// Parse Client URLs
const clientUrls = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || clientUrls.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow compatibility
    }
  },
  credentials: true
}));

app.use(express.json());

// Serving Local uploads directory
const tempUploadsDir = path.join(__dirname, 'temp_uploads');
app.use('/uploads', express.static(tempUploadsDir));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const callRoutes = require('./routes/callRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const fileRoutes = require('./routes/fileRoutes');
const voiceNoteRoutes = require('./routes/voiceNoteRoutes');
const whiteboardRoutes = require('./routes/whiteboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/voice-notes', voiceNoteRoutes);
app.use('/api/whiteboard', whiteboardRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
const mongoose = require('mongoose');
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ 
    status: 'ok', 
    db: states[dbState] || 'unknown',
    dbReady: dbState === 1
  });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const { initializeSocket } = require('./socket/socketServer');
initializeSocket(io);

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`🚀 SyncSpace Premium Server listening on port ${PORT}`);
});
