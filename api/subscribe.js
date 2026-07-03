import { cors, parseBody, loadSubs, saveSubs } from './_utils.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = await parseBody(req);
    const { subscription, intervalHours = 2, dndHours = 0, timezone = 'UTC' } = body;

    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'Missing subscription or endpoint' });
    }

    const subs = await loadSubs();
    const idx  = subs.findIndex(s => s.endpoint === subscription.endpoint);
    const intervalMs = Number(intervalHours) * 60 * 60 * 1000;

    const record = {
      endpoint: subscription.endpoint,
      subscription,
      intervalHours: Number(intervalHours),
      nextNotifyAt: Date.now() + intervalMs,
      dndHours: Number(dndHours),
      timezone: timezone,
    };

    if (idx !== -1) subs[idx] = record;
    else subs.push(record);

    await saveSubs(subs);
    res.json({ ok: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: err.message });
  }
}
