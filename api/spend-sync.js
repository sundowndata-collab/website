// Receives ad spend from outside tools (the Google Ads script, later a Meta pull) and saves it
// as the month's spend for that channel, in KES. Protected by a shared key in SPEND_SYNC_KEY.
import { put, list, del, get } from '@vercel/blob';

const CHANNELS = { 'Google ads': 'ggle', 'Meta ads': 'meta' };
const FX = ['https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', 'https://latest.currency-api.pages.dev/v1/currencies/usd.json'];
const json = (body, status) => new Response(JSON.stringify(body), { status: status || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
function same(a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }

async function toKes(amount, currency) {
  currency = String(currency || 'KES').toLowerCase();
  if (currency === 'kes') return amount;
  for (const url of FX) {
    try { const r = await fetch(url); if (!r.ok) continue; const d = await r.json(); const kes = d.usd && d.usd.kes, cur = currency === 'usd' ? 1 : d.usd && d.usd[currency]; if (kes && cur) return amount / cur * kes; } catch (e) {}
  }
  throw new Error('No exchange rate for ' + currency);
}

async function handler(request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const key = process.env.SPEND_SYNC_KEY || '';
  if (!key || !same(request.headers.get('x-sync-key') || '', key)) return json({ error: 'Not allowed' }, 401);
  let b; try { b = await request.json(); } catch (e) { return json({ error: 'Bad request' }, 400); }
  const code = CHANNELS[b.channel], month = String(b.month || ''), amt = Number(b.amount);
  if (!code || !/^\d{4}-\d{2}$/.test(month) || !(amt >= 0) || amt > 1e9) return json({ error: 'Need channel, month YYYY-MM and amount' }, 400);
  let kes;
  try { kes = Math.round(await toKes(amt, b.currency)); } catch (e) { return json({ error: e.message }, 502); }
  const id = 'M' + month.replace('-', '') + '01-' + code, now = new Date().toISOString();
  // one figure per channel per month: remove any typed entry for the same month and channel
  const page = await list({ prefix: 'spend/', limit: 1000 });
  await Promise.all(page.blobs.filter(x => x.pathname !== 'spend/' + id + '.json').map(async x => {
    try { const r = await get(x.pathname, { access: 'private', useCache: false }); const d = await new Response(r.stream).json(); if (d.month === month && d.channel === b.channel) await del(x.pathname); } catch (e) {}
  }));
  const rec = { id, month, channel: b.channel, amount: kes, auto: true, source: String(b.account || '').slice(0, 40), original: { amount: Math.round(amt * 100) / 100, currency: String(b.currency || 'KES').toUpperCase().slice(0, 3) }, syncedAt: now, updatedAt: now, createdAt: now, by: 'sync' };
  if (!kes) return json({ ok: true, skipped: 'zero spend', month });
  await put('spend/' + id + '.json', JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
  return json({ ok: true, month, channel: b.channel, kes });
}
export const POST = handler;
export const GET = () => json({ ok: true, hint: 'POST spend here with the x-sync-key header' });
