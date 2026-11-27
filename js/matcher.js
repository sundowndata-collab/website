/*
 * Sundown Safari Matcher, on the homepage under the trip grid.
 *
 * Four taps (when, how long, what matters most, budget) pick one of the
 * published trips plus a backup. The match is worked out here with plain rules,
 * so every trip name, price and inclusion comes from the site's own data and
 * nothing is invented. A short personal note explains the match: a written
 * note shows at once, and /api/match-note swaps in an AI written one when an
 * ANTHROPIC_API_KEY is set on Vercel. The AI only writes the explanation,
 * never the facts.
 *
 * Hand off: WhatsApp with the answers written into the message, or the
 * homepage enquiry form with the trip already picked (?trip=id).
 *
 * Tracking (GA4 and Clarity): matcher_start on the first tap, matcher_complete
 * with the matched trip, matcher_whatsapp_click, matcher_form_click,
 * matcher_trip_click and matcher_restart. The WhatsApp button also fires the
 * site wide whatsapp_click through whatsapp-tracking.js.
 */
(function () {
  'use strict';
  var root = document.getElementById('safari-matcher');
  if (!root) return;

  // Same trips, prices and wording as js/planner.js and js/cost-estimator.js
  var TRIPS = [
    { id: 'explorer', slug: '3-day-a-adventure-the-explorer', name: 'The Explorer', kind: '3 Day Adventure', len: 3, usd: 1700, img: 'explorer', parks: 'Masai Mara and conservancy land', tags: ['value', 'cats'] },
    { id: 'photographer', slug: '3-day-b-classic-the-photographer', name: 'The Photographer', kind: '3 Day Classic', len: 3, usd: 2800, img: 'photographer', parks: 'Masai Mara', tags: ['photo'] },
    { id: 'sundowner', slug: '3-day-c-luxury-lite-the-sundowner', name: 'The Sundowner', kind: '3 Day Luxury Lite', len: 3, usd: 3400, img: 'sundowner', parks: 'Mara North, fly in', tags: ['comfort'] },
    { id: 'trailblazer', slug: '5-day-a-adventure-the-trailblazer', name: 'The Trailblazer', kind: '5 Day Adventure', len: 5, usd: 2600, img: 'trailblazer', parks: 'Samburu and Masai Mara', tags: ['value', 'first'] },
    { id: 'dreamcatcher', slug: '5-day-b-classic-the-dreamcatcher', name: 'The Dreamcatcher', kind: '5 Day Classic', len: 5, usd: 3900, img: 'dreamcatcher', parks: 'Masai Mara and a private conservancy', tags: ['cats', 'family'] },
    { id: 'horizon-chaser', slug: '5-day-c-luxury-lite-the-horizon-chaser', name: 'The Horizon Chaser', kind: '5 Day Luxury Lite', len: 5, usd: 4800, img: 'horizon-chaser', parks: 'Masai Mara and a private conservancy', tags: ['comfort'] },
    { id: 'ultimate-kenya', slug: '7-day-a-flagship-ultimate-kenya', name: 'Ultimate Kenya', kind: '7 Day Flagship', len: 7, usd: 5900, img: 'ultimate-kenya', parks: 'Amboseli and Masai Mara', tags: ['first', 'family'] },
    { id: 'voyager', slug: '7-day-b-classic-the-voyager', name: 'The Voyager', kind: '7 Day Classic', len: 7, usd: 4900, img: 'voyager', parks: 'Masai Mara, Mara Triangle and a conservancy', tags: ['cats', 'value'] },
    { id: 'longlens', slug: '7-day-photography-the-long-lens', name: 'The Long Lens', kind: '7 Day Photography', len: 7, usd: 4900, img: 'photographer', parks: 'Masai Mara, Mara Triangle and a conservancy', tags: ['photo'] },
    { id: 'constellation', slug: '7-day-c-luxury-lite-the-constellation', name: 'The Constellation', kind: '7 Day Luxury Lite', len: 7, usd: 6500, img: 'constellation', parks: 'Masai Mara, Mara Triangle and a conservancy', tags: ['comfort'] }
  ];

  // Why each trip suits each priority, in plain words. Used for the written note.
  var WHY = {
    explorer: { value: 'it is the lowest priced way to have the Mara to yourselves, with your own vehicle and guide', cats: 'your guide tracks off the main roads and on foot with an armed ranger, which is where the cats are' },
    photographer: { photo: 'the Land Cruiser has low angle window mounts and your guide is trained to position you for golden hour, with no time limit at any sighting' },
    sundowner: { comfort: 'you fly straight into Mara North and skip the long road, then stay in a luxury tented camp with sundowner champagne' },
    trailblazer: { value: 'it covers two very different parks for less than most five day trips', first: 'you see two worlds in five days, Samburu for Grevy’s zebra and the northern species, then the Mara for the big cats' },
    dreamcatcher: { cats: 'five days in the Mara gives time for big cat tracking and the river crossings, plus a private conservancy day away from other vehicles', family: 'five unhurried days in one place means less time on the road and more time watching animals' },
    'horizon-chaser': { comfort: 'it includes a dawn balloon flight over the Mara and a champagne bush breakfast, with luxury glamping every night' },
    'ultimate-kenya': { first: 'it shows you the two classic sides of Kenya, elephants under Kilimanjaro in Amboseli and then the Mara', family: 'flights between the parks keep the travel easy, and Amboseli’s elephants are a favourite with children' },
    voyager: { cats: 'seven days lets you know the Mara properly, from the woodland to the open plains, the Mara Triangle and a private conservancy', value: 'it is the best value seven days in the Mara, with a walking safari and a Mara Triangle day included' },
    longlens: { photo: 'you get coaching from a professional photographer, a beanbag on every window and charging on board for seven full days' },
    constellation: { comfort: 'a luxury camp, a night on a star bed under the Milky Way and a night drive with an astronomy session make it the most romantic trip we run' }
  };

  var WHEN = {
    jf: { label: 'January or February', short: 'Jan to Feb', note: 'January and February are dry and quiet, with excellent big cat sightings and the low season park fee, our favourite time to go.' },
    mm: { label: 'March to May', short: 'Mar to May', note: 'March to May is the long rains, so it is the quietest and lowest priced time of year, with green plains and very few vehicles.' },
    jn: { label: 'June', short: 'June', note: 'June is green and lush, with the herds starting to arrive before the peak season prices.' },
    jo: { label: 'July to October', short: 'Jul to Oct', note: 'July to October is migration season, so park fees and lodge rates rise and lodges fill early. Ask for dates soon.' },
    nd: { label: 'November or December', short: 'Nov to Dec', note: 'November brings short rains and softer prices, while Christmas and New Year dates are the first to go.' },
    unsure: { label: 'dates still open', short: 'Not sure yet', note: 'Tell us roughly when and we will show you how the season changes the price.' }
  };
  var LEN_LABEL = { '3': 'three days', '5': 'five days', '7': 'seven days', unsure: 'an open length' };
  var PRI_LABEL = { cats: 'big cats and the migration', photo: 'photography', comfort: 'comfort and romance', first: 'seeing it all on a first safari', family: 'a family trip', value: 'the best value' };
  var LEN_WORD = { 3: 'three', 5: 'five', 7: 'seven' };
  var BUDGET = { b1: [0, 2500], b2: [2500, 4000], b3: [4000, 6000], b4: [6000, 99999], unsure: null };

  var answers = {};
  var started = false;
  var steps = Array.prototype.slice.call(root.querySelectorAll('.sdm-q'));
  var result = root.querySelector('.sdm-result');
  var bar = root.querySelector('.sdm-bar span');
  var count = root.querySelector('.sdm-count');
  var backBtn = root.querySelector('.sdm-back');
  var waBtn = root.querySelector('.sdm-wa');
  var formBtn = root.querySelector('.sdm-form');
  var current = 0;
  var noteReq = 0;
  var lastAlt = null;

  function drawAlt() {
    if (!lastAlt) return;
    result.querySelector('.sdm-r-alt').innerHTML = 'Also worth a look: <a href="/trip/' + lastAlt.slug + '.html">' + esc(lastAlt.name) + '</a>, ' + esc(lastAlt.kind.toLowerCase()) + ' from ' + money(lastAlt.usd) + '.';
  }

  function money(usd) { return window.sdFx ? window.sdFx.price(usd) : '$' + Number(usd).toLocaleString('en'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function track(name, data) {
    try { if (typeof gtag !== 'undefined') gtag('event', name, data || {}); } catch (e) {}
    try { if (typeof clarity === 'function') clarity('event', name); } catch (e) {}
  }

  // ---------- matching ----------
  function score(t) {
    var s = 0;
    var len = answers.len, pri = answers.pri, b = BUDGET[answers.budget];
    if (len && len !== 'unsure') s += t.len === +len ? 6 : Math.abs(t.len - len) === 2 ? 1 : -3;
    if (pri && t.tags.indexOf(pri) !== -1) s += 6;
    if (b) {
      if (t.usd > b[1] * 1.1) s -= 6;                 // clearly over budget
      else if (t.usd >= b[0] && t.usd <= b[1]) s += 3; // sits inside the band
      else if (t.usd < b[0]) s -= 1;                  // under budget, still possible
    }
    if (answers.when === 'jo' && t.parks.indexOf('Mara') !== -1 && t.len >= 5) s += 1;
    return s;
  }
  function rank() {
    return TRIPS.map(function (t, i) { return { t: t, s: score(t), i: i }; })
      .sort(function (a, b) { return b.s - a.s || a.t.usd - b.t.usd || a.i - b.i; })
      .map(function (x) { return x.t; });
  }

  function writtenNote(t) {
    var why = WHY[t.id][answers.pri];
    var first;
    if (why) first = 'You care most about ' + PRI_LABEL[answers.pri] + ', and ' + t.name + ' fits because ' + why + '.';
    else {
      var k = Object.keys(WHY[t.id])[0];
      first = t.name + ' is the closest fit to your answers, because ' + WHY[t.id][k] + '.';
    }
    // Be straight about where the match bends the answers
    var honest = '';
    var b = BUDGET[answers.budget];
    if (answers.len !== 'unsure' && t.len !== +answers.len) honest = ' It runs ' + LEN_WORD[t.len] + ' days rather than ' + LEN_WORD[answers.len] + ', because none of our ' + LEN_WORD[answers.len] + ' day trips suits this as well.';
    else if (b && t.usd > b[1]) honest = ' It starts above the budget you gave, so ask us and we will shape a version that fits.';
    return first + honest + ' ' + WHEN[answers.when].note;
  }

  // ---------- drawing ----------
  function photo(t) {
    var base = '/images/trip-' + t.img + '-card-600';
    return '<picture><source type="image/webp" srcset="' + base + '.webp"><img src="' + base + '.jpg" alt="' + esc(t.name) + ' safari" width="600" height="375" loading="lazy"></picture>';
  }

  function show(i) {
    current = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    result.hidden = i < steps.length;
    root.classList.toggle('is-done', i >= steps.length);
    var pct = Math.round((Math.min(i, steps.length) / steps.length) * 100);
    if (bar) bar.style.width = (i >= steps.length ? 100 : Math.max(pct, 6)) + '%';
    if (count) count.textContent = i >= steps.length ? 'Your match' : 'Question ' + (i + 1) + ' of ' + steps.length;
    if (backBtn) backBtn.hidden = i === 0;
  }

  function render() {
    var list = rank();
    var t = list[0];
    // The backup should speak to the same priority where one fits, not just score next
    var alt = list.slice(1).filter(function (x) { return x.tags.indexOf(answers.pri) !== -1 && score(x) > 0; })[0] || list[1];
    var note = writtenNote(t);
    result.querySelector('.sdm-r-photo').innerHTML = photo(t);
    result.querySelector('.sdm-r-kind').textContent = t.kind;
    var name = result.querySelector('.sdm-r-name');
    name.textContent = t.name;
    name.href = '/trip/' + t.slug + '.html';
    result.querySelector('.sdm-r-parks').textContent = t.parks;
    result.querySelector('.sdm-r-price b').textContent = money(t.usd);
    var noteEl = result.querySelector('.sdm-r-note');
    noteEl.textContent = note;
    noteEl.classList.remove('is-ai');
    lastAlt = alt;
    drawAlt();

    var msg = 'Hi Sundown, the Safari Matcher suggested ' + t.name + ' for us. ' +
      'Timing: ' + WHEN[answers.when].label + '. Length: ' + LEN_LABEL[answers.len] + '. ' +
      'What matters most: ' + PRI_LABEL[answers.pri] + '. Could you send me a plan and price?';
    waBtn.href = 'https://wa.me/254724491210?text=' + encodeURIComponent(msg);
    formBtn.href = '/?trip=' + t.id + '#master-booking';
    root.dataset.trip = t.id;

    track('matcher_complete', { trip: t.name, value: t.usd, currency: 'USD', when: answers.when, length: answers.len, priority: answers.pri, budget: answers.budget });
    fetchNote(t, alt, noteEl);
  }

  // Ask the server for an AI written note. Keeps the written one if anything fails.
  function fetchNote(t, alt, el) {
    if (!window.fetch) return;
    var id = ++noteReq;
    var q = '?trip=' + t.id + '&alt=' + alt.id + '&when=' + answers.when + '&len=' + answers.len + '&pri=' + answers.pri + '&budget=' + answers.budget;
    el.classList.add('is-loading');
    var timer = setTimeout(function () { el.classList.remove('is-loading'); }, 4000);
    fetch('/api/match-note' + q, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.status === 200 ? r.json() : null; })
      .then(function (d) {
        if (id !== noteReq || !d || !d.note) return;
        el.textContent = d.note;
        el.classList.add('is-ai');
      })
      .catch(function () {})
      .then(function () { clearTimeout(timer); if (id === noteReq) el.classList.remove('is-loading'); });
  }

  // ---------- events ----------
  steps.forEach(function (step, k) {
    var key = step.getAttribute('data-q');
    step.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-v]');
      if (!btn) return;
      Array.prototype.forEach.call(step.querySelectorAll('button[data-v]'), function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      answers[key] = btn.getAttribute('data-v');
      if (!started) { started = true; track('matcher_start'); }
      setTimeout(function () {
        if (k + 1 < steps.length) { show(k + 1); focusStep(k + 1); }
        else { show(steps.length); render(); result.querySelector('.sdm-r-name').focus({ preventScroll: true }); keepInView(); }
      }, 160);
    });
  });
  function focusStep(i) { var b = steps[i].querySelector('button[aria-pressed="true"]') || steps[i].querySelector('button'); if (b) b.focus({ preventScroll: true }); }
  function keepInView() {
    var top = root.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) window.scrollTo({ top: top + window.scrollY - 90, behavior: 'smooth' });
  }

  if (backBtn) backBtn.addEventListener('click', function () { if (current > 0) { show(current - 1); focusStep(current); } });
  root.querySelector('.sdm-restart').addEventListener('click', function () {
    answers = {};
    root.querySelectorAll('button[aria-pressed]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    track('matcher_restart');
    show(0); focusStep(0);
  });
  waBtn.addEventListener('click', function () { track('matcher_whatsapp_click', { trip: root.dataset.trip }); });
  formBtn.addEventListener('click', function () { track('matcher_form_click', { trip: root.dataset.trip }); });
  result.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="/trip/"]');
    if (a) track('matcher_trip_click', { trip: a.getAttribute('href') });
  });

  // Budget chips and prices follow the visitor's currency once rates arrive
  function relabel() {
    root.querySelectorAll('[data-usd-lo]').forEach(function (el) {
      var lo = +el.getAttribute('data-usd-lo'), hi = +el.getAttribute('data-usd-hi');
      el.textContent = !lo ? 'Under ' + money(hi) : !hi ? money(lo) + ' and up' : money(lo) + ' to ' + money(hi);
    });
    if (current >= steps.length) {
      var t = TRIPS.filter(function (x) { return x.id === root.dataset.trip; })[0];
      if (t) result.querySelector('.sdm-r-price b').textContent = money(t.usd);
      drawAlt();
    }
  }
  document.addEventListener('sd:fx', relabel);
  if (window.sdFx) relabel();

  root.classList.add('is-live');
  show(0);
})();
