/*
 * Sundown safari cost estimator, used at the top of the Kenya safari cost guide.
 *
 * The visitor picks days, style, month and group size. The estimator matches the
 * published Sundown trip for that length and style, shows its starting price per
 * person and for the group, and adds the costs that sit outside the package
 * (tips, visa and insurance) using the same figures the guide gives further down.
 * Nothing here invents a price: every number comes from the guide itself.
 *
 * Prices follow the site currency picker through window.sdFx (js/currency.js).
 * The page ships with a finished default result in the HTML, so the estimate is
 * readable even before this script runs.
 *
 * Tracking (GA4 and Clarity): estimator_start on the first change,
 * estimator_whatsapp_click and estimator_form_click on the two buttons.
 * The WhatsApp button also fires the site wide whatsapp_click key event.
 */
(function () {
  'use strict';
  var root = document.getElementById('cost-estimator');
  if (!root) return;

  var TRIPS = [
    { id: 'explorer', slug: '3-day-a-adventure-the-explorer', name: 'The Explorer', tier: 'a', len: 3, usd: 1700, parks: 'Masai Mara and conservancy land', hook: 'Active tracking on foot and off the main roads' },
    { id: 'photographer', slug: '3-day-b-classic-the-photographer', name: 'The Photographer', tier: 'b', len: 3, usd: 2800, parks: 'Masai Mara', hook: 'Low angle camera mounts and golden hour positioning' },
    { id: 'sundowner', slug: '3-day-c-luxury-lite-the-sundowner', name: 'The Sundowner', tier: 'c', len: 3, usd: 3400, parks: 'Mara North, fly in', hook: 'No long road transfer, conservancy routes and a luxury tented camp' },
    { id: 'trailblazer', slug: '5-day-a-adventure-the-trailblazer', name: 'The Trailblazer', tier: 'a', len: 5, usd: 2600, parks: 'Samburu and Masai Mara', hook: 'Grevy’s zebra and the northern species, then the Mara' },
    { id: 'dreamcatcher', slug: '5-day-b-classic-the-dreamcatcher', name: 'The Dreamcatcher', tier: 'b', len: 5, usd: 3900, parks: 'Masai Mara and a private conservancy', hook: 'Big cat tracking and river crossings' },
    { id: 'horizon-chaser', slug: '5-day-c-luxury-lite-the-horizon-chaser', name: 'The Horizon Chaser', tier: 'c', len: 5, usd: 4800, parks: 'Masai Mara and a private conservancy', hook: 'A dawn balloon flight and luxury glamping' },
    { id: 'ultimate-kenya', slug: '7-day-a-flagship-ultimate-kenya', name: 'Ultimate Kenya', tier: 'a', len: 7, usd: 5900, parks: 'Amboseli and Masai Mara', hook: 'Elephants under Kilimanjaro, then the Mara. Built for a first safari' },
    { id: 'longlens', slug: '7-day-photography-the-long-lens', name: 'The Long Lens', tier: 'b', len: 7, usd: 4900, parks: 'Masai Mara, Mara Triangle and a conservancy', hook: 'Seven days built for photographers' },
    { id: 'voyager', slug: '7-day-b-classic-the-voyager', name: 'The Voyager', tier: 'b', len: 7, usd: 4900, parks: 'Masai Mara, Mara Triangle and a conservancy', hook: 'Seven days to really know the Mara' },
    { id: 'constellation', slug: '7-day-c-luxury-lite-the-constellation', name: 'The Constellation', tier: 'c', len: 7, usd: 6500, parks: 'Masai Mara, Mara Triangle and a conservancy', hook: 'A star bed night under the Milky Way' }
  ];
  var TIER = { a: 'Adventure', b: 'Classic', c: 'Luxury Lite' };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // The same per person extras the guide lists under Hidden costs
  var EXTRAS = { tipLo: 15, tipHi: 25, visa: 30, insLo: 150, insHi: 300 };

  function season(m) {
    if (m === '') return { tag: '', text: 'Pick a month and we will tell you how the season affects your price.' };
    m = +m;
    if (m <= 2) return { tag: 'Best value', text: 'Dry, warm and quiet. Mara park fees are at the low season rate of $100 a day, which makes this the best value window of the year.' };
    if (m <= 4) return { tag: 'Low season', text: 'The long rains. The quietest and lowest priced time of the year to travel.' };
    if (m === 5) return { tag: 'Low season', text: 'Low season park fees still apply and the plains are green after the rains. Good value before the migration crowds arrive.' };
    if (m <= 9) return { tag: 'Migration peak', text: 'Mara park fees double to $200 a day and lodges charge their peak rates, so expect your quote to land above the starting price. Lodges fill months ahead.' };
    if (m === 10) return { tag: 'Shoulder season', text: 'The short rains, usually brief. Wildlife stays excellent and prices start to soften after the migration peak.' };
    return { tag: 'Holiday season', text: 'Christmas and New Year. Lodges fill first over the holidays, so send your dates early.' };
  }

  var form = root.querySelector('form');
  var out = root.querySelector('.sd-est-result');
  var guestsEl = root.querySelector('.sd-est-guests-n');
  var guestsInput = form.elements.est_guests;
  var waBtn = root.querySelector('.sd-est-wa');
  var formBtn = root.querySelector('.sd-est-form');

  function money(usd) { return window.sdFx ? window.sdFx.price(usd) : '$' + Number(usd).toLocaleString('en'); }
  function radio(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function track(name, data) {
    try { if (typeof gtag !== 'undefined') gtag('event', name, data || {}); } catch (e) {}
    try { if (typeof clarity === 'function') clarity('event', name); } catch (e) {}
  }
  function find(len, tier) {
    for (var i = 0; i < TRIPS.length; i++) if (TRIPS[i].len === len && TRIPS[i].tier === tier) return TRIPS[i];
    return TRIPS[4];
  }

  var state = {};
  function read() {
    state.len = +radio('est_days') || 5;
    state.tier = radio('est_style') || 'b';
    state.month = form.elements.est_month.value;
    state.guests = Math.max(1, Math.min(12, +guestsInput.value || 2));
    state.trip = find(state.len, state.tier);
  }

  // Show each style's starting price for the chosen length, so the ladder makes sense
  function stylePrices() {
    root.querySelectorAll('[data-est-tier-price]').forEach(function (el) {
      el.textContent = 'from ' + money(find(state.len, el.getAttribute('data-est-tier-price')).usd);
    });
  }

  function render() {
    read();
    stylePrices();
    var t = state.trip, g = state.guests, d = state.len;
    var exLo = d * EXTRAS.tipLo + EXTRAS.visa + EXTRAS.insLo;
    var exHi = d * EXTRAS.tipHi + EXTRAS.visa + EXTRAS.insHi;
    var s = season(state.month);
    var groupNote = g === 1
      ? 'Travelling alone usually costs a little more per person, because the vehicle and guide are all yours. We will quote it exactly.'
      : g >= 5
        ? 'Five or more travel in more than one vehicle, so nobody is squeezed in. We will quote the exact split.'
        : 'Prices are per person sharing, with your own vehicle and guide for the whole trip.';

    guestsEl.textContent = g;
    root.querySelector('.sd-est-minus').disabled = g <= 1;
    root.querySelector('.sd-est-plus').disabled = g >= 12;

    out.innerHTML =
      '<div class="sd-est-match">' +
        '<img src="/images/trip-' + t.id + '-card-600.jpg" alt="' + esc(t.name) + ', a ' + d + ' day ' + TIER[t.tier] + ' safari in ' + esc(t.parks) + '" width="600" height="375" loading="lazy">' +
        '<div><p class="sd-est-kicker">Your matched trip</p>' +
        '<h3 class="sd-est-name"><a href="/trip/' + t.slug + '.html">' + esc(t.name) + '</a></h3>' +
        '<p class="sd-est-hook">' + d + ' days, ' + esc(t.parks) + '. ' + esc(t.hook) + '.</p></div>' +
      '</div>' +
      '<dl class="sd-est-lines">' +
        '<div class="sd-est-big"><dt>Per person, all inclusive</dt><dd>from <b>' + money(t.usd) + '</b></dd></div>' +
        '<div><dt>For your group of ' + g + '</dt><dd>from ' + money(t.usd * g) + '</dd></div>' +
        '<div><dt>Tips, visa and insurance <a href="#hidden-costs">per person</a></dt><dd>' + money(exLo) + ' to ' + money(exHi) + '</dd></div>' +
        '<div class="sd-est-total"><dt>All in per person, before flights</dt><dd>' + money(t.usd + exLo) + ' to ' + money(t.usd + exHi) + '</dd></div>' +
      '</dl>' +
      '<p class="sd-est-season">' + (s.tag ? '<b>' + s.tag + '.</b> ' : '') + esc(s.text) + '</p>' +
      '<p class="sd-est-note">' + esc(groupNote) + ' Park fees, accommodation, meals, guide and transfers are included. A guide price; your exact quote follows within 24 hours and is invoiced in US dollars.</p>';

    var when = state.month === '' ? 'dates not fixed yet' : 'travelling in ' + MONTHS[+state.month];
    var msg = 'Hi Sundown, I used the cost estimator on your website. ' + d + ' days, ' + TIER[t.tier] + ' style, ' + g + (g === 1 ? ' traveller, ' : ' travellers, ') + when + '. It matched me to ' + t.name + ' from US$' + t.usd.toLocaleString('en') + ' per person. Could you send me a quote?';
    waBtn.href = 'https://wa.me/254724491210?text=' + encodeURIComponent(msg);
    formBtn.href = '/?trip=' + t.id + '#master-booking';
  }

  var started = false;
  function changed() {
    if (!started) { started = true; track('estimator_start', { page: 'kenya_safari_cost_2026' }); }
    render();
  }

  form.addEventListener('change', changed);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  root.querySelector('.sd-est-minus').addEventListener('click', function () { guestsInput.value = Math.max(1, (+guestsInput.value || 2) - 1); changed(); });
  root.querySelector('.sd-est-plus').addEventListener('click', function () { guestsInput.value = Math.min(12, (+guestsInput.value || 2) + 1); changed(); });

  function payload() { return { trip: state.trip.name, days: state.len, style: TIER[state.tier], guests: state.guests, value: state.trip.usd * state.guests, currency: 'USD' }; }
  waBtn.addEventListener('click', function () { track('estimator_whatsapp_click', payload()); });
  formBtn.addEventListener('click', function () { track('estimator_form_click', payload()); });

  document.addEventListener('sd:fx', render);
  root.classList.add('is-live');
  render();
})();
