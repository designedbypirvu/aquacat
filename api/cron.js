import { loadSubs, saveSubs, getWebPush, sendPush, getLocalHour, isInQuietHours } from './_utils.js';

// Called by GitHub Actions cron every hour (GET) or manually (POST)
export default async function handler(req, res) {
  // Protect cron endpoint (support both custom auth header and Vercel's native cron trigger)
  const authHeader = req.headers['authorization'];
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}` || isVercelCron;

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  const subs   = await loadSubs();
  const now    = Date.now();
  const wp     = getWebPush();
  let   sent   = 0;
  let   failed = 0;

  for (const record of subs) {
    if (now < record.nextNotifyAt) continue; // not yet

    // Skip notification if we are in quiet hours (DND)
    const localHour = getLocalHour(record.timezone, new Date(now));
    if (isInQuietHours(localHour, record.dndHours)) {
      let nextTime = record.nextNotifyAt || now;
      const stepMs = record.intervalHours * 60 * 60 * 1000;
      while (nextTime <= now) {
        nextTime += stepMs;
      }
      record.nextNotifyAt = nextTime;
      continue;
    }

    try {
      await sendPush(wp, record);
      sent++;
      console.log(`🔔 Push sent → ...${record.endpoint.slice(-20)}`);
    } catch (err) {
      console.error('Push failed:', err.statusCode, err.body);
      if (err.statusCode === 410 || err.statusCode === 404) {
        record._expired = true; // subscription gone, remove it
      }
      failed++;
    }

    // Advance the next notification time regardless of success
    let nextTime = record.nextNotifyAt || now;
    const stepMs = record.intervalHours * 60 * 60 * 1000;
    while (nextTime <= now) {
      nextTime += stepMs;
    }
    record.nextNotifyAt = nextTime;
  }

  await saveSubs(subs.filter(s => !s._expired));
  console.log(`Cron done — sent: ${sent}, failed: ${failed}, total: ${subs.length}`);
  res.json({ ok: true, sent, failed });
}
