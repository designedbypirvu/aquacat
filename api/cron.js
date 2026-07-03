import { loadSubs, saveSubs, getWebPush, sendPush } from './_utils.js';

// Called by Vercel Cron every hour (see vercel.json)
export default async function handler(req, res) {
  // Protect cron endpoint — Vercel sets this header automatically
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const subs   = await loadSubs();
  const now    = Date.now();
  const wp     = getWebPush();
  let   sent   = 0;
  let   failed = 0;

  for (const record of subs) {
    if (now < record.nextNotifyAt) continue; // not yet

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
    record.nextNotifyAt = now + record.intervalHours * 60 * 60 * 1000;
  }

  await saveSubs(subs.filter(s => !s._expired));
  console.log(`Cron done — sent: ${sent}, failed: ${failed}, total: ${subs.length}`);
  res.json({ ok: true, sent, failed });
}
