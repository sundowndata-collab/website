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

function forRole(q, u) {
  if (u.role === 'owner') return q;
  const { totCost, profit, commission, streams, ...rest } = q;
  return rest;
}

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
      const rec = Object.assign({}, old || {}, q, {
        user: old ? old.user : u.user,
        createdAt: old ? old.createdAt : now,
        updatedAt: now,
        status: STATUSES.includes(q.status) ? q.status : (old ? old.status : 'Quoted'),
        history: (old && old.history || []).concat([{ at: now, by: u.user, status: STATUSES.includes(q.status) ? q.status : 'Quoted', note: q.doc || 'saved' }])
      });
      await put(path, JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
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
      await put(path, JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
      return json({ ok: true, quote: forRole(rec, u) });
    }
    return json({ error: 'Unknown action' }, 400);
  }
  return json({ error: 'Method not allowed' }, 405);
}

// Web standard handlers for the Node runtime
export const GET = handler;
export const POST = handler;
