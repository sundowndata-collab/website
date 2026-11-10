// Sign in and sign out for the quote desk.
// POST {user, pass, remember} sets the session cookie. GET ?out=1 clears it.
import { check, makeCookie, clearCookie } from './_auth.js';
export const config = { runtime: 'edge' };

const H = { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' };

export default async function handler(request) {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    if (url.searchParams.has('out')) {
      return new Response(null, { status: 302, headers: { location: '/desk?out=1', 'set-cookie': clearCookie(), 'cache-control': 'no-store' } });
    }
    return new Response(null, { status: 302, headers: { location: '/desk' } });
  }
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: H });
  let b = {};
  try { b = await request.json(); } catch (e) { return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: H }); }
  const user = String(b.user || '').trim().toLowerCase();
  const role = check(user, b.pass);
  if (!role) {
    await new Promise(r => setTimeout(r, 700));
    return new Response(JSON.stringify({ error: 'That username and password do not match. Try again.' }), { status: 401, headers: H });
  }
  const cookie = await makeCookie(user, role, b.remember ? 30 : 0.5);
  return new Response(JSON.stringify({ ok: true, user, role }), { status: 200, headers: { ...H, 'set-cookie': cookie } });
}
