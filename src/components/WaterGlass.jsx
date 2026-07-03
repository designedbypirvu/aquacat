import React, { useEffect, useState, useRef } from 'react';

export default function WaterGlass({ percent = 0, triggerSplash = false }) {
  const [bubbles, setBubbles] = useState([]);
  const [showRipple, setShowRipple] = useState(false);
  const [maxed, setMaxed] = useState(false);
  const [shockwave, setShockwave] = useState(false);
  const prevPercent = useRef(0);

  useEffect(() => {
    const newBubbles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 90 + 5}%`,
      size: `${Math.random() * 6 + 3}px`,
      delay: `${Math.random() * 4}s`,
      duration: `${Math.random() * 3 + 3}s`,
      drift: `${Math.random() * 30 - 15}px`,
    }));
    setBubbles(newBubbles);
  }, []);

  useEffect(() => {
    if (triggerSplash) {
      setShowRipple(true);
      const timer = setTimeout(() => setShowRipple(false), 600);
      return () => clearTimeout(timer);
    }
  }, [triggerSplash]);

  // Detect crossing into 100%
  useEffect(() => {
    const wasMaxed = prevPercent.current >= 100;
    const isMaxed  = percent >= 100;
    prevPercent.current = percent;

    if (isMaxed && !wasMaxed) {
      // First time hitting 100 — fire shockwave + lock maxed mode
      setShockwave(true);
      setTimeout(() => setShockwave(false), 1200);
    }
    setMaxed(isMaxed);
  }, [percent]);

  const clampPercent = Math.min(Math.max(percent, 0), 100);
  const isMaxed = percent >= 100;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>

      {/* Central Glass Cylinder */}
      <div className={`cylinder-container ${isMaxed ? 'cylinder-maxed' : 'glow-primary'}`}>

        {/* Bubbles — turbocharged at 100% */}
        {clampPercent > 0 && bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="bubble"
            style={{
              left: bubble.left,
              width: isMaxed ? `${parseFloat(bubble.size) * 1.4}px` : bubble.size,
              height: isMaxed ? `${parseFloat(bubble.size) * 1.4}px` : bubble.size,
              animationDelay: bubble.delay,
              animationDuration: isMaxed ? `${parseFloat(bubble.duration) * 0.5}s` : bubble.duration,
              '--drift': bubble.drift,
              opacity: isMaxed ? 0.9 : 0.6,
            }}
          />
        ))}

        {/* Liquid Body */}
        {clampPercent > 0 && (
          <div
            className={`cylinder-liquid ${isMaxed ? 'cylinder-liquid-maxed' : ''}`}
            style={{ height: `${clampPercent}%` }}
          >
            <svg className="wave-svg wave-front" viewBox="0 0 120 28" preserveAspectRatio="none">
              <path d="M0,15 C30,5 90,25 120,15 L120,28 L0,28 Z" />
            </svg>
            <svg className="wave-svg wave-back" viewBox="0 0 120 28" preserveAspectRatio="none">
              <path d="M0,15 C30,25 90,5 120,15 L120,28 L0,28 Z" />
            </svg>
          </div>
        )}

        {/* Overflow drip at 100% */}
        {isMaxed && (
          <div className="overflow-drip" />
        )}

        {/* Shockwave ring */}
        {shockwave && <div className="shockwave-ring" />}

        {showRipple && <div className="water-splash" />}
      </div>

      {/* Floating Percent Label */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 30,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Outfit',
            fontSize: isMaxed ? '38px' : '44px',
            fontWeight: 800,
            color: '#fff',
            display: 'block',
            lineHeight: 1,
            textShadow: isMaxed
              ? '0 0 20px rgba(0,245,212,0.8), 0 0 40px rgba(0,245,212,0.4), 0 4px 10px rgba(0,0,0,0.6)'
              : '0 4px 10px rgba(0,0,0,0.6)',
            animation: isMaxed ? 'maxPulse 1.2s ease-in-out infinite' : 'none',
          }}
        >
          {isMaxed ? '💧 MAX' : `${Math.round(percent)}%`}
        </span>
        <span
          style={{
            fontSize: isMaxed ? '12px' : '11px',
            color: isMaxed ? '#00f5d4' : 'rgba(255,255,255,0.7)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: isMaxed ? '0 0 10px rgba(0,245,212,0.7)' : 'none',
            animation: isMaxed ? 'maxPulse 1.2s 0.2s ease-in-out infinite' : 'none',
          }}
        >
          {isMaxed ? 'FULLY HYDRATED' : 'Hydrated'}
        </span>
      </div>
    </div>
  );
}
