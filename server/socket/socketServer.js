const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const WhiteboardSession = require('../models/WhiteboardSession');

// Track socket connection mapping: userId -> socket.id
const activeSockets = new Map();

// Track meeting rooms mappings: roomId -> Set of socket.ids
const meetingRooms = new Map();

const initializeSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const secret = process.env.JWT_SECRET || 'syncspace-premium-key-2026';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Authenticated socket connected: ${socket.id} (User: ${socket.user.name})`);
    
    let userSockets = activeSockets.get(userId);
    if (!userSockets) {
      userSockets = new Set();
      activeSockets.set(userId, userSockets);
    }
    userSockets.add(socket.id);

    // Mark user online
    try {
      await User.findByIdAndUpdate(userId, { online: true });
      io.emit('user_online', { userId });
    } catch (e) {
      console.error(e);
    }

    // ────────────────────────────────────────────────────────────────
    // CONVERSATIONS & CHATS
    // ────────────────────────────────────────────────────────────────

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`👥 Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`👤 Socket ${socket.id} left conversation: ${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, message }) => {
      // Broadcast message to everyone in the room
      socket.to(conversationId).emit('receive_message', { conversationId, message });
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('typing', { conversationId, userId });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(conversationId).emit('stop_typing', { conversationId, userId });
    });

    socket.on('message_seen', async ({ conversationId, messageId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (msg) {
          const alreadyRead = msg.readBy.some(r => r.user.toString() === userId);
          if (!alreadyRead) {
            msg.readBy.push({ user: userId, readAt: new Date() });
            await msg.save();
            // Emit to members that the message was seen
            io.to(conversationId).emit('message_seen', { conversationId, messageId, userId });
          }
        }
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('reaction_added', async ({ conversationId, messageId, emoji }) => {
      socket.to(conversationId).emit('reaction_added', { conversationId, messageId, emoji, userId });
    });

    socket.on('reaction_removed', async ({ conversationId, messageId }) => {
      socket.to(conversationId).emit('reaction_removed', { conversationId, messageId, userId });
    });

    // ────────────────────────────────────────────────────────────────
    // 1-TO-1 WebRTC SIGNALING
    // ────────────────────────────────────────────────────────────────

    socket.on('call_user', ({ to, offer, callType }) => {
      const recipientSockets = activeSockets.get(to);
      if (recipientSockets) {
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit('incoming_call', {
            from: userId,
            callerName: socket.user.name,
            callerAvatar: socket.user.avatar.url,
            offer,
            callType
          });
        });
      }
    });

    socket.on('call_accepted', ({ to, answer }) => {
      const callerSockets = activeSockets.get(to);
      if (callerSockets) {
        callerSockets.forEach(socketId => {
          io.to(socketId).emit('call_accepted', { answer });
        });
      }
    });

    socket.on('call_rejected', ({ to }) => {
      const callerSockets = activeSockets.get(to);
      if (callerSockets) {
        callerSockets.forEach(socketId => {
          io.to(socketId).emit('call_rejected');
        });
      }
    });

    socket.on('call_ended', ({ to }) => {
      const recipientSockets = activeSockets.get(to);
      if (recipientSockets) {
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit('call_ended');
        });
      }
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
      const recipientSockets = activeSockets.get(to);
      if (recipientSockets) {
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit('ice_candidate', { candidate });
        });
      }
    });

    // ────────────────────────────────────────────────────────────────
    // GROUP MEETING ROOMS (MESH WebRTC SIGNALING)
    // ────────────────────────────────────────────────────────────────

    socket.on('join_meeting', ({ roomId }) => {
      socket.join(roomId);
      
      let room = meetingRooms.get(roomId);
      if (!room) {
        room = new Set();
        meetingRooms.set(roomId, room);
      }
      
      // Let other participants know that a new peer joined
      socket.to(roomId).emit('meeting_user_joined', { userId, socketId: socket.id, name: socket.user.name, avatar: socket.user.avatar.url });
      
      // Send current list of socket IDs to the joining user
      const peers = Array.from(room);
      socket.emit('meeting_peers', { peers });
      
      room.add(socket.id);
      console.log(`💻 Socket ${socket.id} joined meeting: ${roomId}`);
    });

    socket.on('leave_meeting', ({ roomId }) => {
      socket.leave(roomId);
      const room = meetingRooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          meetingRooms.delete(roomId);
        }
      }
      socket.to(roomId).emit('meeting_user_left', { userId, socketId: socket.id });
      console.log(`💻 Socket ${socket.id} left meeting: ${roomId}`);
    });

    socket.on('meeting_offer', ({ toSocketId, offer }) => {
      io.to(toSocketId).emit('meeting_offer', { fromSocketId: socket.id, offer, name: socket.user.name, avatar: socket.user.avatar.url });
    });

    socket.on('meeting_answer', ({ toSocketId, answer }) => {
      io.to(toSocketId).emit('meeting_answer', { fromSocketId: socket.id, answer });
    });

    socket.on('meeting_ice_candidate', ({ toSocketId, candidate }) => {
      io.to(toSocketId).emit('meeting_ice_candidate', { fromSocketId: socket.id, candidate });
    });

    socket.on('screen_share_started', ({ roomId }) => {
      socket.to(roomId).emit('screen_share_started', { socketId: socket.id });
    });

    socket.on('screen_share_stopped', ({ roomId }) => {
      socket.to(roomId).emit('screen_share_stopped', { socketId: socket.id });
    });

    // ────────────────────────────────────────────────────────────────
    // COLLABORATIVE WHITEBOARD
    // ────────────────────────────────────────────────────────────────

    socket.on('whiteboard_draw', ({ roomId, drawData }) => {
      // Broadcast coordinates to room
      socket.to(roomId).emit('whiteboard_draw', drawData);
    });

    socket.on('whiteboard_clear', ({ roomId }) => {
      socket.to(roomId).emit('whiteboard_clear');
    });

    socket.on('whiteboard_save', async ({ roomId, strokes }) => {
      try {
        await WhiteboardSession.findOneAndUpdate(
          { roomId, active: true },
          { $push: { strokes: { $each: strokes } } },
          { upsert: true }
        );
      } catch (e) {
        console.error("Save whiteboard error:", e);
      }
    });

    // ────────────────────────────────────────────────────────────────
    // DISCONNECT
    // ────────────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log(`🔌 Authenticated socket disconnected: ${socket.id} (User: ${socket.user.name})`);
      
      const userSockets = activeSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeSockets.delete(userId);
          
          // Mark user offline only if no sockets remain
          try {
            const lastSeen = new Date();
            await User.findByIdAndUpdate(userId, { online: false, lastSeen });
            io.emit('user_offline', { userId, lastSeen });
          } catch (e) {
            console.error(e);
          }
        }
      }

      // Clean up meeting rooms
      meetingRooms.forEach((sockets, roomId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          socket.to(roomId).emit('meeting_user_left', { userId, socketId: socket.id });
          if (sockets.size === 0) {
            meetingRooms.delete(roomId);
          }
        }
      });
    });
  });
};

module.exports = { initializeSocket };
