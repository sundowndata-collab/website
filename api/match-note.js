// AI written note for the homepage Safari Matcher (js/matcher.js).
//
// The browser sends only short codes (trip id, timing, length, priority, budget).
// Every code is checked against the lists below, and the facts the model sees
// come from this file, never from the visitor. The model writes two sentences
// explaining why the trip fits. It is told not to state prices or add facts.
//
// Needs ANTHROPIC_API_KEY in the Vercel project. Without it this returns 204
// and the matcher keeps its own written note. ANTHROPIC_MODEL is optional.
// There are only 720 possible answer sets, so each note is cached at
// the edge for 30 days and the model is called once per combination at most.
export const config = { runtime: 'edge' };

const TRIPS = {
  explorer: 'The Explorer, 3 days, Masai Mara and conservancy land. Eco lodge, active tracking off the main roads and a bush walk with an armed ranger. The lowest priced private Mara trip.',
  photographer: 'The Photographer, 3 days, Masai Mara. Land Cruiser with low angle window mounts, a photography trained guide, golden hour positioning, no time limit at sightings, premium camp.',
  sundowner: 'The Sundowner, 3 days. Return flights from Nairobi Wilson Airport to Mara North, so no long road transfer. Luxury tented camp, butler service, sundowner champagne.',
  trailblazer: 'The Trailblazer, 5 days. Samburu for Grevy’s zebra and the northern species, then the Masai Mara, with two internal flights.',
  dreamcatcher: 'The Dreamcatcher, 5 days, Masai Mara. Big cat tracking, river crossing positioning in season, a private conservancy day, premium lodge.',
  'horizon-chaser': 'The Horizon Chaser, 5 days, Masai Mara. Dawn hot air balloon flight included, champagne bush breakfast, a private conservancy, luxury glamping.',
  'ultimate-kenya': 'Ultimate Kenya, 7 days. Amboseli for elephants under Kilimanjaro, then the Masai Mara with river crossing positioning and a private conservancy. Built for a first safari.',
  voyager: 'The Voyager, 7 days across the Masai Mara: woodland, riverine corridor, open plains, a big cat day, a private conservancy, the Mara Triangle and a walking safari.',
  longlens: 'The Long Lens, 7 days in the Masai Mara for photographers. Coaching from a professional photographer, a beanbag on every window, charging on board, Mara Triangle and a conservancy.',
  constellation: 'The Constellation, 7 days in the Masai Mara. Luxury camp, a night on a star bed platform under the Milky Way, a night drive with an astronomy session, fine dining.'
};
const WHEN = {
  jf: 'January or February: dry, quiet, excellent big cat sightings, low season park fees.',
  mm: 'March to May: the long rains, the quietest and lowest priced time of year, green plains.',
  jn: 'June: green after the rains, herds starting to arrive, before peak prices.',
  jo: 'July to October: migration season with the river crossings. Busiest and highest priced, lodges fill early.',
  nd: 'November or December: short rains and softer prices in November, holiday dates fill first.',
  unsure: 'Dates not decided yet.'
};
const LEN = { '3': 'three days', '5': 'five days', '7': 'seven days', unsure: 'not sure how long' };
const PRI = { cats: 'big cats and the migration', photo: 'wildlife photography', comfort: 'comfort and romance', first: 'a first safari, seeing as much as possible', family: 'a family trip with children', value: 'the best value' };
const BUDGET = { b1: 'under US$2,500 per person', b2: 'US$2,500 to US$4,000 per person', b3: 'US$4,000 to US$6,000 per person', b4: 'US$6,000 and up per person', unsure: 'no budget given' };

function reply(body, status, maxAge) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': maxAge ? 'public, max-age=3600, s-maxage=' + maxAge : 'no-store',
      'X-Robots-Tag': 'noindex'
    }
  });
}

// House style: no dashes or hyphens, plain punctuation only
function clean(text) {
  return text
    .replace(/\s*[–—]\s*/g, ', ')
    .replace(/(\w)-(\w)/g, '$1 $2')
    .replace(/\s+-\s+/g, ', ')
    .replace(/["*#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req) {
  const p = new URL(req.url).searchParams;
  const trip = p.get('trip'), alt = p.get('alt'), when = p.get('when'), len = p.get('len'), pri = p.get('pri'), budget = p.get('budget');
  if (!TRIPS[trip] || !TRIPS[alt] || !WHEN[when] || !LEN[len] || !PRI[pri] || !BUDGET[budget]) return reply({ error: 'bad request' }, 400);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return reply(null, 204, 300);

  const prompt =
    'A visitor to the Sundown Safaris website answered four questions and was matched to a private Kenya safari.\n\n' +
    'Their answers:\n' +
    '- Timing: ' + WHEN[when] + '\n' +
    '- Length: ' + LEN[len] + '\n' +
    '- What matters most: ' + PRI[pri] + '\n' +
    '- Budget: ' + BUDGET[budget] + '\n\n' +
    'Matched trip: ' + TRIPS[trip] + '\n' +
    'Backup trip: ' + TRIPS[alt] + '\n\n' +
    'Every Sundown trip has a private Land Cruiser and guide for the group only.\n\n' +
    'Write exactly two sentences, under 55 words in total, speaking to the visitor as "you", explaining why the matched trip suits what they said. ' +
    'Sound like a warm, experienced Kenyan safari planner, not a brochure. Mention their timing if they gave one. ' +
    'Use only the facts above. Do not mention prices, lodge names, guarantees or anything not listed. Do not mention the backup trip. ' +
    'If the match is not a perfect fit for their length or budget, say so honestly and briefly. ' +
    'Plain text only: no dashes, no hyphens, no emoji, no quotation marks, no greeting.';

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 160,
        temperature: 0.6,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    clearTimeout(timer);
    if (!r.ok) return reply(null, 204, 60);
    const d = await r.json();
    const text = clean((d.content || []).filter((c) => c.type === 'text').map((c) => c.text).join(' '));
    // Reject anything that drifted: prices, links, or far too long
    if (!text || text.length > 420 || /\$|US\$|KES|http|www\./i.test(text)) return reply(null, 204, 60);
    return reply({ note: text }, 200, 2592000);
  } catch (e) {
    return reply(null, 204, 60);
  }
}
