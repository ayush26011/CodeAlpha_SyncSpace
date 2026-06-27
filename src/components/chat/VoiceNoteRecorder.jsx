import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Square, Send, Play, Pause, Trash2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function VoiceNoteRecorder() {
  const { sendVoiceNoteMessage } = useChat();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [micError, setMicError] = useState('');
  
  // Preview audio states
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const previewAudioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Set up preview audio whenever audioBlob changes
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      previewAudioRef.current = new Audio(url);
      
      const audio = previewAudioRef.current;
      const onTimeUpdate = () => setPreviewTime(audio.currentTime);
      const onEnded = () => {
        setPreviewPlaying(false);
        setPreviewTime(0);
      };
      
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);
      
      return () => {
        audio.pause();
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        URL.revokeObjectURL(url);
      };
    } else {
      previewAudioRef.current = null;
      setPreviewPlaying(false);
      setPreviewTime(0);
    }
  }, [audioBlob]);

  const startRecording = async () => {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      setAudioBlob(null);
      
      timerIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (e) {
      console.error("Error accessing microphone:", e);
      setMicError("Microphone permission denied. Please allow microphone access in settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // stop stream tracks to release device
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setDuration(0);
  };

  const handleSendVoiceNote = async () => {
    if (!audioBlob) return;
    try {
      await sendVoiceNoteMessage(audioBlob, duration);
    } catch (err) {
      console.error("Failed to send voice note:", err);
    }
    setAudioBlob(null);
    setDuration(0);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (previewPlaying) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      previewAudioRef.current.play().catch(e => console.error("Preview failed", e));
      setPreviewPlaying(true);
    }
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {/* Mic Trigger Button (Default state) */}
      {!isRecording && !audioBlob && (
        <button
          type="button"
          className="btn-icon"
          onClick={startRecording}
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: 'rgba(116, 168, 164, 0.15)', 
            color: 'var(--secondary)', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Record Voice Note"
        >
          <Mic size={18} />
        </button>
      )}

      {/* Recording Overlay Mode */}
      {isRecording && (
        <div className="voice-recorder-overlay" style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          background: 'var(--white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          borderRadius: '12px',
          zIndex: 10,
          border: '1px solid var(--highlight)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="status-indicator online" style={{ 
              background: '#e63946', 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%',
              animation: 'pulse 1.2s infinite' 
            }}></span>
            <span style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontWeight: '600' }}>Recording Audio</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--highlight)', fontFamily: 'monospace', marginLeft: '8px' }}>
              {formatDuration(duration)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              className="btn-icon" 
              onClick={stopRecording} 
              style={{ background: 'var(--secondary)', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justify: 'center' }} 
              title="Stop and Preview"
            >
              <Square size={12} fill="#FFFFFF" style={{ margin: 'auto' }} />
            </button>
            <button 
              type="button" 
              className="btn-icon" 
              onClick={cancelRecording} 
              style={{ background: 'transparent', border: 'none', width: '32px', height: '32px', color: 'var(--text-secondary)' }} 
              title="Cancel Recording"
            >
              <Trash2 size={16} style={{ margin: 'auto' }} />
            </button>
          </div>
        </div>
      )}

      {/* Stopped & Preview Overlay Mode */}
      {audioBlob && (
        <div className="voice-recorder-overlay" style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          background: 'var(--white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          borderRadius: '12px',
          zIndex: 10,
          border: '1px solid var(--secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <button 
              type="button" 
              onClick={togglePreviewPlay}
              style={{
                background: 'var(--secondary)',
                color: '#FFF',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {previewPlaying ? <Pause size={14} fill="#FFF" /> : <Play size={14} fill="#FFF" style={{ marginLeft: '2px' }} />}
            </button>
            
            <div style={{ flex: 1, maxWidth: '240px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={previewTime} 
                readOnly
                style={{ 
                  width: '100%', 
                  height: '4px', 
                  borderRadius: '2px', 
                  accentColor: 'var(--secondary)' 
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.8 }}>
                <span>{formatDuration(previewTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
            
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Voice Note Preview</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              className="btn-send" 
              onClick={handleSendVoiceNote} 
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              title="Send Voice Note"
            >
              <Send size={14} style={{ margin: 'auto' }} />
            </button>
            <button 
              type="button" 
              className="btn-icon" 
              onClick={cancelRecording} 
              style={{ background: 'transparent', border: 'none', width: '32px', height: '32px', color: 'var(--text-secondary)' }} 
              title="Discard Voice Note"
            >
              <Trash2 size={16} style={{ margin: 'auto' }} />
            </button>
          </div>
        </div>
      )}

      {/* Permission Denial Error Toast */}
      {micError && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          background: 'var(--highlight)',
          color: '#FFF',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '8px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{micError}</span>
          <button type="button" onClick={() => setMicError('')} style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>
      )}
    </div>
  );
}
