import { cors, loadSubs } from './_utils.js';

// Diagnostic endpoint — checks env vars + Redis connectivity
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const checks = {
    vapid_public: !!process.env.VAPID_PUBLIC_KEY,
    vapid_private: !!process.env.VAPID_PRIVATE_KEY,
    redis_url: !!process.env.UPSTASH_REDIS_REST_URL,
    redis_token: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    cron_secret: !!process.env.CRON_SECRET,
  };

  let redis_ok = false;
  let redis_error = null;
  let sub_count = 0;

  try {
    const subs = await loadSubs();
    redis_ok = true;
    sub_count = subs.length;
  } catch (err) {
    redis_error = err.message;
  }

  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  res.json({
    ok: redis_ok,
    checks,
    redis_error,
    sub_count,
    token_prefix: token.slice(0, 12) + '…', // first 12 chars to verify correct token
    url_prefix: (process.env.UPSTASH_REDIS_REST_URL || '').slice(0, 30) + '…',
  });
}
