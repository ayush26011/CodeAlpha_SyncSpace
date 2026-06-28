const Conversation = require('../models/Conversation');
const User = require('../models/User');

const createDirectConversation = async (req, res) => {
  const { recipientId } = req.body;
  if (!recipientId) {
    return res.status(400).json({ error: 'Recipient ID is required' });
  }

  try {
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ error: 'Recipient user not found' });

    // Check if direct conversation already exists
    let conv = await Conversation.findOne({
      type: 'direct',
      'participants.user': { $all: [req.user._id, recipientId] }
    }).populate('participants.user', '-password');

    if (conv) {
      return res.json(conv);
    }

    // Create new direct conversation
    conv = await Conversation.create({
      type: 'direct',
      participants: [
        { user: req.user._id, role: 'member' },
        { user: recipientId, role: 'member' }
      ],
      createdBy: req.user._id
    });

    const populated = await Conversation.findById(conv._id).populate('participants.user', '-password');
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create DM Error:", err);
    res.status(500).json({ error: err.message });
  }
};

const createGroupConversation = async (req, res) => {
  const { name, participants, avatar } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const participantList = [
      { user: req.user._id, role: 'admin' },
      ...(participants || []).map(id => ({ user: id, role: 'member' }))
    ];

    const conv = await Conversation.create({
      type: 'group',
      name,
      avatar: avatar || '',
      participants: participantList,
      createdBy: req.user._id
    });

    const populated = await Conversation.findById(conv._id).populate('participants.user', '-password');
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create Group Error:", err);
    res.status(500).json({ error: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const list = await Conversation.find({
      'participants.user': req.user._id
    })
      .populate('participants.user', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getConversationById = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id)
      .populate('participants.user', '-password')
      .populate('lastMessage');
    
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    
    // Check membership
    const isMember = conv.participants.some(p => p.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateConversation = async (req, res) => {
  const { name, avatar } = req.body;
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    conv.name = name || conv.name;
    conv.avatar = avatar || conv.avatar;
    await conv.save();

    const populated = await Conversation.findById(conv._id).populate('participants.user', '-password');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addParticipants = async (req, res) => {
  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: 'User IDs array is required' });
  }

  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    // Verify admin
    const caller = conv.participants.find(p => p.user.toString() === req.user._id.toString());
    if (!caller || (conv.type === 'group' && caller.role !== 'admin')) {
      return res.status(403).json({ error: 'Only admins can add participants' });
    }

    userIds.forEach(id => {
      const exists = conv.participants.some(p => p.user.toString() === id);
      if (!exists) {
        conv.participants.push({ user: id, role: 'member' });
      }
    });

    await conv.save();
    const populated = await Conversation.findById(conv._id).populate('participants.user', '-password');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeParticipant = async (req, res) => {
  const { userId } = req.params;
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    // Verify permissions: Admin can remove, or user can self-leave
    const caller = conv.participants.find(p => p.user.toString() === req.user._id.toString());
    const isSelf = req.user._id.toString() === userId;

    if (!caller || (conv.type === 'group' && caller.role !== 'admin' && !isSelf)) {
      return res.status(403).json({ error: 'Permission denied to remove participant' });
    }

    conv.participants = conv.participants.filter(p => p.user.toString() !== userId);
    await conv.save();

    const populated = await Conversation.findById(conv._id).populate('participants.user', '-password');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const togglePinConversation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  try {
    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const participant = conv.participants.find(p => p.user.toString() === userId.toString());
    if (!participant) return res.status(403).json({ error: 'Not a participant of this conversation' });

    participant.pinned = !participant.pinned;
    await conv.save();
    
    const populated = await Conversation.findById(conv._id)
      .populate('participants.user', '-password')
      .populate('lastMessage');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleArchiveConversation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  try {
    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const participant = conv.participants.find(p => p.user.toString() === userId.toString());
    if (!participant) return res.status(403).json({ error: 'Not a participant of this conversation' });

    participant.archived = !participant.archived;
    await conv.save();

    const populated = await Conversation.findById(conv._id)
      .populate('participants.user', '-password')
      .populate('lastMessage');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleMuteConversation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  try {
    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const participant = conv.participants.find(p => p.user.toString() === userId.toString());
    if (!participant) return res.status(403).json({ error: 'Not a participant of this conversation' });

    participant.muted = !participant.muted;
    await conv.save();

    const populated = await Conversation.findById(conv._id)
      .populate('participants.user', '-password')
      .populate('lastMessage');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateChatWallpaper = async (req, res) => {
  const { id } = req.params;
  const { wallpaper } = req.body;
  const userId = req.user._id;
  try {
    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const participant = conv.participants.find(p => p.user.toString() === userId.toString());
    if (!participant) return res.status(403).json({ error: 'Not a participant of this conversation' });

    participant.wallpaper = wallpaper || '';
    await conv.save();

    const populated = await Conversation.findById(conv._id)
      .populate('participants.user', '-password')
      .populate('lastMessage');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createDirectConversation,
  createGroupConversation,
  getConversations,
  getConversationById,
  updateConversation,
  addParticipants,
  removeParticipant,
  togglePinConversation,
  toggleArchiveConversation,
  toggleMuteConversation,
  updateChatWallpaper
};
