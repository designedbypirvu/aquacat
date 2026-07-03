import { cors, loadSubs, saveSubs } from './_utils.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { endpoint } = req.body;
  const subs = await loadSubs();
  await saveSubs(subs.filter(s => s.endpoint !== endpoint));
  res.json({ ok: true });
}
