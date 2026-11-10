// Internal quote desk for the Sundown team, served at quote.sundownsafari.com behind a login.
// The page and its net rates live only inside this function, so nothing is public.
import PAGE from './_quote-page.js';
import { who, deny } from './_auth.js';
export const config = { runtime: 'edge' };

export default async function handler(request) {
  const u = who(request);
  if (!u) return deny();
  const page = PAGE.replace('/*ROLE*/', 'var SD_USER=' + JSON.stringify(u.user) + ',SD_ROLE=' + JSON.stringify(u.role) + ';');
  return new Response(page, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
      'x-frame-options': 'DENY'
    }
  });
}
