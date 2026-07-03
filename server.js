import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import webpush from 'web-push';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Storage paths ───────────────────────────────────────────────────────────
const ENV_PATH = path.join(__dirname, '.env');
const SUBS_PATH = path.join(__dirname, 'subscriptions.json');

// ─── VAPID key bootstrap ──────────────────────────────────────────────────────
function ensureVapidKeys() {
  // Read existing .env (if any)
  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf8');
  }

  const hasPublic = envContent.includes('VAPID_PUBLIC_KEY=');
  const hasPrivate = envContent.includes('VAPID_PRIVATE_KEY=');

  if (!hasPublic || !hasPrivate) {
    console.log('🔑 Generating new VAPID keypair...');
    const { publicKey, privateKey } = webpush.generateVAPIDKeys();

    // Strip old keys if they exist (re-generate case)
    envContent = envContent
      .split('\n')
      .filter(l => !l.startsWith('VAPID_PUBLIC_KEY=') && !l.startsWith('VAPID_PRIVATE_KEY='))
      .join('\n');

    envContent += `\nVAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\n`;
    fs.writeFileSync(ENV_PATH, envContent.trim() + '\n', 'utf8');
    console.log('✅ VAPID keys saved to .env');

    // Make them available immediately in this process
    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
  }
}

ensureVapidKeys();

webpush.setVapidDetails(
  'mailto:aquacat@localhost',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ─── Subscription store ───────────────────────────────────────────────────────
function loadSubs() {
  if (!fs.existsSync(SUBS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(SUBS_PATH, 'utf8')); }
  catch { return []; }
}

function saveSubs(subs) {
  fs.writeFileSync(SUBS_PATH, JSON.stringify(subs, null, 2), 'utf8');
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public key — frontend uses this to call pushManager.subscribe()
app.get('/api/vapid-public-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe — receive a PushSubscription object + interval from frontend
app.post('/api/subscribe', (req, res) => {
  const { subscription, intervalHours = 2 } = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Missing subscription' });
  }

  const subs = loadSubs();
  const existing = subs.findIndex(s => s.endpoint === subscription.endpoint);

  const intervalMs = intervalHours * 60 * 60 * 1000;
  const record = {
    endpoint: subscription.endpoint,
    subscription,
    intervalHours,
    nextNotifyAt: Date.now() + intervalMs,
  };

  if (existing !== -1) {
    subs[existing] = record;
  } else {
    subs.push(record);
  }

  saveSubs(subs);
  console.log(`📲 Subscription saved (interval: ${intervalHours}h)`);
  res.json({ ok: true });
});

// Update interval for an existing subscription
app.post('/api/update-interval', (req, res) => {
  const { endpoint, intervalHours } = req.body;
  if (!endpoint || !intervalHours) {
    return res.status(400).json({ error: 'Missing endpoint or intervalHours' });
  }

  const subs = loadSubs();
  const idx = subs.findIndex(s => s.endpoint === endpoint);
  if (idx === -1) return res.status(404).json({ error: 'Subscription not found' });

  const intervalMs = intervalHours * 60 * 60 * 1000;
  subs[idx].intervalHours = intervalHours;
  subs[idx].nextNotifyAt = Date.now() + intervalMs;
  saveSubs(subs);

  console.log(`⏱  Interval updated to ${intervalHours}h`);
  res.json({ ok: true });
});

// Unsubscribe
app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  let subs = loadSubs();
  subs = subs.filter(s => s.endpoint !== endpoint);
  saveSubs(subs);
  console.log('🗑  Subscription removed');
  res.json({ ok: true });
});

// Send a test notification immediately (for the 5-second test button)
app.post('/api/test-notify', async (req, res) => {
  const { endpoint } = req.body;
  const subs = loadSubs();
  const record = subs.find(s => s.endpoint === endpoint);
  if (!record) return res.status(404).json({ error: 'Subscription not found' });

  try {
    await sendPush(record, {
      title: 'Burger is Thirsty! 🐱💦',
      body: 'This is your test notification. It works even when the app is closed! 🎉',
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Test push failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Push helper ─────────────────────────────────────────────────────────────
async function sendPush(record, payload) {
  const notification = JSON.stringify({
    title: payload.title || 'Burger is Thirsty! 🐱💦',
    body: payload.body || 'Time for a fresh glass of water. Your orange buddy is counting on you!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'water-reminder',
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'drink', title: '💧 Log 250ml' },
      { action: 'close', title: 'Dismiss' },
    ],
    data: { url: '/' },
  });

  await webpush.sendNotification(record.subscription, notification);
}

// ─── Cron scheduler — checks every minute ────────────────────────────────────
cron.schedule('* * * * *', async () => {
  const subs = loadSubs();
  const now = Date.now();
  let changed = false;

  for (const record of subs) {
    if (now >= record.nextNotifyAt) {
      try {
        await sendPush(record, {});
        console.log(`🔔 Push sent to endpoint ...${record.endpoint.slice(-20)}`);
      } catch (err) {
        console.error('Push failed:', err.statusCode, err.body);
        // 410 Gone = subscription is no longer valid, remove it
        if (err.statusCode === 410) {
          record._expired = true;
        }
      }
      // Schedule next reminder
      const intervalMs = (record.intervalHours || 2) * 60 * 60 * 1000;
      record.nextNotifyAt = now + intervalMs;
      changed = true;
    }
  }

  if (changed) {
    saveSubs(subs.filter(s => !s._expired));
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AquaCat push server running on http://localhost:${PORT}`);
  console.log(`📢 VAPID public key: ${process.env.VAPID_PUBLIC_KEY?.slice(0, 20)}...`);
  console.log(`📋 Subscriptions file: ${SUBS_PATH}\n`);
});
