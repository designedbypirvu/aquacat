import React, { useState, useEffect, useRef } from 'react';
import CatMascot from './components/CatMascot';
import WaterGlass from './components/WaterGlass';
import NotificationSettings from './components/NotificationSettings';
import HistoryChart from './components/HistoryChart';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [intake, setIntake] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [history, setHistory] = useState([]);
  const [intervalHours, setIntervalHours] = useState(2);
  const [isDrinking, setIsDrinking] = useState(false);
  const [triggerSplash, setTriggerSplash] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);

  const [dndHours, setDndHours] = useState(() => {
    return Number(localStorage.getItem('aquacat_dndHours') || 0);
  });

  // Check DND quiet hours
  useEffect(() => {
    const checkDnd = () => {
      if (!dndHours) { setIsSleeping(false); return; }
      const h = new Date().getHours();
      // DND starts at 23 (11pm), lasts dndHours
      const inWindow = h >= 23 || h < ((23 + dndHours) % 24);
      setIsSleeping(inWindow);
    };
    checkDnd();
    const id = setInterval(checkDnd, 15_000); // Check frequently
    return () => clearInterval(id);
  }, [dndHours]);

  // Ref to hold audio context for synthesis
  const audioCtxRef = useRef(null);

  const getLocalDateStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // Initialize data from LocalStorage on mount
  useEffect(() => {
    const todayStr = getLocalDateStr();
    
    // Load daily goal
    const savedGoal = localStorage.getItem('aquacat_goal');
    if (savedGoal) setGoal(Number(savedGoal));

    // Load reminder interval
    const savedIntervalRaw = localStorage.getItem('aquacat_interval');
    const savedInterval = savedIntervalRaw ? Number(savedIntervalRaw) : 2;
    setIntervalHours(savedInterval);

    // Load full history
    const savedHistory = localStorage.getItem('aquacat_history');
    let loadedHistory = [];
    if (savedHistory) {
      loadedHistory = JSON.parse(savedHistory);
      setHistory(loadedHistory);
    }

    // Find or initialize today's entry
    const todayEntry = loadedHistory.find(entry => entry.date === todayStr);
    if (todayEntry) {
      setIntake(todayEntry.amount);
    } else {
      setIntake(0);
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.log('Service Worker registration failed:', err);
        });

      // Handle message calls coming from Service Worker (e.g. quick-log notification actions)
      const handleServiceWorkerMessage = (event) => {
        if (event.data && event.data.type === 'QUICK_LOG_WATER') {
          addWater(Number(event.data.amount || 250));
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, []);

  // Update today's entry in history and LocalStorage whenever intake changes
  const saveIntakeToHistory = (newAmount) => {
    const todayStr = getLocalDateStr();
    setHistory((prevHistory) => {
      const updatedHistory = [...prevHistory];
      const index = updatedHistory.findIndex(entry => entry.date === todayStr);

      if (index !== -1) {
        updatedHistory[index].amount = newAmount;
      } else {
        updatedHistory.push({ date: todayStr, amount: newAmount });
      }

      localStorage.setItem('aquacat_history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  // Sound Synthesizer: Custom synthesizers using the standard Web Audio API
  const playSynthSound = (type) => {
    try {
      // Create audio context lazily on user gesture
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'droplet') {
        // Water Droplet (Plink sound)
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Fast pitch sweep up mimicking water splash
        const now = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
        
        // Quick volume envelope decay
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
      } 
      else if (type === 'meow') {
        // Synthesizer Meow (celebration milestone)
        const now = ctx.currentTime;
        
        // First tone (bend up)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(450, now);
        osc1.frequency.exponentialRampToValueAtTime(680, now + 0.2);
        
        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.linearRampToValueAtTime(0.08, now + 0.15);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc1.start(now);
        osc1.stop(now + 0.25);
        
        // Second tone following quickly (bend down meow tail)
        setTimeout(() => {
          const now2 = ctx.currentTime;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(680, now2);
          osc2.frequency.exponentialRampToValueAtTime(300, now2 + 0.25);
          
          gain2.gain.setValueAtTime(0.08, now2);
          gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.3);
          
          osc2.start(now2);
          osc2.stop(now2 + 0.3);
        }, 180);
      }
    } catch (e) {
      console.warn('Audio synthesis not supported or blocked:', e);
    }
  };

  // Add water helper
  const addWater = (amount) => {
    // Play splash droplet sound
    playSynthSound('droplet');
    
    // Set drinking animation state for cat
    setIsDrinking(true);
    setTriggerSplash(true);
    
    // Reset drinking state after 1.5 seconds
    setTimeout(() => setIsDrinking(false), 1500);

    setIntake((prev) => {
      const newAmount = prev + amount;
      saveIntakeToHistory(newAmount);
      
      // If we just hit or crossed the goal, trigger celebration sound!
      if (prev < goal && newAmount >= goal) {
        setTimeout(() => playSynthSound('meow'), 600);
      }
      
      return newAmount;
    });
  };

  const [activeModal, setActiveModal] = useState(null); // 'custom-amount' | 'reset-confirm'
  const [customVal, setCustomVal] = useState('350');

  const openResetModal = () => {
    setActiveModal('reset-confirm');
  };

  const confirmReset = () => {
    setIntake(0);
    saveIntakeToHistory(0);
    setActiveModal(null);
  };

  const openCustomModal = () => {
    setCustomVal('350');
    setActiveModal('custom-amount');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customVal && !isNaN(customVal)) {
      const vol = Math.abs(parseInt(customVal, 10));
      if (vol > 0) {
        addWater(vol);
      }
    }
    setActiveModal(null);
  };

  // Calculate percentage progress
  const hydrationPercent = goal > 0 ? (intake / goal) * 100 : 0;

  // --- Notification Scheduling ---

  // Reschedule when user changes the interval
  const handleSetInterval = (newInterval) => {
    setIntervalHours(newInterval);
    localStorage.setItem('aquacat_interval', newInterval);
    // Reset next reminder time to now + new interval (used for UI countdown display)
    if ('Notification' in window && Notification.permission === 'granted') {
      localStorage.setItem('aquacat_nextReminder', Date.now() + newInterval * 60 * 60 * 1000);
    }
  };

  // Persist settings changes
  const saveGoal = (newGoal) => {
    setGoal(newGoal);
    localStorage.setItem('aquacat_goal', newGoal);
  };

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {/* Header bar */}
      <h1 className="app-title">
        AquaCat <span style={{ fontSize: '20px' }}>💧🐾</span>
      </h1>
      <div className="subtitle">Drink water with Burger</div>

      {/* Main Tab Views */}
      {activeTab === 'today' && (
        <div className="view-container">
          {/* Cat Mascot reactive display */}
          <CatMascot percent={hydrationPercent} isDrinking={isDrinking} isSleeping={isSleeping} />

          {/* Liquid Glass cylinder display — wrapped in matching bento card */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', marginTop: '12px', height: '240px', display: 'flex', alignItems: 'stretch' }}>
            <WaterGlass percent={hydrationPercent} triggerSplash={triggerSplash} />
          </div>

          {/* Hydration Stats Box */}
          <div className="glass-panel" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Intake Total
                </span>
                <h3 style={{ fontSize: '24px', margin: '5px 0 0 0', fontFamily: 'Outfit', fontWeight: 800 }}>
                  {intake} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {goal} ml</span>
                </h3>
              </div>
              <button 
                onClick={openResetModal}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'rgba(255,159,28,0.7)', 
                  cursor: 'pointer', 
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Log Actions Panel */}
          <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '12px', textAlign: 'left' }}>
              Quick Log Water
            </label>
            <div className="log-actions">
              <button className="btn-log" onClick={() => addWater(250)}>
                <span>🥛</span>
                <span className="vol">250ml</span>
                <span className="desc">Glass</span>
              </button>
              <button className="btn-log" onClick={() => addWater(500)}>
                <span>🧴</span>
                <span className="vol">500ml</span>
                <span className="desc">Bottle</span>
              </button>
              <button className="btn-log" onClick={() => addWater(750)}>
                <span>🥤</span>
                <span className="vol">750ml</span>
                <span className="desc">Large</span>
              </button>
            </div>
            
            <button className="btn-secondary" onClick={openCustomModal}>
              + Add Custom Amount
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <HistoryChart history={history} goal={goal} />
      )}

      {activeTab === 'reminders' && (
        <NotificationSettings 
          interval={intervalHours} 
          setIntervalHours={handleSetInterval}
          dndHours={dndHours}
          setDndHours={setDndHours}
        />
      )}

      {/* Floating Web Application Navigation Bar */}
      <nav className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <svg viewBox="0 0 24 24" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Today
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg viewBox="0 0 24 24" strokeWidth="2">
            <path d="M3 3v18h18M18 9l-5 5-3-3-4 4" />
          </svg>
          History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          <svg viewBox="0 0 24 24" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Reminders
        </button>
      </nav>

      {/* Custom Glassmorphic Modal Dialog Overlay Portal */}
      {activeModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 20, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            animation: 'fade-in 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
        >
          {activeModal === 'reset-confirm' && (
            <div className="glass-panel glow-orange" style={{ maxWidth: '340px', marginBottom: 0 }}>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '20px', margin: '0 0 8px 0', color: 'var(--color-secondary)' }}>
                Reset Progress?
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '22px' }}>
                Are you sure you want to clear today's intake? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => setActiveModal(null)} style={{ margin: 0, flex: 1 }}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={confirmReset} style={{ flex: 1, background: 'linear-gradient(135deg, var(--color-secondary) 0%, #d47a00 100%)', color: '#070b19', boxShadow: '0 4px 15px rgba(255, 159, 28, 0.25)' }}>
                  Reset
                </button>
              </div>
            </div>
          )}

          {activeModal === 'custom-amount' && (
            <form onSubmit={handleCustomSubmit} className="glass-panel glow-primary" style={{ maxWidth: '340px', marginBottom: 0 }}>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '20px', margin: '0 0 8px 0', color: 'var(--color-primary)' }}>
                Log Custom Water
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '5px' }}>
                Enter the amount of water you drank:
              </p>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="number"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoFocus
                  required
                  value={customVal}
                  onChange={(e) => setCustomVal(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '26px',
                    fontFamily: 'Outfit',
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: '12px',
                    width: '100%',
                    margin: '15px 0',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                  }}
                />
                <span style={{ position: 'absolute', right: '20px', fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text-muted)', fontSize: '16px', pointerEvents: 'none' }}>
                  ml
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)} style={{ margin: 0, flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Log Intake
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
