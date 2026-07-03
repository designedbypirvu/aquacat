import { cors, parseBody, loadSubs, getWebPush, sendPush } from './_utils.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const body = await parseBody(req);
  const { endpoint } = body;
  const subs   = await loadSubs();
  const record  = subs.find(s => s.endpoint === endpoint);
  if (!record) return res.status(404).json({ error: 'Subscription not found' });

  try {
    const wp = getWebPush();
    await sendPush(wp, record, {
      title: 'Burger is Thirsty! 🐱💦',
      body:  'This is your test notification — it works even when the app is closed! 🎉',
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Test push failed:', err);
    res.status(500).json({ error: err.message });
  }
}
