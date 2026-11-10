// Shared login for the Sundown quote desk and its log.
// Owner: QUOTE_USER (default "sundown") and QUOTE_PASSWORD.
// Team: QUOTE_TEAM as "name:password,name2:password2". Remove a name to remove access.
// Sign in sets a signed session cookie. Changing any password or the team list signs everyone out.
const COOKIE = 'sd_s';

function same(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns 'owner', 'team' or null
export function check(u, p) {
  u = String(u || '').trim().toLowerCase(); p = String(p || '');
  if (!u || !p) return null;
  const ownerPass = process.env.QUOTE_PASSWORD || '';
  const ownerUser = (process.env.QUOTE_USER || 'sundown').toLowerCase();
  if (ownerPass && same(u, ownerUser) && same(p, ownerPass)) return 'owner';
  const team = (process.env.QUOTE_TEAM || '').split(',').map(s => s.trim()).filter(Boolean);
  for (const entry of team) {
    const j = entry.indexOf(':');
    if (j < 1) continue;
    if (same(u, entry.slice(0, j).toLowerCase()) && same(p, entry.slice(j + 1))) return 'team';
  }
  return null;
}

const enc = new TextEncoder();
function b64u(bytes) {
  let s = '';
  bytes.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64u(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return atob(s);
}
async function sign(data) {
  const secret = 'sd1|' + (process.env.QUOTE_SESSION_SECRET || '') + '|' + (process.env.QUOTE_PASSWORD || '') + '|' + (process.env.QUOTE_TEAM || '');
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data))));
}

export async function makeCookie(user, role, days) {
  const exp = Date.now() + days * 864e5;
  const body = b64u(enc.encode(JSON.stringify({ u: user, r: role, e: exp })));
  const tok = body + '.' + (await sign(body));
  return COOKIE + '=' + tok + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + Math.round(days * 86400);
}
export function clearCookie() {
  return COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

function header(request, name) {
  const h = request.headers || {};
  return (typeof h.get === 'function' ? h.get(name) : h[name]) || '';
}

export async function who(request) {
  const m = header(request, 'cookie').match(/(?:^|;\s*)sd_s=([^;]+)/);
  if (!m) return null;
  const [body, sig] = m[1].split('.');
  if (!body || !sig) return null;
  if (!same(sig, await sign(body))) return null;
  let d;
  try { d = JSON.parse(fromB64u(body)); } catch (e) { return null; }
  if (!d || !d.u || !d.e || d.e < Date.now()) return null;
  return { user: d.u, role: d.r === 'owner' ? 'owner' : 'team' };
}

export function deny() {
  return new Response(JSON.stringify({ error: 'Signed out' }), {
    status: 401,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' }
  });
}
