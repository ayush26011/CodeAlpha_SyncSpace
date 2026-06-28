const mockUsers = [
  { id: '1', name: 'Ayush Tiwari', email: 'ayush@syncspace.io', password: '', status: 'online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', bio: 'Product Designer at SyncSpace' },
  { id: '2', name: 'Elena Rostova', email: 'elena@syncspace.io', password: '', status: 'online', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', bio: 'Lead Frontend Engineer' },
  { id: '3', name: 'Marcus Chen', email: 'marcus@syncspace.io', password: '', status: 'away', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', bio: 'Infrastructure Architect' },
  { id: '4', name: 'Sarah Jenkins', email: 'sarah@syncspace.io', password: '', status: 'offline', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', bio: 'Growth & Operations' }
];

const mockConversations = [
  { id: 'c1', name: 'design-system', description: 'Aligning on the Coastal Retreat design implementation and token structures.', type: 'channel', isGroup: true, participants: ['1', '2', '3', '4'] },
  { id: 'c2', name: 'announcements', description: 'Important updates regarding SyncSpace 2026 releases.', type: 'channel', isGroup: true, participants: ['1', '2', '3', '4'] },
  { id: 'c3', name: 'general-sync', description: 'Day-to-day conversation, updates, and virtual coffees.', type: 'channel', isGroup: true, participants: ['1', '2', '3', '4'] },
  { id: 'dm-2', isGroup: false, participants: ['1', '2'], type: 'dm' },
  { id: 'dm-3', isGroup: false, participants: ['1', '3'], type: 'dm' },
  { id: 'dm-4', isGroup: false, participants: ['1', '4'], type: 'dm' }
];

const mockMessages = {
  'c1': [
    { id: 'm1', sender: '2', text: 'Hey team, I love the Coastal Retreat palette we chose! It feels so calming and cohesive.', timestamp: '10:32 AM', messageType: 'text', reactions: [{ emoji: '✨', users: ['1', '3', '4'] }] },
    { id: 'm2', sender: '3', text: 'Agreed. The contrast of Primary Dark (#335765) and the Background (#DBE2DC) is incredibly elegant.', timestamp: '10:34 AM', messageType: 'text', reactions: [] },
    { id: 'm3', sender: '1', text: 'Awesome. I am finalizing the layout transitions with Framer Motion now.', timestamp: '10:45 AM', messageType: 'text', reactions: [{ emoji: '🔥', users: ['2', '3'] }] }
  ],
  'c2': [
    { id: 'm4', sender: '4', text: 'Welcome to SyncSpace! Let\'s build the communication tool of 2026 together.', timestamp: 'Yesterday', messageType: 'text', reactions: [] }
  ],
  'dm-2': [
    { id: 'mdm1', sender: '2', text: 'Hey Ayush, do you have the latest design tokens for the glassmorphic panels?', timestamp: '09:15 AM', messageType: 'text', reactions: [] },
    { id: 'mdm2', sender: '1', text: 'Yes, setting up the custom properties. They will be defined under `:root` in vanilla CSS!', timestamp: '09:20 AM', messageType: 'text', reactions: [{ emoji: '👍', users: ['2'] }] }
  ]
};

const mockCallLogs = [
  { id: 'call1', caller: '2', receiver: '1', callType: 'voice', status: 'accepted', duration: 124, timestamp: new Date(Date.now() - 3600000) },
  { id: 'call2', caller: '3', receiver: '1', callType: 'video', status: 'missed', duration: 0, timestamp: new Date(Date.now() - 7200000) }
];

const mockSettings = {
  profile: { name: 'Ayush Tiwari', bio: 'Product Designer at SyncSpace', status: 'online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  notifications: { email: true, push: true, desktop: false },
  appearance: { theme: 'coastal', fontSize: 'medium', glassmorphism: true },
  privacy: { readReceipts: true, onlineStatus: true },
  security: { doubleAuth: false },
  devices: { camera: 'default', mic: 'default', speakers: 'default' }
};

module.exports = {
  mockUsers,
  mockConversations,
  mockMessages,
  mockCallLogs,
  mockSettings
};
