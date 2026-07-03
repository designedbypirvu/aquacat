import webpush from 'web-push';

// ─── VAPID ───────────────────────────────────────────────────────────────────
export function getWebPush() {
  webpush.setVapidDetails(
    'https://aquacat-zpqy.vercel.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  return webpush;
}

// ─── Upstash Redis (REST API, no SDK) ────────────────────────────────────────
const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const SUBS_KEY    = 'aquacat:subscriptions';

// POST flat command array to base URL — the correct Upstash single-command format
async function redisCmd(...args) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

export async function loadSubs() {
  const raw = await redisCmd('GET', SUBS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function saveSubs(subs) {
  await redisCmd('SET', SUBS_KEY, JSON.stringify(subs));
}

// ─── Push helper ─────────────────────────────────────────────────────────────
export async function sendPush(wp, record, payload = {}) {
  const notification = JSON.stringify({
    title: payload.title || 'Burger is Thirsty! 🐱',
    body:  payload.body  || 'Time for a fresh glass of water.',
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag:   'water-reminder',
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'drink', title: '💧 Log 250ml' },
      { action: 'close', title: 'Dismiss' },
    ],
    data: { url: '/' },
  });
  await wp.sendNotification(record.subscription, notification);
}

// ─── Body parser (Vercel doesn't auto-parse raw Node functions) ───────────────
export function parseBody(req) {
  return new Promise((resolve, reject) => {
    // If Vercel already parsed it (framework mode), use it directly
    if (req.body !== undefined) { resolve(req.body); return; }
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ─── CORS headers ─────────────────────────────────────────────────────────────
export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
