import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import * as callService from '../services/callService';
import { getSocket } from '../services/socketService';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useChat();

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const iceServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19002' }]
  };

  useEffect(() => {
    const socketCon = getSocket();
    if (!socketCon) return;

    socketCon.on('incoming_call', ({ from, callerName, callerAvatar, offer, callType }) => {
      setIncomingCall({ from, callerName, callerAvatar, offer, callType });
    });

    socketCon.on('call_accepted', async ({ answer }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setActiveCall(prev => prev ? { ...prev, status: 'accepted' } : null);
          startTimeRef.current = new Date();
          startDurationTimer();
        } catch (e) {
          console.error("Error setting remote description on call accept:", e);
        }
      }
    });

    socketCon.on('call_rejected', () => {
      cleanCallState('rejected');
    });

    socketCon.on('call_ended', () => {
      cleanCallState('ended');
    });

    socketCon.on('ice_candidate', async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate:", e);
        }
      }
    });

    return () => {
      socketCon.off('incoming_call');
      socketCon.off('call_accepted');
      socketCon.off('call_rejected');
      socketCon.off('call_ended');
      socketCon.off('ice_candidate');
    };
  }, [socket]);

  const startDurationTimer = () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanCallState = async (finalStatus = 'ended') => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Save Call Log to DB
    if (activeCall) {
      try {
        await callService.createCallLog({
          receiverId: activeCall.peerId,
          type: activeCall.callType,
          status: finalStatus,
          duration: callDuration,
          startedAt: startTimeRef.current || new Date(),
          endedAt: new Date()
        });
      } catch (e) {
        console.error("Error saving call log:", e);
      }
    }

    setIncomingCall(null);
    setActiveCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    startTimeRef.current = null;
  };

  const initiateCall = async (recipientId, recipientName, recipientAvatar, callType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      }).catch(() => createMockStream(callType === 'video'));

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const socketCon = getSocket();
      pc.onicecandidate = (event) => {
        if (event.candidate && socketCon) {
          socketCon.emit('ice_candidate', { to: recipientId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socketCon) {
        socketCon.emit('call_user', {
          to: recipientId,
          offer,
          callType
        });
      }

      setActiveCall({
        peerId: recipientId,
        peerName: recipientName,
        peerAvatar: recipientAvatar,
        callType,
        status: 'calling',
        isCaller: true
      });
      startTimeRef.current = new Date();
    } catch (e) {
      console.error(e);
      cleanCallState('missed');
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === 'video',
        audio: true
      }).catch(() => createMockStream(incomingCall.callType === 'video'));

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const socketCon = getSocket();
      pc.onicecandidate = (event) => {
        if (event.candidate && socketCon) {
          socketCon.emit('ice_candidate', { to: incomingCall.from, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socketCon) {
        socketCon.emit('call_accepted', { to: incomingCall.from, answer });
      }

      setActiveCall({
        peerId: incomingCall.from,
        peerName: incomingCall.callerName,
        peerAvatar: incomingCall.callerAvatar,
        callType: incomingCall.callType,
        status: 'accepted',
        isCaller: false
      });
      setIncomingCall(null);
      startTimeRef.current = new Date();
      startDurationTimer();
    } catch (e) {
      console.error(e);
      cleanCallState('rejected');
    }
  };

  const rejectCall = () => {
    const socketCon = getSocket();
    if (incomingCall && socketCon) {
      socketCon.emit('call_rejected', { to: incomingCall.from });
      
      // Log missed call
      callService.createCallLog({
        receiverId: user._id,
        type: incomingCall.callType,
        status: 'rejected',
        duration: 0,
        startedAt: new Date(),
        endedAt: new Date()
      }).catch(e => console.error(e));
    }
    setIncomingCall(null);
  };

  const endCall = () => {
    const socketCon = getSocket();
    if (activeCall && socketCon) {
      socketCon.emit('call_ended', { to: activeCall.peerId });
    }
    cleanCallState('ended');
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!activeCall) return;
    try {
      if (isScreenSharing) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: activeCall.callType === 'video',
          audio: true
        }).catch(() => createMockStream(activeCall.callType === 'video'));

        replaceVideoTrack(stream.getVideoTracks()[0]);
        setLocalStream(stream);
        setIsScreenSharing(false);
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        replaceVideoTrack(screenTrack);
        setLocalStream(screenStream);
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          toggleScreenShare(); // restore camera
        };
      }
    } catch (e) {
      console.error(e);
    }
  };

  const replaceVideoTrack = (newTrack) => {
    if (peerConnectionRef.current) {
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(newTrack);
      }
    }
  };

  const createMockStream = (hasVideo) => {
    const mediaStream = new MediaStream();
    
    // Audio
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const dest = audioCtx.createMediaStreamDestination();
    osc.connect(dest);
    osc.start();
    mediaStream.addTrack(dest.stream.getAudioTracks()[0]);

    if (hasVideo) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      let angle = 0;
      
      const drawMockFeed = () => {
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
        ctx.fillText('SyncSpace Active P2P stream', canvas.width / 2, 60);
        angle += 0.03;
        requestAnimationFrame(drawMockFeed);
      };
      
      requestAnimationFrame(drawMockFeed);
      const canvasStream = canvas.captureStream(30);
      mediaStream.addTrack(canvasStream.getVideoTracks()[0]);
    }

    return mediaStream;
  };

  return (
    <CallContext.Provider value={{
      incomingCall,
      activeCall,
      localStream,
      remoteStream,
      isMuted,
      isCameraOff,
      isScreenSharing,
      callDuration,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMic,
      toggleCamera,
      toggleScreenShare
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
export default CallContext;
