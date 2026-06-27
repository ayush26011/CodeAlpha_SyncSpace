import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCall } from '../context/CallContext';
import { useMeeting } from '../context/MeetingContext';
import { useSettings } from '../context/SettingsContext';
import { searchUsers } from '../services/userService';
import { getCallLogs, createCallLog } from '../services/callService';
import Logo from './Logo';
import SettingsModal from './SettingsModal';
import CollaborativeCanvas from './whiteboard/CollaborativeCanvas';
import VoiceNoteRecorder from './chat/VoiceNoteRecorder';
import VoiceMessagePlayer from './chat/VoiceMessagePlayer';
import { 
  Search, MessageSquare, Video, FileText, Bell, Settings, LogOut, 
  Send, CornerUpLeft, Paperclip, Mic, MicOff, Camera, CameraOff, 
  Tv, Hand, Users, Info, X, Phone, PhoneOff, Trash2, ArrowLeft, Plus, 
  Download, File, Play, Pause, Calendar, Edit3
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { 
    conversations, activeConversation, setActiveConversation, messages, 
    typingUsers, onlineStatuses, startConversation, startGroupConversation, 
    sendMessageText, sendFileMessage, sendVoiceNoteMessage, 
    deleteMessageById, toggleMessageReaction, sendTypingStatus 
  } = useChat();

  const {
    incomingCall, activeCall, localStream, remoteStream, isMuted, isCameraOff, 
    isScreenSharing, callDuration, initiateCall, acceptCall, rejectCall, 
    endCall, toggleMic, toggleCamera, toggleScreenShare
  } = useCall();

  const {
    activeMeeting, peers, localStream: meetingLocalStream, meetingTimer, 
    joinMeeting, leaveMeeting
  } = useMeeting();

  const { settings } = useSettings();

  // Navigation tab states: 'chat' | 'calls' | 'meetings'
  const [activeTab, setActiveTab] = useState('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [fileAccept, setFileAccept] = useState('*');

  const renderTicks = (msg) => {
    if (msg.sender !== user._id && msg.sender?._id !== user._id) return null;
    const otherReadCount = msg.readBy?.filter(r => {
      const rId = r.user?._id || r.user;
      return rId !== user._id;
    }).length || 0;

    if (otherReadCount > 0) {
      return (
        <span className="ticks-wrapper read" style={{ color: '#34b7f1', marginLeft: '4px', display: 'inline-flex' }}>
          <svg viewBox="0 0 16 15" width="15" height="15" fill="currentColor">
            <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033L5.138 7.39a.365.365 0 0 0-.507.013l-.462.462a.365.365 0 0 0 .007.512l3.825 3.525a.32.32 0 0 0 .472-.023l6.596-8.05a.365.365 0 0 0-.063-.512zm-4.248.016a.365.365 0 0 0-.512.01L5.805 8.134a.32.32 0 0 1-.476.012L2.73 5.816a.365.365 0 0 0-.512.007l-.465.465a.365.365 0 0 0 .007.513l3.702 3.19a.32.32 0 0 0 .463-.016l4.89-5.888a.365.365 0 0 0-.016-.513z"/>
          </svg>
        </span>
      );
    } else {
      return (
        <span className="ticks-wrapper delivered" style={{ color: 'rgba(0,0,0,0.3)', marginLeft: '4px', display: 'inline-flex' }}>
          <svg viewBox="0 0 16 15" width="15" height="15" fill="currentColor">
            <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033L5.138 7.39a.365.365 0 0 0-.507.013l-.462.462a.365.365 0 0 0 .007.512l3.825 3.525a.32.32 0 0 0 .472-.023l6.596-8.05a.365.365 0 0 0-.063-.512zm-4.248.016a.365.365 0 0 0-.512.01L5.805 8.134a.32.32 0 0 1-.476.012L2.73 5.816a.365.365 0 0 0-.512.007l-.465.465a.365.365 0 0 0 .007.513l3.702 3.19a.32.32 0 0 0 .463-.016l4.89-5.888a.365.365 0 0 0-.016-.513z"/>
          </svg>
        </span>
      );
    }
  };

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  const triggerAttachment = (acceptType) => {
    setFileAccept(acceptType);
    setShowAttachmentMenu(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  // New Chat Creation modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchText, setUserSearchText] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // Meeting Room
  const [meetingInputId, setMeetingInputId] = useState('');
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  // Call Logs history list
  const [callLogs, setCallLogs] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const meetingLocalVideoRef = useRef(null);

  // Load call logs when tab switches
  useEffect(() => {
    const token = localStorage.getItem('syncspace_token');
    if (!user || !token) return;

    if (activeTab === 'calls') {
      getCallLogs()
        .then(logs => setCallLogs(logs))
        .catch(e => console.error(e));
    }
  }, [activeTab, user]);

  // Bind video streams to element nodes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall]);

  useEffect(() => {
    if (meetingLocalVideoRef.current && meetingLocalStream) {
      meetingLocalVideoRef.current.srcObject = meetingLocalStream;
    }
  }, [meetingLocalStream, activeMeeting]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    sendTypingStatus(true);
    if (window.typingTimeout) clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  const handleSendTextMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessageText(inputText, replyTo ? replyTo._id || replyTo.id : null);
    setInputText('');
    setReplyTo(null);
    sendTypingStatus(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendFileMessage(file);
    }
  };

  // Search users in database
  const handleUserSearch = async (e) => {
    const text = e.target.value;
    setUserSearchText(text);
    if (text.trim().length > 0) {
      try {
        const results = await searchUsers(text);
        setUserSearchResults(results);
      } catch (err) {
        console.error(err);
      }
    } else {
      setUserSearchResults([]);
    }
  };

  const handleStartDM = async (targetUser) => {
    await startConversation(targetUser._id || targetUser.id);
    setShowNewChatModal(false);
    setActiveTab('chat');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0) return;
    await startGroupConversation(groupName, selectedParticipants);
    setGroupName('');
    setSelectedParticipants([]);
    setShowNewChatModal(false);
    setActiveTab('chat');
  };

  const handleToggleParticipant = (userId) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  // Meetings
  const handleStartMeeting = (customId = '') => {
    const roomId = customId || `room-${Date.now()}`;
    joinMeeting(roomId, 'SyncSpace Video Call Session');
  };

  const handleLeaveMeeting = () => {
    leaveMeeting();
    setShowWhiteboard(false);
  };

  // Quick Action callbacks
  const handleVoiceCall = (partner) => {
    initiateCall(partner._id || partner.id, partner.name, partner.avatar?.url || partner.avatar, 'voice');
  };

  const handleVideoCall = (partner) => {
    initiateCall(partner._id || partner.id, partner.name, partner.avatar?.url || partner.avatar, 'video');
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Filter conversations matching query
  const filteredConversations = conversations.filter(c => {
    const term = searchQuery.toLowerCase();
    if (c.name) return c.name.toLowerCase().includes(term);
    const target = c.participants?.find(p => p.user?._id !== user._id);
    return target?.user?.name?.toLowerCase().includes(term);
  });

  return (
    <div className="dashboard-container">
      {/* Sidebar navigation */}
      <div className={`sidebar-container ${mobileMenuOpen ? 'open' : ''} ${activeConversation && activeTab === 'chat' ? 'hidden-mobile' : ''}`}>
        <div className="sidebar-header">
          <Logo size={28} />
          <button type="button" className="btn-icon mobile-sidebar-toggle" onClick={() => setMobileMenuOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-search" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={14} className="search-icon-fixed" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="button" className="btn-icon" onClick={() => setShowNewChatModal(true)} title="New Chat or Group">
            <Plus size={16} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex-center" style={{ padding: '0.5rem 1rem', justifyContent: 'space-around', borderBottom: '1px solid var(--glass-border)' }}>
          <button type="button" className={`btn-ghost ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')} style={{ fontSize: '0.85rem' }}>
            Chats
          </button>
          <button type="button" className={`btn-ghost ${activeTab === 'calls' ? 'active' : ''}`} onClick={() => setActiveTab('calls')} style={{ fontSize: '0.85rem' }}>
            Calls
          </button>
          <button type="button" className={`btn-ghost ${activeTab === 'meetings' ? 'active' : ''}`} onClick={() => setActiveTab('meetings')} style={{ fontSize: '0.85rem' }}>
            Meetings
          </button>
        </div>

        {/* Scroll list */}
        <div className="sidebar-scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'chat' && (
            <>
              {filteredConversations.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Start a conversation
                </div>
              ) : (
                <ul className="sidebar-list">
                  {filteredConversations.map(c => {
                    const target = c.type === 'direct' ? c.participants?.find(p => p.user?._id !== user._id) : null;
                    const displayName = c.type === 'group' ? c.name : (target?.user?.name || 'Saved Space');
                    const displayAvatar = c.type === 'group' 
                      ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80' 
                      : (target?.user?.avatar?.url || target?.user?.avatar || '');
                    const isActive = activeConversation?._id === c._id;
                    const unreadCount = c.unreadCounts?.[user._id] || 0;
                    
                    return (
                      <li 
                        key={c._id} 
                        className={`sidebar-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setActiveConversation(c);
                          setActiveTab('chat');
                        }}
                      >
                        <span className="sidebar-item-left">
                          <img src={displayAvatar} alt={displayName} className="sidebar-avatar" />
                          <div>
                            <div style={{ fontWeight: '600' }}>{displayName}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                              {c.lastMessage?.text || (c.lastMessage?.type === 'voice' ? '🎤 Voice Note' : c.lastMessage?.type === 'file' ? '📁 Shared file' : 'No messages yet')}
                            </div>
                          </div>
                        </span>
                        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                        {c.type === 'direct' && target?.user && (
                          <span className={`status-indicator ${onlineStatuses[target.user._id] || (target.user.online ? 'online' : 'offline')}`}></span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {activeTab === 'calls' && (
            <ul className="sidebar-list">
              {callLogs.map(log => {
                const isOut = log.caller?._id === user._id;
                const partner = isOut ? log.receiver : log.caller;
                if (!partner) return null;
                return (
                  <li key={log._id} className="sidebar-item" style={{ cursor: 'default' }}>
                    <span className="sidebar-item-left">
                      <img src={partner.avatar?.url || partner.avatar} alt={partner.name} className="sidebar-avatar" />
                      <div>
                        <div style={{ fontWeight: '600' }}>{partner.name}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                          {isOut ? 'Outgoing' : 'Incoming'} • {log.type} • {formatTimer(log.duration)}
                        </div>
                      </div>
                    </span>
                    <button type="button" className="btn-icon" onClick={() => handleVoiceCall(partner)}>
                      <Phone size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {activeTab === 'meetings' && (
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button type="button" className="btn-primary" onClick={() => handleStartMeeting()} style={{ width: '100%' }}>
                Create New Meeting
              </button>
              <div className="auth-divider">Or join by ID</div>
              <div className="search-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Enter meeting room ID..." 
                  value={meetingInputId}
                  onChange={(e) => setMeetingInputId(e.target.value)}
                />
              </div>
              <button type="button" className="btn-ghost" onClick={() => handleStartMeeting(meetingInputId)} style={{ width: '100%', border: '1px solid var(--secondary)' }} disabled={!meetingInputId.trim()}>
                Join Meeting
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => setShowSettings(true)}>
            <img src={user.avatar?.url || user.avatar} alt="My Avatar" />
            <div className="sidebar-user-info">
              <h4>{user.name}</h4>
              <p>{user.online ? 'Online' : 'Active'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-icon" onClick={() => setShowSettings(true)} title="Settings">
              <Settings size={16} />
            </button>
            <button type="button" className="btn-icon" onClick={logout} title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className={`main-layout ${!activeConversation && activeTab === 'chat' && !activeCall && !activeMeeting ? 'hidden-mobile' : ''}`}>
        
        {/* Active Call screen */}
        {activeCall ? (
          <div className="video-call-container">
            <div className="video-grid">
              <div className="video-tile">
                <video ref={localVideoRef} autoPlay playsInline muted className="video-feed" style={{ transform: 'scaleX(-1)' }} />
                <div className="video-tile-name">You</div>
              </div>
              <div className="video-tile">
                <video ref={remoteVideoRef} autoPlay playsInline className="video-feed" />
                <div className="video-tile-name">{activeCall.peerName}</div>
              </div>
            </div>

            <div className="video-controls">
              <div className="video-timer">
                <div className="status-indicator online" style={{ background: '#e63946' }}></div>
                {formatTimer(callDuration)}
              </div>
              <div className="control-buttons">
                <button type="button" className={`btn-ctrl ${isMuted ? 'muted' : ''}`} onClick={toggleMic}>
                  {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button type="button" className={`btn-ctrl ${isCameraOff ? 'muted' : ''}`} onClick={toggleCamera}>
                  {isCameraOff ? <CameraOff size={18} /> : <Camera size={18} />}
                </button>
                <button type="button" className={`btn-ctrl ${isScreenSharing ? 'muted' : ''}`} onClick={toggleScreenShare}>
                  <Tv size={18} />
                </button>
                <button type="button" className="btn-ctrl hangup" onClick={endCall}>
                  <PhoneOff size={18} />
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                HD P2P WebRTC Connection
              </div>
            </div>
          </div>
        ) : activeMeeting ? (
          /* Active group meeting screen */
          <div className="video-call-container">
            <div className="topbar-container" style={{ background: '#172124', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="topbar-left" style={{ color: '#FFFFFF' }}>
                <span className="topbar-title">Meeting ID: {activeMeeting.roomId}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-primary" onClick={() => setShowWhiteboard(!showWhiteboard)} style={{ fontSize: '0.8rem', padding: '4px 10px', background: showWhiteboard ? 'var(--highlight)' : 'var(--secondary)' }}>
                  {showWhiteboard ? 'Hide Canvas' : 'Collaborate Whiteboard'}
                </button>
                <button type="button" className="btn-ctrl hangup" onClick={handleLeaveMeeting} style={{ width: '32px', height: '32px', borderRadius: '6px' }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {showWhiteboard ? (
                <div style={{ flex: 1, padding: '1rem' }}>
                  <CollaborativeCanvas roomId={activeMeeting.roomId} />
                </div>
              ) : (
                <div className="video-grid" style={{ flex: 1 }}>
                  <div className="video-tile">
                    <video ref={meetingLocalVideoRef} autoPlay playsInline muted className="video-feed" style={{ transform: 'scaleX(-1)' }} />
                    <div className="video-tile-name">You (Host)</div>
                  </div>
                  {peers.map((peer) => (
                    <div key={peer.socketId} className="video-tile">
                      <video 
                        autoPlay 
                        playsInline 
                        ref={(el) => {
                          if (el && peer.stream) el.srcObject = peer.stream;
                        }} 
                        className="video-feed" 
                      />
                      <div className="video-tile-name">{peer.name || 'Participant'}</div>
                    </div>
                  ))}
                  {peers.length === 0 && (
                    <div className="video-tile flex-center" style={{ flexDirection: 'column', background: 'rgba(255,255,255,0.05)' }}>
                      <Users size={32} style={{ opacity: 0.2 }} />
                      <span style={{ fontSize: '0.9rem', opacity: 0.5, marginTop: '8px' }}>Share ID with coworkers to sync</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="video-controls">
              <div className="video-timer">
                <div className="status-indicator online" style={{ background: '#e63946' }}></div>
                {formatTimer(meetingTimer)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Collaborating Active participants: {peers.length + 1}
              </div>
            </div>
          </div>
        ) : activeConversation && activeTab === 'chat' ? (
          /* Normal Chat Area */
          <div className="chat-ui-container">
            <div className="topbar-container">
              <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" className="btn-icon mobile-sidebar-toggle" onClick={() => setActiveConversation(null)} style={{ marginRight: '4px' }}>
                  <ArrowLeft size={16} />
                </button>
                
                {(() => {
                  const target = activeConversation.type === 'direct' ? activeConversation.participants?.find(p => p.user?._id !== user._id) : null;
                  const displayName = activeConversation.type === 'group' ? activeConversation.name : (target?.user?.name || 'Saved Space');
                  const displayAvatar = activeConversation.type === 'group' 
                    ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80' 
                    : (target?.user?.avatar?.url || target?.user?.avatar || '');
                  
                  const isOnline = target?.user && (onlineStatuses[target.user._id] === 'online' || target.user.online);
                  const lastSeenTime = target?.user?.lastSeen ? new Date(target.user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  const statusText = activeConversation.type === 'group' 
                    ? `${activeConversation.participants?.length || 0} participants` 
                    : (isOnline ? 'online' : (lastSeenTime ? `last seen at ${lastSeenTime}` : 'offline'));

                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={displayAvatar} alt={displayName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--primary-dark)' }}>{displayName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{statusText}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="topbar-right">
                <button 
                  type="button" 
                  className="btn-icon" 
                  disabled={activeConversation.type !== 'direct'}
                  onClick={() => {
                    const partner = activeConversation.participants?.find(p => p.user?._id !== user._id)?.user;
                    if (partner) handleVoiceCall(partner);
                  }} 
                  title={activeConversation.type === 'direct' ? "Voice Call" : "Voice calls are only supported in direct messages"}
                  style={{ opacity: activeConversation.type === 'direct' ? 1 : 0.4, cursor: activeConversation.type === 'direct' ? 'pointer' : 'not-allowed' }}
                >
                  <Phone size={16} />
                </button>
                <button 
                  type="button" 
                  className="btn-icon" 
                  disabled={activeConversation.type !== 'direct'}
                  onClick={() => {
                    const partner = activeConversation.participants?.find(p => p.user?._id !== user._id)?.user;
                    if (partner) handleVideoCall(partner);
                  }} 
                  title={activeConversation.type === 'direct' ? "Video Call" : "Video calls are only supported in direct messages"}
                  style={{ opacity: activeConversation.type === 'direct' ? 1 : 0.4, cursor: activeConversation.type === 'direct' ? 'pointer' : 'not-allowed' }}
                >
                  <Video size={16} />
                </button>
                <button type="button" className={`btn-icon ${showRightSidebar ? 'active' : ''}`} onClick={() => setShowRightSidebar(!showRightSidebar)}>
                  <Info size={16} />
                </button>
              </div>
            </div>

            <div className="dashboard-content-area" style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                
                {/* Message logs scroll area */}
                <div className="chat-messages-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                  {messages.length === 0 ? (
                    <div className="flex-center" style={{ height: '100%', flexDirection: 'column', padding: '2rem', opacity: 0.6, gap: '12px', textAlign: 'center' }}>
                      <MessageSquare size={48} style={{ color: 'var(--secondary)' }} />
                      <h4 style={{ color: 'var(--primary-dark)', margin: 0 }}>Start a conversation</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '240px' }}>Type a message below or record a voice note to sync with your teammate.</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isSelf = msg.sender === user._id || msg.sender?._id === user._id;
                      const senderName = isSelf ? 'You' : (activeConversation.participants?.find(p => p.user?._id === msg.sender || p.user?._id === msg.sender?._id)?.user?.name || 'Member');
                      
                      const msgDate = new Date(msg.createdAt).toDateString();
                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
                      const showDateSeparator = msgDate !== prevMsgDate;

                      return (
                        <React.Fragment key={msg._id || index}>
                          {showDateSeparator && (
                            <div className="date-separator flex-center" style={{ margin: '1.25rem 0', width: '100%' }}>
                              <span style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)', padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                {formatDateLabel(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          
                          <div className={`message-bubble-wrapper ${isSelf ? 'self' : ''}`}>
                            <div className="message-bubble-content">
                              {!isSelf && <span className="message-sender">{senderName}</span>}
                              
                              <div className="message-bubble">
                                {/* Reply preview inside bubble */}
                                {msg.replyTo && (
                                  <div className="reply-quote-bubble" style={{ 
                                    background: 'rgba(0,0,0,0.06)', 
                                    borderLeft: '3px solid var(--secondary)', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    marginBottom: '6px', 
                                    fontSize: '0.8rem', 
                                    opacity: 0.85 
                                  }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                                      {msg.replyTo.sender === user._id || msg.replyTo.sender?._id === user._id ? 'You' : 'Member'}
                                    </div>
                                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      {msg.replyTo.text || (msg.replyTo.type === 'image' ? 'Image' : msg.replyTo.type === 'file' ? 'File' : msg.replyTo.type === 'voice' ? 'Voice note' : 'Message')}
                                    </div>
                                  </div>
                                )}

                                {/* Text message */}
                                {msg.type === 'text' && <p>{msg.text}</p>}

                                {/* Shared File/Image */}
                                {(msg.type === 'file' || msg.type === 'image') && msg.file?.url && (
                                  <div className="flex-center" style={{ gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                                    <File size={24} />
                                    <div style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                      {msg.file.name || 'document.pdf'}
                                    </div>
                                    <a href={msg.file.url} download target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                                      <Download size={16} />
                                    </a>
                                  </div>
                                )}

                                {/* Voice Note */}
                                {msg.type === 'voice' && msg.voice?.url && (
                                  <VoiceMessagePlayer url={msg.voice.url} duration={msg.voice.duration} />
                                )}
                              </div>

                              {/* Message Footer with Reactions, Reply, Delete, and Time/Seen status */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                                <span className="message-time">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                
                                {isSelf && renderTicks(msg)}

                                {/* Actions row */}
                                <div className="message-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
                                  {!msg.isDeleted && (
                                    <button 
                                      type="button"
                                      onClick={() => setReplyTo(msg)} 
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                      title="Reply to message"
                                    >
                                      <CornerUpLeft size={12} />
                                    </button>
                                  )}

                                  {isSelf && !msg.isDeleted && (
                                    <button 
                                      type="button"
                                      onClick={() => deleteMessageById(msg._id)} 
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                      title="Delete message"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Message reactions */}
                              <div className="message-reactions">
                                {msg.reactions?.map((react, rIdx) => (
                                  <span 
                                    key={rIdx} 
                                    className={`reaction-tag ${react.user === user._id ? 'user-selected' : ''}`}
                                    onClick={() => toggleMessageReaction(msg._id, react.emoji)}
                                  >
                                    {react.emoji}
                                  </span>
                                ))}
                                {/* Quick Add emoji trigger */}
                                <span 
                                  className="reaction-tag" 
                                  style={{ opacity: 0.5 }}
                                  onClick={() => toggleMessageReaction(msg._id, '👍')}
                                >
                                  + 👍
                                </span>
                                <span 
                                  className="reaction-tag" 
                                  style={{ opacity: 0.5 }}
                                  onClick={() => toggleMessageReaction(msg._id, '❤️')}
                                >
                                  + ❤️
                                </span>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Typing indicators */}
                {Object.keys(typingUsers[activeConversation._id] || {}).length > 0 && (
                  <div className="typing-indicator">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <span style={{ marginLeft: '6px' }}>typing...</span>
                  </div>
                )}

                {/* Reply preview bar */}
                {replyTo && (
                  <div className="reply-preview-bar" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'var(--background)', 
                    borderLeft: '4px solid var(--secondary)', 
                    padding: '8px 16px', 
                    borderTopLeftRadius: '12px', 
                    borderTopRightRadius: '12px', 
                    borderBottom: '1px solid var(--glass-border)',
                    margin: '0 1.5rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--secondary)' }}>
                        Replying to {replyTo.sender === user._id || replyTo.sender?._id === user._id ? 'yourself' : (replyTo.sender?.name || 'member')}
                      </span>
                      <p style={{ margin: 0, fontSize: '0.8rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--primary-dark)' }}>
                        {replyTo.text || (replyTo.type === 'image' ? 'Image' : replyTo.type === 'file' ? 'File' : replyTo.type === 'voice' ? 'Voice note' : 'Message')}
                      </p>
                    </div>
                    <button type="button" className="btn-icon" onClick={() => setReplyTo(null)} style={{ background: 'transparent', border: 'none', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Text input area */}
                <div className="chat-input-bar" style={{ position: 'relative' }}>
                  <form className="chat-input-form" onSubmit={handleSendTextMessage}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <button type="button" className="btn-icon" style={{ background: 'transparent', border: 'none' }} onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}>
                        <Paperclip size={18} />
                      </button>
                      
                      {showAttachmentMenu && (
                        <div className="attachment-dropdown-menu glass" style={{
                          position: 'absolute',
                          bottom: '50px',
                          left: '0',
                          background: 'var(--white)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '12px',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          boxShadow: 'var(--shadow-md)',
                          zIndex: 100,
                          minWidth: '130px'
                        }}>
                          <button type="button" className="sidebar-item" style={{ gap: '8px', padding: '6px 12px', width: '100%', fontSize: '0.85rem', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => triggerAttachment('image/*')}>
                            📷 Image
                          </button>
                          <button type="button" className="sidebar-item" style={{ gap: '8px', padding: '6px 12px', width: '100%', fontSize: '0.85rem', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => triggerAttachment('video/*')}>
                            🎥 Video
                          </button>
                          <button type="button" className="sidebar-item" style={{ gap: '8px', padding: '6px 12px', width: '100%', fontSize: '0.85rem', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => triggerAttachment('audio/*')}>
                            🎵 Audio
                          </button>
                          <button type="button" className="sidebar-item" style={{ gap: '8px', padding: '6px 12px', width: '100%', fontSize: '0.85rem', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => triggerAttachment('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt')}>
                            📄 Document
                          </button>
                        </div>
                      )}
                    </div>

                    <input 
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept={fileAccept}
                      onChange={handleFileUpload}
                    />

                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={inputText}
                      onChange={handleInputChange}
                    />
                    
                    {/* Send or Voice Record buttons WhatsApp style */}
                    {inputText.trim() ? (
                      <button type="submit" className="btn-send" style={{ border: 'none' }}>
                        <Send size={16} />
                      </button>
                    ) : (
                      <VoiceNoteRecorder />
                    )}
                  </form>
                </div>

              </div>

              {/* Right context sidebar */}
              {showRightSidebar && (
                <div className="right-sidebar-container">
                  <div className="rside-header">
                    <h3>Space Context</h3>
                    <button type="button" className="btn-close-modal" onClick={() => setShowRightSidebar(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="rside-content">
                    {activeConversation.type === 'group' ? (
                      <div>
                        <h4>Group Name</h4>
                        <h3>{activeConversation.name}</h3>
                        <div style={{ marginTop: '1rem' }}>
                          <h4>Participants</h4>
                          <ul style={{ listStyle: 'none', padding: 0 }}>
                            {activeConversation.participants?.map(p => (
                              <li key={p.user?._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <img src={p.user?.avatar?.url || p.user?.avatar} alt={p.user?.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                <span>{p.user?.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4>Direct Message Partner</h4>
                        {(() => {
                          const partner = activeConversation.participants?.find(p => p.user?._id !== user._id)?.user;
                          return partner ? (
                            <div className="rside-profile">
                              <img src={partner.avatar?.url || partner.avatar} alt={partner.name} />
                              <h3>{partner.name}</h3>
                              <p>{partner.bio || 'SyncSpace Contributor'}</p>
                              {partner.statusMessage && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.8 }}>"{partner.statusMessage}"</p>}
                            </div>
                          ) : <p>Saved space</p>;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="dashboard-empty">
            <Logo size={64} showText={false} />
            <h2>Welcome to SyncSpace</h2>
            <p>Select a conversation tab or join a collaborative meeting room to get started syncing ideas.</p>
          </div>
        )}

      </div>

      {/* Incoming Call Dialog Modal */}
      {incomingCall && (
        <div className="settings-overlay" style={{ zIndex: 9999 }}>
          <div className="settings-modal glass" style={{ width: '320px', height: '280px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
            <img src={incomingCall.callerAvatar} alt="Caller" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--secondary)' }} />
            <div>
              <h3>{incomingCall.callerName}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Incoming {incomingCall.callType} call...</p>
            </div>
            <div className="flex-center" style={{ gap: '1.5rem' }}>
              <button type="button" className="btn-primary" onClick={acceptCall} style={{ background: '#2ec4b6' }}>
                Accept
              </button>
              <button type="button" className="btn-primary" onClick={rejectCall} style={{ background: '#e63946' }}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* New Conversation Modal */}
      {showNewChatModal && (
        <div className="settings-overlay" style={{ zIndex: 999 }}>
          <div className="settings-modal glass" style={{ width: '450px', height: '500px', flexDirection: 'column', padding: '1.5rem' }}>
            <div className="flex-center" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <h3>Start new sync</h3>
              <button type="button" className="btn-close-modal" onClick={() => {
                setShowNewChatModal(false);
                setSelectedParticipants([]);
                setUserSearchText('');
                setUserSearchResults([]);
              }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className="search-input-wrapper" style={{ marginBottom: '1rem' }}>
                <Search size={14} className="search-icon-fixed" />
                <input 
                  type="text" 
                  placeholder="Search user name or email..." 
                  value={userSearchText}
                  onChange={handleUserSearch}
                />
              </div>

              {/* Group name inputs */}
              <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>CREATE COLLABORATIVE GROUP</div>
                <input 
                  type="text" 
                  placeholder="Group conversation name..." 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.8rem', border: '1px solid var(--glass-border)', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '8px' }}
                />
                <button type="button" className="btn-primary" onClick={handleCreateGroup} disabled={!groupName.trim() || selectedParticipants.length === 0} style={{ width: '100%', fontSize: '0.8rem' }}>
                  Create Group Chat
                </button>
              </div>

              {/* Users search scroll list */}
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>SEARCH RESULTS</div>
              <ul className="sidebar-list">
                {userSearchResults.map(u => {
                  const isSelected = selectedParticipants.includes(u._id || u.id);
                  return (
                    <li key={u._id} className="sidebar-item" style={{ fontSize: '0.85rem' }}>
                      <span className="sidebar-item-left" style={{ cursor: 'pointer' }} onClick={() => handleStartDM(u)}>
                        <img src={u.avatar?.url || u.avatar} alt={u.name} className="sidebar-avatar" />
                        <span>{u.name} (@{u.username})</span>
                      </span>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleParticipant(u._id || u.id)}
                      />
                    </li>
                  );
                })}
                {userSearchText.trim().length > 0 && userSearchResults.length === 0 && (
                  <li style={{ padding: '8px 16px', fontSize: '0.8rem', opacity: 0.5 }}>No users matched search criteria</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
