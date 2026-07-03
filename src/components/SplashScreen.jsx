import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('out'), 2000);
    const doneTimer = setTimeout(() => onDone?.(), 2700);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#070b19',
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)' : 'none',
      pointerEvents: phase === 'out' ? 'none' : 'all',
    }}>

      {/* Ambient glow — orange blob behind logo */}
      <div style={{
        position: 'absolute', width: '300px', height: '300px',
        borderRadius: '50%', top: '50%', left: '50%',
        transform: 'translate(-50%, -58%)',
        background: 'radial-gradient(circle, rgba(255,159,28,0.18) 0%, transparent 70%)',
        filter: 'blur(24px)',
        animation: 'splashPulse 2.8s ease-in-out infinite',
      }} />

      {/* Actual app icon — revealed with a clip-path sweep */}
      <div style={{
        width: '120px', height: '120px',
        borderRadius: '28px',
        overflow: 'hidden',
        marginBottom: '28px',
        boxShadow: '0 0 40px rgba(255,159,28,0.35), 0 20px 60px rgba(0,0,0,0.5)',
        animation: 'logoReveal 0.9s 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
        position: 'relative',
      }}>
        <img
          src="/icons/icon-192.png"
          alt="AquaCat"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
        />
        {/* Shimmer sweep overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
          animation: 'shimmer 1.2s 0.5s ease forwards',
          transform: 'translateX(-100%)',
        }} />
      </div>

      {/* App name */}
      <div style={{
        fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '34px',
        letterSpacing: '-0.5px', color: '#f8f9fa',
        animation: 'textSlideUp 0.5s 0.75s cubic-bezier(0.34,1.56,0.64,1) both',
        textShadow: '0 0 30px rgba(255,159,28,0.25)',
      }}>
        Aqua<span style={{ color: '#ff9f1c' }}>Cat</span>
      </div>

      {/* Tagline */}
      <div style={{
        fontFamily: "'Inter', sans-serif", fontSize: '13px',
        color: '#8b9bb4', marginTop: '6px', letterSpacing: '0.4px',
        animation: 'textSlideUp 0.5s 1s ease both',
      }}>
        Stay hydrated with Burger 🐱
      </div>

      {/* Loading bar */}
      <div style={{
        marginTop: '44px', width: '110px', height: '3px',
        background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden',
        animation: 'textSlideUp 0.4s 1.1s ease both',
      }}>
        <div style={{
          height: '100%', borderRadius: '99px',
          background: 'linear-gradient(90deg, #0e4ed9ff, #00f5d4)',
          animation: 'loadBar 1s 1.1s cubic-bezier(0.4,0,0.2,1) forwards',
          width: '0%',
        }} />
      </div>

      <style>{`
        @keyframes logoReveal {
          0%  { opacity: 0; transform: scale(0.6) translateY(16px); }
          100%{ opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmer {
          to { transform: translateX(200%); }
        }
        @keyframes textSlideUp {
          0%  { opacity: 0; transform: translateY(14px); }
          100%{ opacity: 1; transform: translateY(0); }
        }
        @keyframes loadBar {
          to { width: 100%; }
        }
        @keyframes splashPulse {
          0%,100%{ opacity: 0.8; transform: translate(-50%,-58%) scale(1); }
          50%    { opacity: 1;   transform: translate(-50%,-58%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
