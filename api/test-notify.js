import { cors, parseBody, loadSubs, getWebPush } from './_utils.js';

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
    // 3s server-side delay — gives user time to close the app before push fires
    await new Promise(r => setTimeout(r, 3000));

    const wp = getWebPush();
    await wp.sendNotification(
      record.subscription,
      JSON.stringify({
        title: 'Burger is Thirsty! 🐱💦',
        body: 'Background push works! Your reminders are all set. 🎉',
        icon: '/icons/icon-192.png',
        tag: 'water-reminder',
        data: { url: '/' },
      }),
      { TTL: 60, urgency: 'high' }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Test push failed:', err.statusCode, err.body);
    res.status(500).json({ error: err.message });
  }
}
