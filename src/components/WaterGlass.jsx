import React, { useEffect, useState } from 'react';

export default function WaterGlass({ percent = 0, triggerSplash = false }) {
  const [bubbles, setBubbles] = useState([]);
  const [showRipple, setShowRipple] = useState(false);

  // Generate randomized bubble metadata for particle effect
  useEffect(() => {
    const newBubbles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 90 + 5}%`,
      size: `${Math.random() * 6 + 3}px`,
      delay: `${Math.random() * 4}s`,
      duration: `${Math.random() * 3 + 3}s`,
      drift: `${Math.random() * 30 - 15}px`,
    }));
    setBubbles(newBubbles);
  }, []);

  // Watch for the splash trigger to show a temporary ripple splash overlay
  useEffect(() => {
    if (triggerSplash) {
      setShowRipple(true);
      const timer = setTimeout(() => setShowRipple(false), 600);
      return () => clearTimeout(timer);
    }
  }, [triggerSplash]);

  // Clamp percent between 0 and 100
  const clampPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
      
      {/* Central Glass Cylinder */}
      <div className="cylinder-container glow-primary">
        
        {/* Particle Bubbles (only visible inside fluid if fill is greater than 0) */}
        {clampPercent > 0 && bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="bubble"
            style={{
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              animationDelay: bubble.delay,
              animationDuration: bubble.duration,
              '--drift': bubble.drift,
            }}
          />
        ))}

        {/* Liquid Body containing nested top-floating waves */}
        {clampPercent > 0 && (
          <div className="cylinder-liquid" style={{ height: `${clampPercent}%` }}>
            {/* Front Wave (matches liquid color perfectly to form a single continuous body) */}
            <svg className="wave-svg wave-front" viewBox="0 0 120 28" preserveAspectRatio="none">
              <path d="M0,15 C30,5 90,25 120,15 L120,28 L0,28 Z" />
            </svg>

            {/* Back Wave (slightly offset darker tone for depth parallax) */}
            <svg className="wave-svg wave-back" viewBox="0 0 120 28" preserveAspectRatio="none">
              <path d="M0,15 C30,25 90,5 120,15 L120,28 L0,28 Z" />
            </svg>
          </div>
        )}

        {/* Dynamic Water Log Ripple Splash Effect */}
        {showRipple && <div className="water-splash" />}
      </div>

      {/* Floating Percent Label */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          textShadow: '0 4px 10px rgba(0,0,0,0.6)',
          zIndex: 30,
          textAlign: 'center',
        }}
      >
        <span 
          style={{ 
            fontFamily: 'Outfit', 
            fontSize: '44px', 
            fontWeight: 800, 
            color: '#fff',
            display: 'block',
            lineHeight: 1
          }}
        >
          {Math.round(percent)}%
        </span>
        <span 
          style={{ 
            fontSize: '11px', 
            color: 'rgba(255,255,255,0.7)', 
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          Hydrated
        </span>
      </div>
    </div>
  );
}
