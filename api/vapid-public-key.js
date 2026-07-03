import { cors } from './_utils.js';

export default function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}
