// Internal quote calculator for the Sundown team, served at /quote behind a password.
// The page and its net rates live only inside this function, so nothing is public.
// Set QUOTE_PASSWORD (and optionally QUOTE_USER, default "sundown") in Vercel project settings.
import PAGE from './_quote-page.js';
export const config = { runtime: 'edge' };

function deny() {
  return new Response('Sundown team only', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Sundown quote tool", charset="UTF-8"',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow'
    }
  });
}

function same(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(request) {
  const pass = process.env.QUOTE_PASSWORD || '';
  const user = process.env.QUOTE_USER || 'sundown';
  if (!pass) return deny();
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Basic ')) return deny();
  let decoded = '';
  try { decoded = atob(auth.slice(6)); } catch (e) { return deny(); }
  const i = decoded.indexOf(':');
  if (i < 0) return deny();
  if (!same(decoded.slice(0, i), user) || !same(decoded.slice(i + 1), pass)) return deny();
  return new Response(PAGE, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
      'x-frame-options': 'DENY'
    }
  });
}
