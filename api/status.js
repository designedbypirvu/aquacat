import { cors, parseBody, loadSubs } from './_utils.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const body = await parseBody(req);
  const { endpoint } = body;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

  const subs = await loadSubs();
  const record = subs.find(s => s.endpoint === endpoint);
  if (!record) return res.status(404).json({ error: 'Not found' });

  res.json({
    ok: true,
    nextNotifyAt: record.nextNotifyAt,
    intervalHours: record.intervalHours,
  });
}
