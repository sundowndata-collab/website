/*
 * Sundown trip planner.
 * Turns the enquiry form into three short steps with a progress bar, and builds a
 * live "Your plan" card from the answers: trip length from the dates, comfort level
 * from the budget, and the matching trip with its published starting price.
 * The form still posts to Formspree through the existing handler; this script only
 * adds steps, the card, and two hidden fields (plan_trip, plan_estimate).
 * Without JavaScript the form shows every field at once, exactly as before.
 */
(function () {
  'use strict';
  var form = document.getElementById('enquiry-form');
  if (!form || !form.querySelector('.sd-pl-step')) return;

  var TRIPS = [
    { id: 'explorer', slug: '3-day-a-adventure-the-explorer', name: 'The Explorer', kind: '3 Day Adventure', tier: 'a', len: 3, usd: 1500, days: ["Arrival and evening game drive", "Full day deep field tracking", "Morning drive and departure"] },
    { id: 'photographer', slug: '3-day-b-classic-the-photographer', name: 'The Photographer', kind: '3 Day Classic', tier: 'b', len: 3, usd: 2800, days: ["Arrival and golden hour session", "Pre dawn to dusk full day", "Final dawn session and departure"] },
    { id: 'sundowner', slug: '3-day-c-luxury-lite-the-sundowner', name: 'The Sundowner', kind: '3 Day Luxury Lite', tier: 'c', len: 3, usd: 3400, days: ["Fly in and sunset champagne", "Full day private game drive", "Morning drive and fly out"] },
    { id: 'trailblazer', slug: '5-day-a-adventure-the-trailblazer', name: 'The Trailblazer', kind: '5 Day Adventure', tier: 'a', len: 5, usd: 2300, days: ["Nairobi to Samburu", "Full day Samburu", "Samburu to Masai Mara", "Full day Masai Mara", "Morning drive and departure"] },
    { id: 'dreamcatcher', slug: '5-day-b-classic-the-dreamcatcher', name: 'The Dreamcatcher', kind: '5 Day Classic', tier: 'b', len: 5, usd: 3900, days: ["Arrival and afternoon drive", "Big cat territory focus", "River crossing and migration", "Private conservancy access", "Final drive and departure"] },
    { id: 'horizon-chaser', slug: '5-day-c-luxury-lite-the-horizon-chaser', name: 'The Horizon Chaser', kind: '5 Day Luxury Lite', tier: 'c', len: 5, usd: 4800, days: ["Arrival and orientation", "Dawn balloon flight", "Full day Mara drive", "Private conservancy", "Final drive and departure"] },
    { id: 'ultimate-kenya', slug: '7-day-a-flagship-ultimate-kenya', name: 'Ultimate Kenya', kind: '7 Day Flagship', tier: 'a', len: 7, usd: 5900, days: ["Nairobi to Amboseli", "Full day Amboseli", "Amboseli to Masai Mara", "Masai Mara big cat day", "River crossing positioning", "Private conservancy access", "Final dawn drive and departure"] },
    { id: 'voyager', slug: '7-day-b-classic-the-voyager', name: 'The Voyager', kind: '7 Day Classic', tier: 'b', len: 7, usd: 4900, days: ["Arrival and woodland zone", "Riverine corridor focus", "Open plains transition", "Big cat intensive", "Private conservancy", "Mara Triangle access", "Final drive and departure"] },
    { id: 'constellation', slug: '7-day-c-luxury-lite-the-constellation', name: 'The Constellation', kind: '7 Day Luxury Lite', tier: 'c', len: 7, usd: 6500, days: ["Arrival and luxury camp welcome", "Full day game drive", "Star bed night", "Post star bed and Mara Triangle", "Private conservancy", "Night drive and astronomy", "Final dawn drive and departure"] }
  ];
  var TIER_NAME = { a: 'Adventure', b: 'Classic', c: 'Luxury Lite' };
  var GROUP = { '1': 'Just you', '2': 'Two of you', '3': 'Three of you', '4': 'Four of you', '5+': 'Five or more' };
  var STEP_TITLES = ['Your trip', 'Your style', 'Where to send your plan'];
  var IMG = '/images/trip-%s-card-600.jpg';

  var steps = Array.prototype.slice.call(form.querySelectorAll('.sd-pl-step'));
  var bar = form.querySelector('.sd-pl-bar span');
  var label = form.querySelector('.sd-pl-label');
  var progress = form.querySelector('.sd-pl-progress');
  var nextBtn = form.querySelector('.sd-pl-next');
  var backBtn = form.querySelector('.sd-pl-back');
  var submitBtn = document.getElementById('submit-btn');
  var btnText = document.getElementById('btn-text');
  var card = document.getElementById('sd-pl-card');
  var mini = form.querySelector('.sd-pl-mini');
  var dp = document.getElementById('date-range-picker');
  var current = 0, reached = 0;

  var params = new URLSearchParams(location.search);
  var picked = null;
  TRIPS.forEach(function (t) { if (t.id === params.get('trip')) picked = t; });

  function val(name) { var el = form.elements[name]; return el ? el.value : ''; }
  function track(name, data) {
    try { if (typeof gtag !== 'undefined') gtag('event', name, data || {}); } catch (e) {}
    try { if (typeof clarity === 'function') clarity('event', name); } catch (e) {}
  }
  function money(usd) { return window.sdFx ? window.sdFx.price(usd) : 'US$' + usd.toLocaleString('en'); }

  // ---------- working out the plan ----------
  function nights() {
    var fp = dp && dp._flatpickr;
    if (fp && fp.selectedDates.length === 2) return Math.round((fp.selectedDates[1] - fp.selectedDates[0]) / 86400000);
    return null;
  }
  function lengthFor(n) {
    if (n === null) return null;
    var days = n + 1;
    return days <= 4 ? 3 : days <= 6 ? 5 : 7;
  }
  function tierFor(budget, priority) {
    var t = { '1500-2500': 'a', '2500-4000': 'b', '4000-6000': 'c', '6000+': 'c', 'flexible': 'b' }[budget] || null;
    if (priority === 'luxury' || priority === 'honeymoon') t = 'c';
    if (priority === 'photography' && t !== 'c') t = 'b';
    return t;
  }
  function match() {
    var len = lengthFor(nights());
    var tier = tierFor(val('budget_range'), val('safari_priority'));
    if (!len && !tier) return null;
    len = len || 3; tier = tier || 'b';
    for (var i = 0; i < TRIPS.length; i++) if (TRIPS[i].len === len && TRIPS[i].tier === tier) return TRIPS[i];
    return null;
  }
  function reason(t) {
    var bits = [];
    var n = nights();
    if (n !== null) bits.push('your ' + (n + 1) + ' days');
    var b = val('budget_range');
    if (b) bits.push(b === 'flexible' ? 'a flexible budget' : 'a ' + TIER_NAME[t.tier] + ' budget');
    var p = { big_cats: 'big cats', photography: 'photography', migration: 'the migration', luxury: 'comfort', honeymoon: 'a romantic trip', family: 'a family trip', first_time: 'a first safari' }[val('safari_priority')];
    if (p) bits.push(p);
    if (!bits.length) return '';
    return 'Matched to ' + (bits.length > 1 ? bits.slice(0, -1).join(', ') + ' and ' + bits[bits.length - 1] : bits[0]) + '.';
  }

  // ---------- drawing the card ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render() {
    var suggested = match();
    var t = picked || suggested;
    var n = nights();
    var hidTrip = form.elements.plan_trip, hidEst = form.elements.plan_estimate;
    if (!t) {
      card.innerHTML = '<p class="sd-pl-card-kicker">Your plan</p><div class="sd-pl-empty"><p class="sd-pl-empty-h">Your safari builds here as you answer.</p><p>Pick your dates and who is coming, and we will match you to the right trip with a starting price.</p></div>';
      mini.hidden = true; hidTrip.value = ''; hidEst.value = '';
      return;
    }
    var lenText = n !== null ? (n + 1) + ' days, ' + n + (n === 1 ? ' night' : ' nights') : t.len + ' days';
    var more = t.days.length > 3 ? '<li class="sd-pl-more">and ' + (t.days.length - 3) + ' more days</li>' : '';
    var alt = (picked && suggested && suggested.id !== picked.id)
      ? '<p class="sd-pl-alt">Your answers also suit <a href="/trip/' + suggested.slug + '.html" target="_blank" rel="noopener">' + esc(suggested.name) + '</a>, from ' + money(suggested.usd) + '. We can quote both.</p>' : '';
    card.innerHTML =
      '<p class="sd-pl-card-kicker">' + (picked ? 'The trip you picked' : 'Your matched trip') + '</p>' +
      '<figure class="sd-pl-photo"><img src="' + IMG.replace('%s', t.id) + '" alt="' + esc(t.name) + ' safari" width="600" height="375"><figcaption>' + esc(t.kind) + '</figcaption></figure>' +
      '<h3 class="sd-pl-name">' + esc(t.name) + '</h3>' +
      (picked ? '' : '<p class="sd-pl-why">' + esc(reason(t)) + '</p>') +
      '<dl class="sd-pl-facts"><div><dt>Length</dt><dd>' + lenText + '</dd></div>' +
      '<div><dt>Travellers</dt><dd>' + (GROUP[val('group_size')] || 'Any group size') + '</dd></div>' +
      '<div><dt>Style</dt><dd>' + TIER_NAME[t.tier] + '</dd></div></dl>' +
      '<p class="sd-pl-price"><span>From</span> <b>' + money(t.usd) + '</b> <span>per person</span></p>' +
      '<ol class="sd-pl-days">' + t.days.slice(0, 3).map(function (d, i) { return '<li><span>Day ' + (i + 1) + '</span>' + esc(d) + '</li>'; }).join('') + more + '</ol>' +
      alt +
      '<p class="sd-pl-note">A guide price. Your exact quote follows within 24 hours, based on your dates and group, and is invoiced in US dollars.</p>';
    mini.hidden = false;
    mini.innerHTML = '<img src="' + IMG.replace('%s', t.id) + '" alt="" width="64" height="40"><span><b>' + esc(t.name) + '</b> from ' + money(t.usd) + ' per person</span>';
    hidTrip.value = t.name + ' (' + t.kind + ')' + (picked ? ', picked on the trip page' : ', matched by the planner');
    hidEst.value = 'From US$' + t.usd.toLocaleString('en') + ' per person' + (window.sdFx && window.sdFx.code !== 'USD' ? ', shown to guest as ' + money(t.usd) : '');
  }

  // ---------- steps ----------
  function show(i) {
    current = i;
    steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
    bar.style.width = ((i + 1) / steps.length * 100) + '%';
    label.innerHTML = '<b>Step ' + (i + 1) + ' of ' + steps.length + '</b> ' + STEP_TITLES[i];
    backBtn.hidden = i === 0;
    nextBtn.hidden = i === steps.length - 1;
    submitBtn.hidden = i !== steps.length - 1;
    if (i === steps.length - 1 && btnText.textContent.indexOf('Sending') === -1) btnText.textContent = 'Send me this plan';
    if (i > reached) { reached = i; track('form_step', { step: i + 1, step_name: STEP_TITLES[i] }); }
  }
  function stepValid(i) {
    var ok = true;
    var fields = steps[i].querySelectorAll('input, select, textarea');
    for (var k = 0; k < fields.length; k++) {
      var f = fields[k];
      if (f === dp) {
        if (!dp.value) {
          ok = false;
          var help = document.getElementById('date-help');
          if (help) { help.textContent = 'Choose your dates to continue'; help.style.color = '#b91c1c'; help.style.fontWeight = '700'; }
          dp.click();
          break;
        }
        continue;
      }
      if (!f.checkValidity()) { f.reportValidity(); ok = false; break; }
    }
    return ok;
  }
  nextBtn.addEventListener('click', function () {
    if (!stepValid(current)) return;
    show(current + 1);
    var top = form.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
  });
  backBtn.addEventListener('click', function () { show(current - 1); });

  // Pressing Enter before the last step moves on instead of sending early.
  // Capture phase on the document runs before the form's own submit handler.
  document.addEventListener('submit', function (e) {
    if (e.target !== form) return;
    if (current < steps.length - 1) {
      e.preventDefault(); e.stopPropagation();
      nextBtn.click();
      return;
    }
    render();
    track('form_plan_sent', { plan: form.elements.plan_trip.value });
  }, true);

  var started = false;
  function start() { if (!started) { started = true; track('form_start', { step: 1, step_name: STEP_TITLES[0] }); } }
  form.addEventListener('focusin', start);
  form.addEventListener('change', render);
  form.addEventListener('input', function (e) { if (e.target === dp) render(); });
  document.addEventListener('sd:fx', render);
  if (dp) {
    // flatpickr loads later; re-render whenever the dates change
    var last = '';
    setInterval(function () { if (dp.value !== last) { last = dp.value; render(); } }, 600);
  }

  // Once the enquiry is sent the existing handler hides the form; hide the card with it
  var success = document.getElementById('form-success');
  if (success && 'MutationObserver' in window) {
    new MutationObserver(function () {
      if (!success.classList.contains('hidden')) card.style.display = 'none';
    }).observe(success, { attributes: true, attributeFilter: ['class'] });
  }

  form.classList.add('is-stepped');
  progress.hidden = false;
  if (picked) {
    var opt = form.querySelector('select[name="budget_range"] option[data-usd-label="' + TIER_NAME[picked.tier] + '"]');
    if (opt && !val('budget_range')) opt.selected = true;
  }
  show(0);
  render();
})();
