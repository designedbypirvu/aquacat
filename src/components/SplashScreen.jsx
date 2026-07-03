import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    // hold after draw animation completes (~1.4s), then fade out
    const holdTimer  = setTimeout(() => setPhase('out'), 1800);
    const doneTimer  = setTimeout(() => onDone?.(), 2500);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#070b19',
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      pointerEvents: phase === 'out' ? 'none' : 'all',
    }}>

      {/* Ambient glow blobs */}
      <div style={{
        position: 'absolute', width: '340px', height: '340px',
        borderRadius: '50%', top: '50%', left: '50%',
        transform: 'translate(-50%, -60%)',
        background: 'radial-gradient(circle, rgba(255,159,28,0.12) 0%, transparent 70%)',
        animation: 'splashPulse 2.5s ease-in-out infinite',
        filter: 'blur(20px)',
      }} />
      <div style={{
        position: 'absolute', width: '260px', height: '260px',
        borderRadius: '50%', top: '50%', left: '50%',
        transform: 'translate(-40%, -40%)',
        background: 'radial-gradient(circle, rgba(0,245,212,0.08) 0%, transparent 70%)',
        animation: 'splashPulse 3s 0.5s ease-in-out infinite',
        filter: 'blur(30px)',
      }} />

      {/* Logo SVG — cat inside water drop, drawn via stroke animation */}
      <div style={{
        animation: 'splashLogoIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        opacity: 0,
        marginBottom: '28px',
        filter: 'drop-shadow(0 0 24px rgba(255,159,28,0.4))',
      }}>
        <svg width="110" height="130" viewBox="0 0 110 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Water drop outline */}
          <path
            d="M55 8 L88 52 C96 64 98 76 95 88 C90 108 74 122 55 122 C36 122 20 108 15 88 C12 76 14 64 22 52 Z"
            stroke="#ff9f1c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"
            style={{ strokeDasharray: 320, strokeDashoffset: 320, animation: 'drawStroke 1s 0.1s ease forwards' }}
          />
          {/* Cat ear (left) */}
          <path
            d="M40 60 L36 45 L50 55"
            stroke="#ff9f1c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: 'drawStroke 0.5s 0.8s ease forwards' }}
          />
          {/* Cat head profile */}
          <path
            d="M50 55 C58 50 68 54 72 62 C76 70 72 80 65 86 C60 90 52 90 46 86 C38 80 36 70 40 60"
            stroke="#ff9f1c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            style={{ strokeDasharray: 120, strokeDashoffset: 120, animation: 'drawStroke 0.7s 0.9s ease forwards' }}
          />
          {/* Cat nose dot */}
          <circle
            cx="57" cy="72" r="3"
            fill="#ff9f1c"
            style={{ opacity: 0, animation: 'fadeIn 0.3s 1.4s ease forwards' }}
          />
          {/* Whiskers */}
          <line x1="60" y1="75" x2="80" y2="71" stroke="#ff9f1c" strokeWidth="2" strokeLinecap="round"
            style={{ strokeDasharray: 22, strokeDashoffset: 22, animation: 'drawStroke 0.35s 1.5s ease forwards' }} />
          <line x1="60" y1="77" x2="80" y2="77" stroke="#ff9f1c" strokeWidth="2" strokeLinecap="round"
            style={{ strokeDasharray: 22, strokeDashoffset: 22, animation: 'drawStroke 0.35s 1.6s ease forwards' }} />
          <line x1="60" y1="79" x2="80" y2="83" stroke="#ff9f1c" strokeWidth="2" strokeLinecap="round"
            style={{ strokeDasharray: 22, strokeDashoffset: 22, animation: 'drawStroke 0.35s 1.7s ease forwards' }} />
        </svg>
      </div>

      {/* App name */}
      <div style={{
        fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '34px',
        letterSpacing: '-0.5px', color: '#f8f9fa',
        animation: 'splashTextIn 0.5s 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        opacity: 0,
        textShadow: '0 0 30px rgba(255,159,28,0.3)',
      }}>
        Aqua<span style={{ color: '#ff9f1c' }}>Cat</span>
      </div>

      {/* Tagline */}
      <div style={{
        fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8b9bb4',
        marginTop: '6px', letterSpacing: '0.5px',
        animation: 'splashTextIn 0.5s 1s ease forwards',
        opacity: 0,
      }}>
        Stay hydrated with Burger 🐱
      </div>

      {/* Loading bar */}
      <div style={{
        marginTop: '40px', width: '120px', height: '3px',
        background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden',
        animation: 'splashFadeIn 0.3s 1.1s ease forwards', opacity: 0,
      }}>
        <div style={{
          height: '100%', borderRadius: '99px',
          background: 'linear-gradient(90deg, #ff9f1c, #00f5d4)',
          animation: 'loadBar 0.9s 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          width: '0%',
        }} />
      </div>

      <style>{`
        @keyframes drawStroke {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @keyframes splashLogoIn {
          0%  { opacity: 0; transform: scale(0.7) translateY(10px); }
          100%{ opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashTextIn {
          0%  { opacity: 0; transform: translateY(12px); }
          100%{ opacity: 1; transform: translateY(0); }
        }
        @keyframes splashFadeIn {
          to { opacity: 1; }
        }
        @keyframes loadBar {
          to { width: 100%; }
        }
        @keyframes splashPulse {
          0%, 100% { transform: translate(-50%, -60%) scale(1); opacity: 1; }
          50%       { transform: translate(-50%, -60%) scale(1.12); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
