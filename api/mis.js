// Leads for the Sundown management system. Each lead is one private JSON file in Vercel Blob.
// GET lists leads, POST saves one. Everyone on the team sees every lead, so nobody misses one.
import { put, list, get } from '@vercel/blob';
import { who, deny } from './_auth.js';

const STATUSES = ['New', 'Contacted', 'Quoted', 'Booked', 'Lost'];
const SOURCES = ['Meta ads', 'Google ads', 'Website', 'Instagram', 'TikTok', 'Referral', 'Repeat client', 'Walk in', 'Other'];
const ID = /^L\d{8}-[a-z0-9]{4}$/;
const json = (body, status) => new Response(JSON.stringify(body), {
  status: status || 200,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' }
});
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
const int = (v, max) => { const n = parseInt(v, 10); return n > 0 && n <= max ? n : 0; };

async function readLead(pathname, fresh) {
  const r = await get(pathname, { access: 'private', useCache: !fresh });
  if (!r || r.statusCode !== 200) return null;
  return await new Response(r.stream).json();
}

function newId() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return 'L' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + Math.random().toString(36).slice(2, 6).padEnd(4, '0');
}

async function handler(request) {
  const u = await who(request);
  if (!u) return deny();
  if (request.method === 'GET') {
    let blobs = [], cursor;
    do {
      const page = await list({ prefix: 'leads/', limit: 1000, cursor });
      blobs = blobs.concat(page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor && blobs.length < 3000);
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const leads = (await Promise.all(blobs.slice(0, 500).map(b => readLead(b.pathname).catch(() => null)))).filter(Boolean);
    leads.sort((a, b) => (b.inAt || '').localeCompare(a.inAt || ''));
    return json({ leads });
  }
  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'Bad request' }, 400); }
    if (body.action !== 'save') return json({ error: 'Unknown action' }, 400);
    const l = body.lead || {};
    const id = l.id && ID.test(l.id) ? l.id : newId();
    const path = 'leads/' + id + '.json';
    const old = l.id ? await readLead(path, true).catch(() => null) : null;
    const now = new Date().toISOString();
    const rec = Object.assign({}, old || {}, { id });
    const fields = { name: 80, phone: 40, notes: 1000, residency: 20, date: 10, quoteRef: 20 };
    Object.keys(fields).forEach(k => { if (k in l) rec[k] = str(l[k], fields[k]); });
    if ('source' in l) rec.source = SOURCES.includes(l.source) ? l.source : 'Other';
    if ('nights' in l) rec.nights = int(l.nights, 60);
    if ('group' in l) rec.group = int(l.group, 500);
    if (!old) { rec.inAt = l.inAt && !isNaN(Date.parse(l.inAt)) ? new Date(l.inAt).toISOString() : now; rec.createdAt = now; rec.by = u.user; rec.status = 'New'; }
    if (l.status && STATUSES.includes(l.status)) rec.status = l.status;
    if (rec.status !== 'New' && !rec.repliedAt) rec.repliedAt = l.repliedAt && !isNaN(Date.parse(l.repliedAt)) ? new Date(l.repliedAt).toISOString() : now;
    rec.updatedAt = now;
    if (!rec.name && !rec.phone) return json({ error: 'Add a name or a phone number' }, 400);
    await put(path, JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
    return json({ ok: true, lead: rec });
  }
  return json({ error: 'Method not allowed' }, 405);
}

export const GET = handler;
export const POST = handler;
