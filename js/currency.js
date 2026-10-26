/*
 * Sundown Safaris local currency display.
 *
 * Every price on the site is set in US dollars. This script shows visitors the same
 * price in their own country's currency, using the day's market rate from /api/fx.
 *
 * Protecting Sundown from FX losses:
 *  1. Bookings are always invoiced and paid in US dollars (or shillings for resident
 *     quotes), so what Sundown receives never depends on the visitor's currency.
 *  2. The local figure includes FX_BUFFER, an allowance for bank conversion spreads,
 *     and is rounded up, so the guide price is never lower than what the guest pays.
 *
 * Mark a price with data-usd="1500". Mark a label that should explain the
 * conversion with data-fx-note. Budget options use data-usd-range="1500-2500".
 */
(function () {
  'use strict';

  var FX_BUFFER = 0.03;            // 3% allowance for bank conversion spreads
  var CACHE_KEY = 'sd_fx_v1';
  var CHOICE_KEY = 'sd_currency';
  var CACHE_MS = 3 * 60 * 60 * 1000; // reuse rates for 3 hours on this device

  var PICKER = ['USD', 'KES', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF', 'SEK', 'NOK', 'DKK',
    'AED', 'SAR', 'QAR', 'INR', 'CNY', 'JPY', 'SGD', 'ZAR', 'NGN', 'UGX', 'TZS', 'RWF'];

  var prices = document.querySelectorAll('[data-usd]');
  var ranges = document.querySelectorAll('[data-usd-range]');
  var notes = document.querySelectorAll('[data-fx-note]');
  if (!prices.length && !ranges.length) return;

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  // Round up to a clean step so the shown figure is tidy and never understated
  function niceUp(n) {
    var step = n < 100 ? 1 : n < 10000 ? 10 : n < 100000 ? 100 : n < 1000000 ? 1000 : 10000;
    return Math.ceil(n / step) * step;
  }

  function format(amount, code) {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(amount);
    } catch (e) {
      return code + ' ' + Math.round(amount).toLocaleString('en');
    }
  }

  function usdLabel(n) { return 'US$' + Number(n).toLocaleString('en'); }

  // Remember the original USD text so switching back always restores it exactly
  function remember(el) {
    if (!el.hasAttribute('data-usd-text')) el.setAttribute('data-usd-text', el.textContent);
  }

  function render(fx, code) {
    var rate = fx && fx.rates ? fx.rates[code] : null;
    var local = code !== 'USD' && rate;

    prices.forEach(function (el) {
      remember(el);
      var usd = parseFloat(el.getAttribute('data-usd'));
      if (!local || !usd) { el.textContent = el.getAttribute('data-usd-text'); el.removeAttribute('title'); return; }
      el.textContent = format(niceUp(usd * rate * (1 + FX_BUFFER)), code);
      el.setAttribute('title', usdLabel(usd) + ' at today\'s rate. Invoiced in US dollars.');
    });

    ranges.forEach(function (el) {
      remember(el);
      if (!local) { el.textContent = el.getAttribute('data-usd-text'); return; }
      var parts = el.getAttribute('data-usd-range').split('-');
      var label = el.getAttribute('data-usd-label') || '';
      var lo = niceUp(parseFloat(parts[0]) * rate * (1 + FX_BUFFER));
      var text = parts[1]
        ? format(lo, code) + ' to ' + format(niceUp(parseFloat(parts[1]) * rate * (1 + FX_BUFFER)), code)
        : format(lo, code) + ' and up';
      el.textContent = text + (label ? ', ' + label : '');
    });

    notes.forEach(function (el) {
      remember(el);
      var usd = el.getAttribute('data-fx-usd');
      if (!local) { el.textContent = el.getAttribute('data-usd-text'); return; }
      el.textContent = 'Per person, all inclusive. Shown in ' + code + ' at today\'s rate' +
        (usd ? '; invoiced as ' + usdLabel(usd) : '; invoiced in US dollars') + '.';
    });

    document.documentElement.setAttribute('data-currency', code);
    document.querySelectorAll('.sd-fx-select').forEach(function (s) { s.value = code; });
    document.querySelectorAll('.sd-fx-line-text').forEach(function (t) {
      t.textContent = local
        ? 'Prices in ' + code + ' at today\'s rate, plus 3% for bank conversion. Invoiced in US dollars.'
        : 'Prices in US dollars, per person, all inclusive.';
    });
  }

  // A small currency picker under the trip grid and next to trip prices
  function addPickers(fx, code) {
    var spots = document.querySelectorAll('[data-fx-picker]');
    if (!spots.length) return;
    var list = PICKER.slice();
    if (list.indexOf(code) === -1) list.unshift(code);
    list = list.filter(function (c) { return c === 'USD' || (fx.rates && fx.rates[c]); });
    spots.forEach(function (spot) {
      if (spot.querySelector('.sd-fx-select')) return;
      var wrap = document.createElement('span');
      wrap.className = 'sd-fx-line';
      var text = document.createElement('span');
      text.className = 'sd-fx-line-text';
      var sel = document.createElement('select');
      sel.className = 'sd-fx-select';
      sel.setAttribute('aria-label', 'Show prices in');
      list.forEach(function (c) {
        var o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o);
      });
      sel.value = code;
      sel.addEventListener('change', function () {
        store(CHOICE_KEY, sel.value);
        render(fx, sel.value);
        if (typeof gtag !== 'undefined') gtag('event', 'currency_change', { currency: sel.value });
      });
      wrap.appendChild(text); wrap.appendChild(sel);
      spot.appendChild(wrap);
    });
  }

  function start(fx) {
    if (!fx || !fx.rates) return;
    var chosen = load(CHOICE_KEY);
    var code = (chosen && fx.rates[chosen]) ? chosen : (fx.rates[fx.currency] ? fx.currency : 'USD');
    addPickers(fx, code);
    render(fx, code);
    if (code !== 'USD' && typeof gtag !== 'undefined') gtag('event', 'currency_shown', { currency: code, country: fx.country || '' });
  }

  var cached = null;
  try { cached = JSON.parse(load(CACHE_KEY) || 'null'); } catch (e) {}
  if (cached && cached.at && (Date.now() - cached.at) < CACHE_MS && cached.fx) { start(cached.fx); return; }

  fetch('/api/fx', { headers: { accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (fx) {
      if (!fx || !fx.rates) return;
      store(CACHE_KEY, JSON.stringify({ at: Date.now(), fx: fx }));
      start(fx);
    })
    .catch(function () { /* on any failure the USD prices simply stay as they are */ });
})();
