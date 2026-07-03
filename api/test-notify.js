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

  // Log the subscription shape for debugging
  const sub = record.subscription;
  const subDebug = {
    endpoint_prefix: (sub.endpoint || '').slice(0, 50),
    has_p256dh: !!sub.keys?.p256dh,
    has_auth: !!sub.keys?.auth,
    p256dh_len: (sub.keys?.p256dh || '').length,
    auth_len: (sub.keys?.auth || '').length,
  };

  try {
    // Wait 3s server-side so the user can swipe the app away before the push fires
    await new Promise(r => setTimeout(r, 3000));

    const wp = getWebPush();
    const pushResult = await wp.sendNotification(
      sub,
      JSON.stringify({
        title: 'Burger is Thirsty! 🐱💦',
        body: 'Background push works! Close the app next time 🎉',
        icon: '/icons/icon-192.png',
        tag: 'water-reminder',
        data: { url: '/' },
      }),
      { TTL: 60 } // 60 second TTL
    );
    res.json({
      ok: true,
      statusCode: pushResult?.statusCode,
      sub: subDebug,
    });
  } catch (err) {
    console.error('Test push failed:', err);
    res.status(500).json({
      error: err.message,
      statusCode: err.statusCode,
      body: err.body,
      sub: subDebug,
    });
  }
}
