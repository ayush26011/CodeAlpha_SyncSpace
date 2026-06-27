import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as meetingService from '../services/meetingService';
import { getSocket } from '../services/socketService';

const MeetingContext = createContext(null);

export const MeetingProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [peers, setPeers] = useState([]); // Array of peer objects { socketId, stream, name, avatar }
  const [localStream, setLocalStream] = useState(null);
  const [meetingTimer, setMeetingTimer] = useState(0);

  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const iceServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19002' }]
  };

  useEffect(() => {
    let interval = null;
    if (activeMeeting) {
      setMeetingTimer(0);
      interval = setInterval(() => {
        setMeetingTimer(prev => prev + 1);
      }, 1000);
    } else {
      setMeetingTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeMeeting]);

  useEffect(() => {
    const socketCon = getSocket();
    if (!socketCon || !activeMeeting) return;

    socketCon.on('meeting_peers', async ({ peers }) => {
      // Initiate WebRTC connection to existing peers
      peers.forEach(async (peerSocketId) => {
        const pc = createPeerConnection(peerSocketId, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketCon.emit('meeting_offer', { toSocketId: peerSocketId, offer });
      });
    });

    socketCon.on('meeting_offer', async ({ fromSocketId, offer, name, avatar }) => {
      const pc = createPeerConnection(fromSocketId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketCon.emit('meeting_answer', { toSocketId: fromSocketId, answer });
    });

    socketCon.on('meeting_answer', async ({ fromSocketId, answer }) => {
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socketCon.on('meeting_ice_candidate', async ({ fromSocketId, candidate }) => {
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketCon.on('meeting_user_left', ({ socketId }) => {
      removePeer(socketId);
    });

    return () => {
      socketCon.off('meeting_peers');
      socketCon.off('meeting_offer');
      socketCon.off('meeting_answer');
      socketCon.off('meeting_ice_candidate');
      socketCon.off('meeting_user_left');
    };
  }, [activeMeeting]);

  const createPeerConnection = (peerSocketId, isCaller) => {
    const pc = new RTCPeerConnection(iceServers);
    peerConnectionsRef.current.set(peerSocketId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    const socketCon = getSocket();
    pc.onicecandidate = (event) => {
      if (event.candidate && socketCon) {
        socketCon.emit('meeting_ice_candidate', { toSocketId: peerSocketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setPeers(prev => {
          const index = prev.findIndex(p => p.socketId === peerSocketId);
          if (index > -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], stream: event.streams[0] };
            return updated;
          } else {
            return [...prev, { socketId: peerSocketId, stream: event.streams[0] }];
          }
        });
      }
    };

    return pc;
  };

  const removePeer = (socketId) => {
    const pc = peerConnectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(socketId);
    }
    setPeers(prev => prev.filter(p => p.socketId !== socketId));
  };

  const joinMeeting = async (roomId, title) => {
    try {
      // Register or fetch in database
      const room = await meetingService.createMeeting(roomId, title);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      }).catch(() => {
        // Mock fallback canvas stream
        return createMockStream();
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setActiveMeeting(room);

      const socketCon = getSocket();
      if (socketCon) {
        socketCon.emit('join_meeting', { roomId });
      }
    } catch (e) {
      console.error(e);
      leaveMeeting();
    }
  };

  const leaveMeeting = async () => {
    if (activeMeeting) {
      const socketCon = getSocket();
      if (socketCon) {
        socketCon.emit('leave_meeting', { roomId: activeMeeting.roomId });
      }
      
      // Call endpoint to log participants leaving
      try {
        await meetingService.endMeeting(activeMeeting.roomId);
      } catch (e) {
        console.warn(e);
      }
    }

    // Stop tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peers
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    setPeers([]);
    setLocalStream(null);
    setActiveMeeting(null);
  };

  const createMockStream = () => {
    const mediaStream = new MediaStream();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const dest = audioCtx.createMediaStreamDestination();
    osc.connect(dest);
    osc.start();
    mediaStream.addTrack(dest.stream.getAudioTracks()[0]);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let angle = 0;
    
    const draw = () => {
      ctx.fillStyle = '#335765';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#74A8A4';
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);
      ctx.fillRect(-50, -50, 100, 100);
      ctx.restore();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SyncSpace Group Meeting Feed', canvas.width / 2, 60);
      angle += 0.03;
      requestAnimationFrame(draw);
    };
    
    requestAnimationFrame(draw);
    const canvasStream = canvas.captureStream(30);
    mediaStream.addTrack(canvasStream.getVideoTracks()[0]);

    return mediaStream;
  };

  return (
    <MeetingContext.Provider value={{
      activeMeeting,
      peers,
      localStream,
      meetingTimer,
      joinMeeting,
      leaveMeeting
    }}>
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => useContext(MeetingContext);
export default MeetingContext;
