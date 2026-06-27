import React, { createContext, useState, useEffect, useContext } from 'react';
import * as conversationService from '../services/conversationService';
import * as messageService from '../services/messageService';
import * as fileService from '../services/fileService';
import * as voiceNoteService from '../services/voiceNoteService';
import { connectSocket, getSocket } from '../services/socketService';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketConnecting, setSocketConnecting] = useState(false);

  // Initialize socket connection on login
  useEffect(() => {
    const token = localStorage.getItem('syncspace_token');
    
    if (authLoading) {
      console.log("[Chat] Skipped: auth is loading.");
      return;
    }

    if (!user || !token) {
      console.log("[Chat] Skipped: no user or token.");
      setSocket(null);
      setLoading(false);
      setSocketConnected(false);
      setSocketConnecting(false);
      return;
    }

    console.log("[Chat] Initialization started.");
    setLoading(true);
    setSocketConnecting(true);

    const socketCon = connectSocket(token);
    setSocket(socketCon);

    if (socketCon.connected) {
      console.log("[Socket] Already connected.");
      setSocketConnected(true);
      setSocketConnecting(false);
    }

    socketCon.on('connect', () => {
      console.log("[Socket] Connected successfully");
      setSocketConnected(true);
      setSocketConnecting(false);
    });

    socketCon.on('disconnect', () => {
      console.log("[Socket] Disconnected");
      setSocketConnected(false);
      setSocketConnecting(false);
    });

    socketCon.on('connect_error', (err) => {
      console.warn("[Socket] Connection error:", err.message);
      setSocketConnected(false);
      setSocketConnecting(false);
    });

    // 5s connection fallback
    const connTimer = setTimeout(() => {
      if (!socketCon.connected) {
        console.log("[Socket] Connection timeout after 5s.");
        setSocketConnecting(false);
      }
    }, 5000);

    socketCon.on('receive_message', ({ conversationId, message }) => {
      // Increment unread count locally if not active room
      setConversations(prev => prev.map(c => {
        const isMatch = c._id === conversationId || c.id === conversationId;
        if (isMatch) {
          const unreadCount = (activeConversation?._id === conversationId) ? 0 : (c.unreadCounts?.[user._id] || 0) + 1;
          return {
            ...c,
            lastMessage: message,
            unreadCounts: { ...c.unreadCounts, [user._id]: unreadCount }
          };
        }
        return c;
      }));

      if (activeConversation && (activeConversation._id === conversationId || activeConversation.id === conversationId)) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        // Auto mark seen
        socketCon.emit('message_seen', { conversationId, messageId: message._id });
      }
    });

    socketCon.on('typing', ({ conversationId, userId }) => {
      setTypingUsers(prev => {
        const room = prev[conversationId] || {};
        return { ...prev, [conversationId]: { ...room, [userId]: true } };
      });
    });

    socketCon.on('stop_typing', ({ conversationId, userId }) => {
      setTypingUsers(prev => {
        const room = prev[conversationId] || {};
        const updatedRoom = { ...room };
        delete updatedRoom[userId];
        return { ...prev, [conversationId]: updatedRoom };
      });
    });

    socketCon.on('message_seen', ({ conversationId, messageId, userId }) => {
      if (activeConversation && (activeConversation._id === conversationId || activeConversation.id === conversationId)) {
        setMessages(prev => prev.map(m => {
          if (m._id === messageId) {
            const alreadyRead = m.readBy?.some(r => r.user === userId);
            if (!alreadyRead) {
              return { ...m, readBy: [...(m.readBy || []), { user: userId, readAt: new Date() }] };
            }
          }
          return m;
        }));
      }
    });

    socketCon.on('reaction_added', ({ conversationId, messageId, emoji, userId }) => {
      if (activeConversation && (activeConversation._id === conversationId || activeConversation.id === conversationId)) {
        setMessages(prev => prev.map(m => {
          if (m._id === messageId) {
            const cleanReactions = (m.reactions || []).filter(r => r.user !== userId);
            return { ...m, reactions: [...cleanReactions, { user: userId, emoji }] };
          }
          return m;
        }));
      }
    });

    socketCon.on('reaction_removed', ({ conversationId, messageId, userId }) => {
      if (activeConversation && (activeConversation._id === conversationId || activeConversation.id === conversationId)) {
        setMessages(prev => prev.map(m => {
          if (m._id === messageId) {
            return { ...m, reactions: (m.reactions || []).filter(r => r.user !== userId) };
          }
          return m;
        }));
      }
    });

    socketCon.on('user_online', ({ userId }) => {
      setOnlineStatuses(prev => ({ ...prev, [userId]: 'online' }));
    });

    socketCon.on('user_offline', ({ userId }) => {
      setOnlineStatuses(prev => ({ ...prev, [userId]: 'offline' }));
    });

    console.log("[Chat] Fetching conversations...");
    loadConversations()
      .catch(err => console.error("[Chat] Load conversations error:", err))
      .finally(() => {
        console.log("[Chat] chatLoading false");
        setLoading(false);
      });

    return () => {
      clearTimeout(connTimer);
      socketCon.off('connect');
      socketCon.off('disconnect');
      socketCon.off('connect_error');
      socketCon.off('receive_message');
      socketCon.off('typing');
      socketCon.off('stop_typing');
      socketCon.off('message_seen');
      socketCon.off('reaction_added');
      socketCon.off('reaction_removed');
      socketCon.off('user_online');
      socketCon.off('user_offline');
    };
  }, [user, authLoading]);

  // Join rooms and load messages on active conversation change
  useEffect(() => {
    const token = localStorage.getItem('syncspace_token');
    if (!user || !token || !activeConversation) return;

    const roomId = activeConversation._id || activeConversation.id;
    const socketCon = getSocket();
    if (socketCon) {
      socketCon.emit('join_conversation', roomId);
    }

    messageService.getMessages(roomId)
      .then(msgs => {
        setMessages(msgs);
        // Clear unread count locally and mark last message seen
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (socketCon) {
            socketCon.emit('message_seen', { conversationId: roomId, messageId: lastMsg._id });
          }
        }
        setConversations(prev => prev.map(c => (c._id === roomId || c.id === roomId) ? { ...c, unreadCounts: { ...c.unreadCounts, [user._id]: 0 } } : c));
      })
      .catch(err => console.error("Error fetching room messages:", err));

    return () => {
      if (socketCon) {
        socketCon.emit('leave_conversation', roomId);
      }
    };
  }, [activeConversation, user]);

  const loadConversations = async () => {
    try {
      const list = await conversationService.getConversations();
      setConversations(list);
      
      // Seed user online status maps
      const statuses = {};
      list.forEach(c => {
        c.participants?.forEach(p => {
          if (p.user?._id) {
            statuses[p.user._id] = p.user.online ? 'online' : 'offline';
          }
        });
      });
      setOnlineStatuses(statuses);
    } catch (e) {
      console.error(e);
    }
  };

  const startConversation = async (recipientId) => {
    try {
      const conv = await conversationService.createDirectConversation(recipientId);
      setConversations(prev => {
        if (prev.some(c => c._id === conv._id)) return prev;
        return [conv, ...prev];
      });
      setActiveConversation(conv);
      return conv;
    } catch (e) {
      console.error(e);
    }
  };

  const startGroupConversation = async (name, participants, avatar) => {
    try {
      const conv = await conversationService.createGroupConversation(name, participants, avatar);
      setConversations(prev => [conv, ...prev]);
      setActiveConversation(conv);
      return conv;
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessageText = async (text, replyToId = null) => {
    if (!activeConversation) return;
    const roomId = activeConversation._id || activeConversation.id;

    try {
      const newMsg = await messageService.createMessage(roomId, {
        type: 'text',
        text,
        replyTo: replyToId
      });

      setMessages(prev => [...prev, newMsg]);
      const socketCon = getSocket();
      if (socketCon) {
        socketCon.emit('send_message', { conversationId: roomId, message: newMsg });
      }
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const sendFileMessage = async (file) => {
    if (!activeConversation) return;
    const roomId = activeConversation._id || activeConversation.id;

    try {
      const asset = await fileService.uploadFile(roomId, file);
      const newMsg = await messageService.createMessage(roomId, {
        type: file.type.startsWith('image') ? 'image' : 'file',
        file: {
          url: asset.url,
          publicId: asset.publicId,
          name: asset.fileName,
          size: asset.fileSize,
          mimeType: asset.mimeType
        }
      });

      setMessages(prev => [...prev, newMsg]);
      const socketCon = getSocket();
      if (socketCon) {
        socketCon.emit('send_message', { conversationId: roomId, message: newMsg });
      }
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const sendVoiceNoteMessage = async (fileBlob, duration) => {
    if (!activeConversation) return;
    const roomId = activeConversation._id || activeConversation.id;

    try {
      const file = new File([fileBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      const asset = await voiceNoteService.uploadVoiceNote(roomId, file, duration);
      
      const newMsg = await messageService.createMessage(roomId, {
        type: 'voice',
        voice: {
          url: asset.url,
          publicId: asset.publicId,
          duration: asset.duration
        }
      });

      setMessages(prev => [...prev, newMsg]);
      const socketCon = getSocket();
      if (socketCon) {
        socketCon.emit('send_message', { conversationId: roomId, message: newMsg });
      }
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMessageById = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted', file: {}, voice: {} } : m));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMessageReaction = async (messageId, emoji) => {
    if (!activeConversation) return;
    const roomId = activeConversation._id || activeConversation.id;

    try {
      const msg = await messageService.getMessages(roomId).then(list => list.find(m => m._id === messageId));
      const hasReaction = msg?.reactions?.some(r => r.user === user._id && r.emoji === emoji);

      const socketCon = getSocket();
      if (hasReaction) {
        await messageService.removeReaction(messageId);
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions: (m.reactions || []).filter(r => r.user !== user._id) } : m));
        if (socketCon) socketCon.emit('reaction_removed', { conversationId: roomId, messageId });
      } else {
        await messageService.addReaction(messageId, emoji);
        setMessages(prev => prev.map(m => {
          if (m._id === messageId) {
            const cleanReactions = (m.reactions || []).filter(r => r.user !== user._id);
            return { ...m, reactions: [...cleanReactions, { user: user._id, emoji }] };
          }
          return m;
        }));
        if (socketCon) socketCon.emit('reaction_added', { conversationId: roomId, messageId, emoji });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendTypingStatus = (isTyping) => {
    const socketCon = getSocket();
    if (socketCon && activeConversation) {
      const roomId = activeConversation._id || activeConversation.id;
      if (isTyping) {
        socketCon.emit('typing', { conversationId: roomId });
      } else {
        socketCon.emit('stop_typing', { conversationId: roomId });
      }
    }
  };

  const starMessage = async (messageId) => {
    try {
      const updated = await messageService.toggleStarMessage(messageId);
      setMessages(prev => prev.map(m => m._id === messageId ? updated : m));
    } catch (e) {
      console.error(e);
    }
  };

  const forwardMessage = async (messageId, targetConversationIds) => {
    try {
      const newMsgs = await messageService.forwardMessage(messageId, targetConversationIds);
      const socketCon = getSocket();
      newMsgs.forEach(msg => {
        if (socketCon) {
          socketCon.emit('send_message', { conversationId: msg.conversation, message: msg });
        }
      });
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const searchChatMessages = async (q) => {
    if (!activeConversation) return [];
    const roomId = activeConversation._id || activeConversation.id;
    try {
      return await messageService.searchMessages(roomId, q);
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const pinConversation = async (id) => {
    try {
      const updated = await conversationService.pinConversation(id);
      setConversations(prev => prev.map(c => c._id === id ? updated : c));
      if (activeConversation && activeConversation._id === id) {
        setActiveConversation(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const archiveConversation = async (id) => {
    try {
      const updated = await conversationService.archiveConversation(id);
      setConversations(prev => prev.map(c => c._id === id ? updated : c));
      if (activeConversation && activeConversation._id === id) {
        setActiveConversation(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const muteConversation = async (id) => {
    try {
      const updated = await conversationService.muteConversation(id);
      setConversations(prev => prev.map(c => c._id === id ? updated : c));
      if (activeConversation && activeConversation._id === id) {
        setActiveConversation(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setChatWallpaper = async (id, wallpaper) => {
    try {
      const updated = await conversationService.updateWallpaper(id, wallpaper);
      setConversations(prev => prev.map(c => c._id === id ? updated : c));
      if (activeConversation && activeConversation._id === id) {
        setActiveConversation(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      setActiveConversation,
      messages,
      typingUsers,
      onlineStatuses,
      loading,
      socketConnected,
      socketConnecting,
      startConversation,
      startGroupConversation,
      sendMessageText,
      sendFileMessage,
      sendVoiceNoteMessage,
      deleteMessageById,
      toggleMessageReaction,
      sendTypingStatus,
      loadConversations,
      starMessage,
      forwardMessage,
      searchChatMessages,
      pinConversation,
      archiveConversation,
      muteConversation,
      setChatWallpaper
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
export default ChatContext;
