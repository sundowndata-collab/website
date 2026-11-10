// Shared login for the Sundown quote desk and its log.
// Owner: QUOTE_USER (default "sundown") and QUOTE_PASSWORD.
// Team: QUOTE_TEAM as "name:password,name2:password2". Remove a name to remove access.
function same(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function who(request) {
  const h = request.headers;
  const auth = (typeof h.get === 'function' ? h.get('authorization') : h.authorization) || '';
  if (!auth.startsWith('Basic ')) return null;
  let decoded = '';
  try { decoded = typeof atob === 'function' ? atob(auth.slice(6)) : Buffer.from(auth.slice(6), 'base64').toString(); } catch (e) { return null; }
  const i = decoded.indexOf(':');
  if (i < 0) return null;
  const u = decoded.slice(0, i), p = decoded.slice(i + 1);
  const ownerPass = process.env.QUOTE_PASSWORD || '';
  const ownerUser = process.env.QUOTE_USER || 'sundown';
  if (ownerPass && same(u, ownerUser) && same(p, ownerPass)) return { user: u, role: 'owner' };
  const team = (process.env.QUOTE_TEAM || '').split(',').map(s => s.trim()).filter(Boolean);
  for (const entry of team) {
    const j = entry.indexOf(':');
    if (j < 1) continue;
    if (same(u, entry.slice(0, j)) && same(p, entry.slice(j + 1))) return { user: u, role: 'team' };
  }
  return null;
}

export function deny() {
  return new Response('Sundown team only', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Sundown quote tool", charset="UTF-8"',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow'
    }
  });
}
