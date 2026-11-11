// Quote log for the Sundown quote desk. Each quote is one private JSON file in Vercel Blob.
// GET lists quotes, POST saves a quote or updates its status. Same login as the desk.
import { put, list, get } from '@vercel/blob';
import { who, deny } from './_auth.js';

const STATUSES = ['Quoted', 'Sent', 'Won', 'Deposit paid', 'Paid', 'Lost'];
const REF = /^SD\d{6}-\d{3,4}$/;
const json = (body, status) => new Response(JSON.stringify(body), {
  status: status || 200,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' }
});

async function readQuote(pathname, fresh) {
  const r = await get(pathname, { access: 'private', useCache: !fresh });
  if (!r || r.statusCode !== 200) return null;
  return await new Response(r.stream).json();
}

const WON = ['Won', 'Deposit paid', 'Paid'];
const CHECKS = ['lodgeConfirmed', 'briefSent', 'guideSent', 'reviewAsked'];
function forRole(q, u) {
  if (u.role === 'owner') return q;
  const { totCost, profit, commission, streams, pay, paidOut, ...rest } = q;
  return rest;
}
const save = (path, rec) => put(path, JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
function money(n) { n = Math.round(Number(n) || 0); return n > 0 && n < 1e9 ? n : 0; }
function stamp(rec, now) { if (WON.includes(rec.status) && !rec.wonAt) rec.wonAt = now; }

async function handler(request) {
  const u = await who(request);
  if (!u) return deny();

  if (request.method === 'GET') {
    let blobs = [], cursor;
    do {
      const page = await list({ prefix: 'quotes/', limit: 1000, cursor });
      blobs = blobs.concat(page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor && blobs.length < 3000);
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const quotes = (await Promise.all(blobs.slice(0, 300).map(b => readQuote(b.pathname).catch(() => null)))).filter(Boolean);
    const mine = u.role === 'owner' ? quotes : quotes.filter(q => q.user === u.user);
    mine.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return json({ user: u.user, role: u.role, quotes: mine.map(q => forRole(q, u)) });
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'Bad request' }, 400); }
    if (body.action === 'save') {
      const q = body.quote || {};
      if (!REF.test(q.ref || '')) return json({ error: 'Bad reference' }, 400);
      const path = 'quotes/' + q.ref + '.json';
      const old = await readQuote(path, true).catch(() => null);
      const now = new Date().toISOString();
      const addPayment = q.addPayment; delete q.addPayment; delete q.paid; delete q.payments; delete q.ops; delete q.paidOut;
      const rec = Object.assign({}, old || {}, q, {
        user: old ? old.user : u.user,
        createdAt: old ? old.createdAt : now,
        updatedAt: now,
        status: STATUSES.includes(q.status) ? q.status : (old ? old.status : 'Quoted'),
        history: (old && old.history || []).concat([{ at: now, by: u.user, status: STATUSES.includes(q.status) ? q.status : 'Quoted', note: q.doc || 'saved' }])
      });
      if (addPayment && money(addPayment.amt)) {
        rec.payments = (rec.payments || []).concat([{ amt: money(addPayment.amt), date: String(addPayment.date || now).slice(0, 10), method: String(addPayment.method || '').slice(0, 40), ref: String(addPayment.ref || '').slice(0, 60), by: u.user }]);
        rec.paid = rec.payments.reduce((a, p) => a + p.amt, 0);
      }
      stamp(rec, now);
      await save(path, rec);
      return json({ ok: true, quote: forRole(rec, u) });
    }
    if (['ops', 'payment', 'payout'].includes(body.action)) {
      if (!REF.test(body.ref || '')) return json({ error: 'Bad request' }, 400);
      const path = 'quotes/' + body.ref + '.json';
      const rec = await readQuote(path, true).catch(() => null);
      if (!rec) return json({ error: 'Not found' }, 404);
      if (u.role !== 'owner' && (rec.user !== u.user || body.action === 'payout')) return json({ error: 'Not allowed' }, 403);
      const now = new Date().toISOString();
      if (body.action === 'ops') {
        rec.ops = rec.ops || {};
        CHECKS.forEach(k => { if (k in (body.ops || {})) rec.ops[k] = body.ops[k] ? now : null; });
        if (typeof (body.ops || {}).notes === 'string') rec.ops.notes = body.ops.notes.slice(0, 2000);
      }
      if (body.action === 'payment') {
        const p = body.payment || {};
        if (!money(p.amt)) return json({ error: 'Bad amount' }, 400);
        rec.payments = (rec.payments || []).concat([{ amt: money(p.amt), date: String(p.date || now).slice(0, 10), method: String(p.method || '').slice(0, 40), ref: String(p.ref || '').slice(0, 60), by: u.user }]);
        rec.paid = rec.payments.reduce((a, x) => a + x.amt, 0);
        if (rec.paid >= (rec.totPrice || 0)) rec.status = 'Paid'; else if (!WON.includes(rec.status) || rec.status === 'Won') rec.status = 'Deposit paid';
        rec.history = (rec.history || []).concat([{ at: now, by: u.user, status: rec.status, note: 'payment ' + money(p.amt) }]);
      }
      if (body.action === 'payout') {
        rec.paidOut = rec.paidOut || {};
        rec.paidOut[String(body.key || '').slice(0, 80)] = body.paid ? now : null;
      }
      rec.updatedAt = now;
      stamp(rec, now);
      await save(path, rec);
      return json({ ok: true, quote: forRole(rec, u) });
    }
    if (body.action === 'status') {
      if (!REF.test(body.ref || '') || !STATUSES.includes(body.status)) return json({ error: 'Bad request' }, 400);
      const path = 'quotes/' + body.ref + '.json';
      const rec = await readQuote(path, true).catch(() => null);
      if (!rec) return json({ error: 'Not found' }, 404);
      if (u.role !== 'owner' && rec.user !== u.user) return json({ error: 'Not yours' }, 403);
      const now = new Date().toISOString();
      rec.status = body.status;
      rec.updatedAt = now;
      rec.history = (rec.history || []).concat([{ at: now, by: u.user, status: body.status }]);
      stamp(rec, now);
      await save(path, rec);
      return json({ ok: true, quote: forRole(rec, u) });
    }
    return json({ error: 'Unknown action' }, 400);
  }
  return json({ error: 'Method not allowed' }, 405);
}

// Web standard handlers for the Node runtime
export const GET = handler;
export const POST = handler;
