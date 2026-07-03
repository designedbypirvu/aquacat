import React, { useState, useEffect } from 'react';

// In dev: http://localhost:3001  |  In production on Vercel: '' (relative /api/* paths)
const SERVER = import.meta.env.VITE_SERVER_URL ?? '';

// Convert base64 VAPID public key to Uint8Array for pushManager.subscribe()
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificationSettings({ interval, setIntervalHours, dndHours, setDndHours }) {
  const [permission, setPermission] = useState('default');
  const [pushSub, setPushSub] = useState(null);      // PushSubscription object
  const [serverOk, setServerOk] = useState(false);   // successfully registered with server
  const [testActive, setTestActive] = useState(false);
  const [testCountdown, setTestCountdown] = useState(0);
  const [nextNotifyAt, setNextNotifyAt] = useState(null); // real timestamp from server
  const [statusMsg, setStatusMsg] = useState('');

  // Fetch the real next notification time from the server
  const fetchNextNotifyAt = async (sub) => {
    try {
      const res = await fetch(`${SERVER}/api/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: (sub || pushSub)?.endpoint }),
      });
      if (res.ok) {
        const data = await res.json();
        setNextNotifyAt(data.nextNotifyAt);
      }
    } catch { /* silently ignore */ }
  };

  // On mount: read permission + check for existing push subscription
  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setPushSub(sub);
            setServerOk(true);
            fetchNextNotifyAt(sub);
          }
        });
      });

      // Listen for pushsubscriptionchange forwarded from SW
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
          registerWithServer(e.data.subscription, interval, dndHours);
        }
      });
    }
  }, []); // run once on mount only

  const [ticks, setTicks] = useState(0);

  // Live countdown ticker & automatic server refresh when overdue
  useEffect(() => {
    if (permission !== 'granted') return;
    
    const tick = () => {
      setTicks(t => t + 1);
      
      // If the next notification time has passed, re-fetch status from server
      if (nextNotifyAt && Date.now() >= nextNotifyAt) {
        fetchNextNotifyAt();
      }
    };

    tick();
    const id = setInterval(tick, 10000); // Tick every 10 seconds
    return () => clearInterval(id);
  }, [permission, nextNotifyAt]);

  // ── Step 1: request OS permission ──────────────────────────────────────────
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setStatusMsg('❌ Notifications not supported on this browser.');
      return;
    }
    setStatusMsg('Requesting permission…');
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      setStatusMsg('Permission granted! Connecting to push server…');
      await subscribeAndRegister();
    } else {
      setStatusMsg('❌ Permission denied. Enable notifications in your device settings.');
    }
  };

  // ── Step 2: create push subscription + register with server ────────────────
  const subscribeAndRegister = async () => {
    try {
      // Fetch VAPID public key from our server
      const keyRes = await fetch(`${SERVER}/api/vapid-public-key`);
      if (!keyRes.ok) throw new Error('Push server unreachable');
      const { publicKey } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      setPushSub(sub);
      await registerWithServer(sub, interval, dndHours);

      // Set next reminder timestamp for countdown display
      const intervalMs = interval * 60 * 60 * 1000;
      localStorage.setItem('aquacat_nextReminder', Date.now() + intervalMs);

      // Confirm via local notification
      reg.active?.postMessage({
        type: 'TRIGGER_NOTIFICATION',
        payload: {
          title: 'Notifications Active! 💧🐱',
          body: `AquaCat will remind you every ${interval}h — even when the app is closed!`,
        },
      });
    } catch (err) {
      console.error('Subscribe failed:', err);
      setStatusMsg(`⚠️ Could not connect to push server: ${err.message}`);
      setServerOk(false);
    }
  };

  const registerWithServer = async (sub, hours, dnd = dndHours) => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const res = await fetch(`${SERVER}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          intervalHours: hours,
          dndHours: dnd,
          timezone,
        }),
      });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const j = await res.json(); detail = j.error || JSON.stringify(j); } catch {}
        throw new Error(detail);
      }
      setServerOk(true);
      setStatusMsg('✅ Connected to push server!');
      setTimeout(() => setStatusMsg(''), 3000);
      fetchNextNotifyAt(sub);
    } catch (err) {
      console.error('Server registration failed:', err);
      setStatusMsg(`⚠️ Push server error: ${err.message}`);
      setServerOk(false);
    }
  };

  // ── Interval change ─────────────────────────────────────────────────────────
  const handleIntervalChange = async (hours) => {
    setIntervalHours(hours);

    if (pushSub && serverOk) {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        await fetch(`${SERVER}/api/update-interval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: pushSub.endpoint,
            intervalHours: hours,
            dndHours,
            timezone,
          }),
        });
        // Fetch AFTER the server write completes — avoids reading stale nextNotifyAt
        await fetchNextNotifyAt();
      } catch (e) {
        console.warn('Could not update interval on server:', e);
      }
    }
  };

  // ── DND Change ──────────────────────────────────────────────────────────────
  const handleDndChange = async (hours) => {
    setDndHours(hours);
    localStorage.setItem('aquacat_dndHours', hours);

    if (pushSub && serverOk) {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        await fetch(`${SERVER}/api/update-interval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: pushSub.endpoint,
            intervalHours: interval,
            dndHours: hours,
            timezone,
          }),
        });
        // Fetch AFTER the server write completes — avoids reading stale nextNotifyAt
        await fetchNextNotifyAt();
      } catch (e) {
        console.warn('Could not update DND hours on server:', e);
      }
    }
  };

  // ── Test notification ───────────────────────────────────────────────────────
  const triggerTest = async () => {
    if (permission !== 'granted' || testActive) return;
    setTestActive(true);
    setStatusMsg('📤 Sending push… swipe the app away NOW!');
    await fireTestNotification();
    setTestActive(false);
  };

  const fireTestNotification = async () => {
    // Try server push first (tests true background delivery)
    if (pushSub && serverOk) {
      try {
        const res = await fetch(`${SERVER}/api/test-notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: pushSub.endpoint }),
        });
        if (res.ok) {
          setStatusMsg('📤 Push sent! Close/swipe the app and lock your screen.');
          setTimeout(() => setStatusMsg(''), 5000);
          return;
        }
        // Server returned an error — surface it
        let errText = `Server error ${res.status}`;
        try { const j = await res.json(); errText = j.error || errText; } catch {}
        setStatusMsg(`⚠️ Push failed: ${errText} — falling back to local`);
      } catch (e) {
        setStatusMsg(`⚠️ Network error: ${e.message} — falling back to local`);
      }
    }
    // Fallback: client-side via SW message (fires while app is open)
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_NOTIFICATION',
        payload: {
          title: 'Burger is Thirsty! 🐱💦',
          body: 'Test notification — it worked! 🎉',
        },
      });
    }
  };

  const formatNextTime = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatCountdown = (ts) => {
    if (!ts) return '';
    const secs = Math.max(0, Math.round((ts - Date.now()) / 1000));
    if (secs < 60) return `in ${secs}s`;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  };

  return (
    <div className="view-container">

      {/* ── Permission & Push Panel ── */}
      <div className="glass-panel">
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '20px', margin: '0 0 8px 0' }}>
          System Reminders
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
          Receive lock screen notifications to drink water — even when the app is fully closed.
        </p>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
          <span className={`status-badge ${permission}`}>
            {permission === 'granted' ? '● Notifications On' : permission === 'denied' ? '✕ Blocked' : '○ Not Set Up'}
          </span>
          {permission === 'granted' && (
            <span className={`status-badge ${serverOk ? 'granted' : 'default'}`}
              style={{ borderColor: serverOk ? 'rgba(0,245,212,0.3)' : 'rgba(255,159,28,0.3)',
                       color: serverOk ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
              {serverOk ? '🌐 Push Server Active' : '📵 Local Only'}
            </span>
          )}
        </div>

        {statusMsg && (
          <p style={{ fontSize: '12px', color: 'var(--color-secondary)', textAlign: 'center', marginBottom: '14px' }}>
            {statusMsg}
          </p>
        )}

        {permission !== 'granted' ? (
          <button className="btn-primary" onClick={requestPermission}>
            Enable Notifications
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Next notification time */}
            <div style={{
              background: 'rgba(0,245,212,0.06)', border: '1px solid rgba(0,245,212,0.18)',
              borderRadius: '16px', padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  🔔 Next Notification
                </span>
                <span style={{ fontSize: '15px', fontFamily: 'Outfit', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {formatNextTime(nextNotifyAt)}
                </span>
              </div>
              {nextNotifyAt && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                  {formatCountdown(nextNotifyAt)}
                </div>
              )}
            </div>

            {/* Interval picker */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
                Reminder Every
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[1, 2, 3].map((h) => (
                  <button key={h} onClick={() => handleIntervalChange(h)} style={{
                    background: interval === h ? 'rgba(0,245,212,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${interval === h ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px', color: interval === h ? 'var(--color-primary)' : '#fff',
                    padding: '10px 0', fontWeight: 700, cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s ease',
                  }}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Quiet Hours picker */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
                Quiet Hours (from 11 PM)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                {[0, 6, 8, 10].map((h) => (
                  <button key={h} onClick={() => handleDndChange(h)} style={{
                    background: dndHours === h ? 'rgba(0,245,212,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${dndHours === h ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px', color: dndHours === h ? 'var(--color-primary)' : '#fff',
                    padding: '10px 0', fontWeight: 700, cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s ease',
                  }}>
                    {h === 0 ? 'Off' : `${h}h`}
                  </button>
                ))}
              </div>
            </div>

            {/* Test button */}
            <button className="btn-secondary" onClick={triggerTest} disabled={testActive}
              style={{ borderColor: testActive ? 'rgba(255,159,28,0.3)' : '', color: testActive ? 'var(--color-secondary)' : '#fff' }}>
              {testActive
                ? '📤 Sending… swipe away NOW!'
                : serverOk ? '🌐 Test Push (background)' : '📳 Test Local Notification'}
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-6px' }}>
              {serverOk
                ? 'The server will push a real notification — close the app and lock your screen first!'
                : 'Connect to push server for true background notifications.'}
            </p>
          </div>
        )}
      </div>

      {/* ── iOS Setup Guide ── */}
      <div className="glass-panel" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '18px', margin: '0 0 14px 0', color: 'var(--color-secondary)' }}>
          iPhone Setup Guide
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
          iOS requires the app to be installed as a PWA for lock screen notifications:
        </p>
        {[
          { n: 1, text: <span>Open this app in <strong>Safari</strong> on your iPhone.</span> },
          { n: 2, text: <span>Tap the <strong>Share</strong> button (square + arrow up) in the toolbar.</span> },
          { n: 3, text: <span>Tap <strong>"Add to Home Screen"</strong> and confirm.</span> },
          { n: 4, text: <span>Open <strong>AquaCat</strong> from your Home Screen, go to <strong>Reminders</strong>, and tap <strong>Enable Notifications</strong>.</span> },
        ].map(({ n, text }) => (
          <div key={n} className="instruction-step">
            <div className="step-number">{n}</div>
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>{text}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
