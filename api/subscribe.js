import { cors, loadSubs, saveSubs } from './_utils.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { subscription, intervalHours = 2 } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Missing subscription' });

  const subs = await loadSubs();
  const idx  = subs.findIndex(s => s.endpoint === subscription.endpoint);
  const intervalMs = Number(intervalHours) * 60 * 60 * 1000;

  const record = {
    endpoint: subscription.endpoint,
    subscription,
    intervalHours: Number(intervalHours),
    nextNotifyAt: Date.now() + intervalMs,
  };

  if (idx !== -1) subs[idx] = record;
  else subs.push(record);

  await saveSubs(subs);
  console.log(`📲 Subscription saved (interval: ${intervalHours}h)`);
  res.json({ ok: true });
}
