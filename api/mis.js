// Sundown management system store: leads, suppliers and ad spend, one private JSON file each in Vercel Blob.
// GET lists everything the user may see. POST {action:'save'|'delete', kind, item}.
// Leads: the whole team sees and edits them. Suppliers: everyone sees, only the owner edits. Spend: owner only.
import { put, list, get, del } from '@vercel/blob';
import { who, deny } from './_auth.js';

const LEAD_STATUSES = ['New', 'Contacted', 'Quoted', 'Booked', 'Lost'];
const SOURCES = ['Meta ads', 'Google ads', 'Website', 'Instagram', 'TikTok', 'Referral', 'Repeat client', 'Walk in', 'Other'];
const SUP_STATUSES = ['To contact', 'Rates requested', 'Rates received', 'Contract to sign', 'Agreement needed', 'Signed', 'Declined'];
const SUP_TYPES = ['Lodge or camp', 'Ground partner', 'Transport', 'Activity', 'Other'];
const CHANNELS = ['Meta ads', 'Google ads', 'TikTok', 'Influencer', 'Other'];
const KINDS = { lead: { dir: 'leads/', p: 'L' }, supplier: { dir: 'suppliers/', p: 'S' }, spend: { dir: 'spend/', p: 'M' } };
const json = (body, status) => new Response(JSON.stringify(body), {
  status: status || 200,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' }
});
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
const int = (v, max) => { const n = parseInt(v, 10); return n > 0 && n <= max ? n : 0; };
const day = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '';
const saveBlob = (path, rec) => put(path, JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });

async function readOne(pathname, fresh) {
  const r = await get(pathname, { access: 'private', useCache: !fresh });
  if (!r || r.statusCode !== 200) return null;
  return await new Response(r.stream).json();
}
async function readAll(dir, max) {
  let blobs = [], cursor;
  do {
    const page = await list({ prefix: dir, limit: 1000, cursor });
    blobs = blobs.concat(page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor && blobs.length < 3000);
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  return (await Promise.all(blobs.slice(0, max).map(b => readOne(b.pathname).catch(() => null)))).filter(Boolean);
}
function newId(p) {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return p + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '-' + Math.random().toString(36).slice(2, 6).padEnd(4, '0');
}

function shapeLead(rec, l, old, u, now) {
  const fields = { name: 80, phone: 40, notes: 1000, residency: 20, date: 10, quoteRef: 20 };
  Object.keys(fields).forEach(k => { if (k in l) rec[k] = str(l[k], fields[k]); });
  if ('source' in l) rec.source = SOURCES.includes(l.source) ? l.source : 'Other';
  if ('nights' in l) rec.nights = int(l.nights, 60);
  if ('group' in l) rec.group = int(l.group, 500);
  if (!old) { rec.inAt = l.inAt && !isNaN(Date.parse(l.inAt)) ? new Date(l.inAt).toISOString() : now; rec.createdAt = now; rec.by = u.user; rec.status = 'New'; }
  if (l.status && LEAD_STATUSES.includes(l.status)) rec.status = l.status;
  if (rec.status !== 'New' && !rec.repliedAt) rec.repliedAt = l.repliedAt && !isNaN(Date.parse(l.repliedAt)) ? new Date(l.repliedAt).toISOString() : now;
  if (!rec.name && !rec.phone) return 'Add a name or a phone number';
}
function shapeSupplier(rec, s, old, u, now) {
  const fields = { name: 80, area: 160, contact: 80, email: 120, phone: 40, commission: 60, terms: 600, notes: 1200 };
  Object.keys(fields).forEach(k => { if (k in s) rec[k] = str(s[k], fields[k]); });
  ['requestedAt', 'signBy', 'signedAt', 'validTo'].forEach(k => { if (k in s) rec[k] = day(s[k]); });
  if ('type' in s) rec.type = SUP_TYPES.includes(s.type) ? s.type : 'Other';
  if ('status' in s) rec.status = SUP_STATUSES.includes(s.status) ? s.status : (old ? old.status : 'To contact');
  if ('inDesk' in s) rec.inDesk = !!s.inDesk;
  if (!old) { rec.createdAt = now; rec.by = u.user; rec.status = rec.status || 'To contact'; }
  if (rec.status === 'Signed' && !rec.signedAt) rec.signedAt = now.slice(0, 10);
  if ('chasedAt' in s) rec.chasedAt = s.chasedAt ? now : '';
  if (!rec.name) return 'Add the supplier name';
}
function shapeSpend(rec, m, old, u, now) {
  if ('month' in m) rec.month = /^\d{4}-\d{2}$/.test(String(m.month || '')) ? m.month : '';
  if ('channel' in m) rec.channel = CHANNELS.includes(m.channel) ? m.channel : 'Other';
  if ('amount' in m) rec.amount = int(m.amount, 1e8);
  if ('note' in m) rec.note = str(m.note, 200);
  if (!old) { rec.createdAt = now; rec.by = u.user; }
  if (!rec.month || !rec.amount) return 'Add the month and the amount';
}

async function handler(request) {
  const u = await who(request);
  if (!u) return deny();
  const own = u.role === 'owner';
  if (request.method === 'GET') {
    const [leads, suppliers, spend] = await Promise.all([readAll('leads/', 500), readAll('suppliers/', 300), own ? readAll('spend/', 500) : []]);
    leads.sort((a, b) => (b.inAt || '').localeCompare(a.inAt || ''));
    suppliers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    spend.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
    return json({ leads, suppliers, spend });
  }
  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'Bad request' }, 400); }
    const kind = body.kind || 'lead', K = KINDS[kind];
    if (!K) return json({ error: 'Unknown kind' }, 400);
    if (kind !== 'lead' && !own) return json({ error: 'Only the owner can change this' }, 403);
    const item = body.item || body.lead || {};
    const valid = id => new RegExp('^' + K.p + '\\d{8}-[a-z0-9]{4}$').test(id || '');
    if (body.action === 'delete') {
      if (kind === 'lead' || !valid(item.id)) return json({ error: 'Bad request' }, 400);
      await del(K.dir + item.id + '.json').catch(() => null);
      return json({ ok: true, id: item.id });
    }
    if (body.action !== 'save') return json({ error: 'Unknown action' }, 400);
    const id = valid(item.id) ? item.id : newId(K.p);
    const path = K.dir + id + '.json';
    const old = valid(item.id) ? await readOne(path, true).catch(() => null) : null;
    const now = new Date().toISOString();
    const rec = Object.assign({}, old || {}, { id });
    const err = (kind === 'lead' ? shapeLead : kind === 'supplier' ? shapeSupplier : shapeSpend)(rec, item, old, u, now);
    if (err) return json({ error: err }, 400);
    rec.updatedAt = now;
    await saveBlob(path, rec);
    return json({ ok: true, lead: kind === 'lead' ? rec : undefined, item: rec });
  }
  return json({ error: 'Method not allowed' }, 405);
}

export const GET = handler;
export const POST = handler;
