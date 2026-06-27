import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

export default function VoiceMessagePlayer({ url, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    
    const audio = audioRef.current;
    
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("Playback failed", e));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString();
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const displayDuration = duration || (audioRef.current ? audioRef.current.duration : 0) || 0;

  return (
    <div className="voice-player-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '220px', padding: '4px' }}>
      <button 
        type="button" 
        onClick={togglePlay} 
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
        {isPlaying ? <Pause size={14} fill="#FFF" /> : <Play size={14} fill="#FFF" style={{ marginLeft: '2px' }} />}
      </button>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input 
          type="range" 
          min="0" 
          max={displayDuration || 100} 
          value={currentTime} 
          onChange={handleSeek} 
          style={{ 
            width: '100%', 
            height: '4px', 
            borderRadius: '2px', 
            accentColor: 'var(--secondary)', 
            cursor: 'pointer' 
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.8 }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>
    </div>
  );
}
