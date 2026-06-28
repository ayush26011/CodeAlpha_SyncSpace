const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name username avatar online lastSeen')
      .populate('replyTo')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { type, text, file, voice, replyTo } = req.body;

  try {
    const msg = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      type: type || 'text',
      text: text || '',
      file: file || {},
      voice: voice || {},
      replyTo: replyTo || null,
      readBy: [{ user: req.user._id }]
    });

    // Update conversation lastMessage & clear unread counts for sender
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: msg._id,
      $set: { [`unreadCounts.${req.user._id}`]: 0 }
    });

    const populated = await Message.findById(msg._id)
      .populate('sender', 'name username avatar online lastSeen')
      .populate('replyTo');

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create Message Error:", err);
    res.status(500).json({ error: err.message });
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  try {
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    msg.isDeleted = true;
    msg.text = 'This message was deleted';
    msg.file = {};
    msg.voice = {};
    await msg.save();

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAsSeen = async (req, res) => {
  const { messageId } = req.params;
  try {
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const alreadyRead = msg.readBy.some(r => r.user.toString() === req.user._id.toString());
    if (!alreadyRead) {
      msg.readBy.push({ user: req.user._id, readAt: new Date() });
      await msg.save();
    }

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addReaction = async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

  try {
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    // Remove existing reaction by user if any
    msg.reactions = msg.reactions.filter(r => r.user.toString() !== req.user._id.toString());
    
    // Add new reaction
    msg.reactions.push({ user: req.user._id, emoji });
    await msg.save();

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeReaction = async (req, res) => {
  const { messageId } = req.params;
  try {
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    msg.reactions = msg.reactions.filter(r => r.user.toString() !== req.user._id.toString());
    await msg.save();

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleStarMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;
  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (!message.starredBy) {
      message.starredBy = [];
    }

    const index = message.starredBy.indexOf(userId);
    if (index > -1) {
      message.starredBy.splice(index, 1);
    } else {
      message.starredBy.push(userId);
    }

    await message.save();
    
    const populated = await Message.findById(message._id)
      .populate('sender', 'name username avatar online lastSeen')
      .populate('replyTo');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const forwardMessage = async (req, res) => {
  const { messageId } = req.params;
  const { targetConversationIds } = req.body;
  if (!targetConversationIds || !Array.isArray(targetConversationIds)) {
    return res.status(400).json({ error: 'targetConversationIds array is required' });
  }

  try {
    const originalMsg = await Message.findById(messageId);
    if (!originalMsg) return res.status(404).json({ error: 'Message not found' });

    const forwardedMessages = [];
    for (const targetId of targetConversationIds) {
      const newMsg = await Message.create({
        conversation: targetId,
        sender: req.user._id,
        type: originalMsg.type,
        text: originalMsg.text,
        file: originalMsg.file,
        voice: originalMsg.voice,
        readBy: [{ user: req.user._id }]
      });

      // Update conversation lastMessage & clear unread counts for sender
      await Conversation.findByIdAndUpdate(targetId, {
        lastMessage: newMsg._id,
        $set: { [`unreadCounts.${req.user._id}`]: 0 }
      });

      const populated = await Message.findById(newMsg._id)
        .populate('sender', 'name username avatar online lastSeen')
        .populate('replyTo');

      forwardedMessages.push(populated);
    }

    res.status(201).json(forwardedMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const searchMessages = async (req, res) => {
  const { conversationId } = req.params;
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  try {
    const messages = await Message.find({
      conversation: conversationId,
      text: { $regex: q, $options: 'i' },
      isDeleted: false
    })
      .populate('sender', 'name username avatar online lastSeen')
      .populate('replyTo')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMessages,
  createMessage,
  deleteMessage,
  markAsSeen,
  addReaction,
  removeReaction,
  toggleStarMessage,
  forwardMessage,
  searchMessages
};
