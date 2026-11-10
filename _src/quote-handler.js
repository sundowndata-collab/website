import PAGE from './_quote-page.js';
import LOGIN from './_login-page.js';
import { who } from './_auth.js';
export const config = { runtime: 'edge' };

const HEAD = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow', 'x-frame-options': 'DENY' };

export default async function handler(request) {
  const u = await who(request);
  if (!u) return new Response(LOGIN, { status: 200, headers: HEAD });
  const page = PAGE.replace('/*ROLE*/', 'var SD_USER=' + JSON.stringify(u.user) + ',SD_ROLE=' + JSON.stringify(u.role) + ',SD_NAME=' + JSON.stringify(u.name) + ';');
  return new Response(page, { headers: HEAD });
}
