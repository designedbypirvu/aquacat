import { cors, parseBody, loadSubs, saveSubs } from './_utils.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const body = await parseBody(req);
  const { endpoint, intervalHours, dndHours, timezone } = body;
  if (!endpoint || intervalHours === undefined) return res.status(400).json({ error: 'Missing params' });

  const subs = await loadSubs();
  const idx  = subs.findIndex(s => s.endpoint === endpoint);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const intervalMs = Number(intervalHours) * 60 * 60 * 1000;
  subs[idx].intervalHours = Number(intervalHours);
  subs[idx].nextNotifyAt  = Date.now() + intervalMs;
  
  if (dndHours !== undefined) subs[idx].dndHours = Number(dndHours);
  if (timezone !== undefined) subs[idx].timezone = timezone;

  await saveSubs(subs);
  res.json({ ok: true });
}
