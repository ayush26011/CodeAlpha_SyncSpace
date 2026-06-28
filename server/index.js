const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-Memory Database representing a premium communications platform state in 2026
const state = {
  users: [
    { id: '1', name: 'Ayush Tiwari', email: 'ayush@syncspace.io', status: 'online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', bio: 'Product Designer at SyncSpace' },
    { id: '2', name: 'Elena Rostova', email: 'elena@syncspace.io', status: 'online', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', bio: 'Lead Frontend Engineer' },
    { id: '3', name: 'Marcus Chen', email: 'marcus@syncspace.io', status: 'away', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', bio: 'Infrastructure Architect' },
    { id: '4', name: 'Sarah Jenkins', email: 'sarah@syncspace.io', status: 'offline', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', bio: 'Growth & Operations' }
  ],
  channels: [
    { id: 'c1', name: 'design-system', description: 'Aligning on the Coastal Retreat design implementation and token structures.', type: 'channel' },
    { id: 'c2', name: 'announcements', description: 'Important updates regarding SyncSpace 2026 releases.', type: 'channel' },
    { id: 'c3', name: 'general-sync', description: 'Day-to-day conversation, updates, and virtual coffees.', type: 'channel' }
  ],
  groups: [
    { id: 'g1', name: 'Launch Squad', description: 'Core product launch coordination panel.', type: 'group' },
    { id: 'g2', name: 'Design Critique', description: 'Reviewing landing page interactions and Framer Motion spring speeds.', type: 'group' }
  ],
  dms: [
    { id: 'dm-2', userId: '2', type: 'dm' },
    { id: 'dm-3', userId: '3', type: 'dm' },
    { id: 'dm-4', userId: '4', type: 'dm' }
  ],
  messages: {
    'c1': [
      { id: 'm1', userId: '2', text: 'Hey team, I love the Coastal Retreat palette we chose! It feels so calming and cohesive.', timestamp: '10:32 AM', reactions: [{ emoji: '✨', count: 3, users: ['1', '3', '4'] }] },
      { id: 'm2', userId: '3', text: 'Agreed. The contrast of Primary Dark (#335765) and the Background (#DBE2DC) is incredibly elegant.', timestamp: '10:34 AM', reactions: [] },
      { id: 'm3', userId: '1', text: 'Awesome. I am finalizing the layout transitions with Framer Motion now.', timestamp: '10:45 AM', reactions: [{ emoji: '🔥', count: 2, users: ['2', '3'] }] }
    ],
    'c2': [
      { id: 'm4', userId: '4', text: 'Welcome to SyncSpace! Let\'s build the communication tool of 2026 together.', timestamp: 'Yesterday', reactions: [] }
    ],
    'dm-2': [
      { id: 'mdm1', userId: '2', text: 'Hey Ayush, do you have the latest design tokens for the glassmorphic panels?', timestamp: '09:15 AM', reactions: [] },
      { id: 'mdm2', userId: '1', text: 'Yes, setting up the custom properties. They will be defined under `:root` in vanilla CSS!', timestamp: '09:20 AM', reactions: [{ emoji: '👍', count: 1, users: ['2'] }] }
    ]
  },
  meetings: [
    { id: 'meet-1', name: 'Daily Design Alignment', hostId: '1', status: 'active', participants: ['1', '2', '3'] }
  ],
  settings: {
    profile: { name: 'Ayush Tiwari', bio: 'Product Designer at SyncSpace', status: 'online' },
    notifications: { email: true, push: true, desktop: false },
    appearance: { theme: 'coastal', fontSize: 'medium', glassmorphism: true },
    privacy: { readReceipts: true, onlineStatus: true },
    security: { doubleAuth: false },
    devices: { camera: 'default', mic: 'default', speakers: 'default' }
  }
};

// API Endpoints
app.get('/api/state', (req, res) => {
  res.json(state);
});

app.post('/api/settings', (req, res) => {
  const { category, data } = req.body;
  if (state.settings[category]) {
    state.settings[category] = { ...state.settings[category], ...data };
    // Synchronize current user profile changes to users list
    if (category === 'profile') {
      const me = state.users.find(u => u.id === '1');
      if (me) {
        me.name = data.name || me.name;
        me.bio = data.bio || me.bio;
        me.status = data.status || me.status;
      }
    }
    // Broadcast setting changes
    io.emit('settings-updated', { category, settings: state.settings });
    return res.json({ success: true, settings: state.settings });
  }
  res.status(400).json({ error: 'Invalid settings category' });
});

// Socket.io WebSockets Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User online status broadcast
  socket.on('user-active', (userId) => {
    socket.userId = userId;
    const user = state.users.find(u => u.id === userId);
    if (user) {
      user.status = 'online';
      io.emit('user-status-changed', { userId, status: 'online' });
    }
  });

  // Rooms joining
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Chat message creation
  socket.on('send-message', ({ roomId, message }) => {
    const newMessage = {
      id: `m_${Date.now()}`,
      userId: message.userId || '1',
      text: message.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
      replyTo: message.replyTo || null,
      attachment: message.attachment || null
    };

    if (!state.messages[roomId]) {
      state.messages[roomId] = [];
    }
    state.messages[roomId].push(newMessage);

    io.to(roomId).emit('message-received', { roomId, message: newMessage });
  });

  // Emoji Reactions
  socket.on('toggle-reaction', ({ roomId, messageId, emoji, userId }) => {
    const messages = state.messages[roomId];
    if (messages) {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        let reaction = msg.reactions.find(r => r.emoji === emoji);
        if (reaction) {
          const userIdx = reaction.users.indexOf(userId);
          if (userIdx > -1) {
            // Remove user reaction
            reaction.users.splice(userIdx, 1);
            reaction.count--;
          } else {
            // Add user reaction
            reaction.users.push(userId);
            reaction.count++;
          }
          // Remove reaction object if empty
          if (reaction.count === 0) {
            msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
          }
        } else {
          // New reaction
          msg.reactions.push({
            emoji,
            count: 1,
            users: [userId]
          });
        }
        io.to(roomId).emit('message-reaction-updated', { roomId, messageId, reactions: msg.reactions });
      }
    }
  });

  // Typing indicators
  socket.on('typing', ({ roomId, userId, isTyping }) => {
    socket.to(roomId).emit('typing-status', { roomId, userId, isTyping });
  });

  // Live video conference sync
  socket.on('video-state-change', ({ meetingId, userId, mic, camera, raiseHand }) => {
    io.emit('meeting-participant-state', { meetingId, userId, state: { mic, camera, raiseHand } });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.userId) {
      const user = state.users.find(u => u.id === socket.userId);
      if (user) {
        user.status = 'offline';
        io.emit('user-status-changed', { userId: socket.userId, status: 'offline' });
      }
    }
  });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`SyncSpace premium server running on port ${PORT}`);
});
