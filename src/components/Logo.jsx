import React from 'react';

export default function Logo({ size = 32, showText = true, className = '' }) {
  return (
    <div className={`flex-center ${className}`} style={{ gap: '10px', display: 'inline-flex', userSelect: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transition: 'transform 0.3s ease' }}
      >
        {/* Outer orbital rings representing connection/network */}
        <circle cx="50" cy="50" r="42" stroke="var(--primary-dark)" strokeWidth="6" strokeDasharray="6 6" opacity="0.25" />
        <circle cx="50" cy="50" r="32" stroke="var(--secondary)" strokeWidth="5" opacity="0.4" />
        
        {/* Core connection nodes */}
        <circle cx="50" cy="24" r="9" fill="var(--highlight)" />
        <circle cx="28" cy="62" r="9" fill="var(--secondary)" />
        <circle cx="72" cy="62" r="9" fill="var(--accent)" />
        
        {/* Flow lines between nodes */}
        <path d="M50 33 L32 55" stroke="var(--primary-dark)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <path d="M50 33 L68 55" stroke="var(--primary-dark)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <path d="M37 62 L63 62" stroke="var(--secondary)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        
        {/* Center alignment node representing sync */}
        <circle cx="50" cy="50" r="5" fill="var(--primary-dark)" />
      </svg>
      {showText && (
        <span
          style={{
            fontFamily: 'var(--font-headings)',
            fontWeight: '700',
            fontSize: `${size * 0.65}px`,
            color: 'var(--primary-dark)',
            letterSpacing: '-0.03em',
          }}
        >
          Sync<span style={{ color: 'var(--secondary)' }}>Space</span>
        </span>
      )}
    </div>
  );
}
