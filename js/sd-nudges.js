/*
 * Sundown honest nudges, shared across the site.
 *
 * 1. Holiday countdown. Any element with data-sd-countdown gets a true, specific
 *    line about how far away Christmas weekend is, for example
 *    "Christmas is seven weeks away." It switches to days in the final fortnight,
 *    to New Year over the holidays, and hides itself once the holidays are over,
 *    so it can never show a stale or false date.
 *    Optional data-sd-countdown-suffix adds a sentence after the countdown.
 *
 * Nothing here invents scarcity: no counters, no fake stock, only the calendar.
 */
(function () {
  'use strict';
  var els = document.querySelectorAll('[data-sd-countdown]');
  if (!els.length) return;

  var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
  function word(n) { return WORDS[n] || String(n); }

  var now = new Date();
  var year = now.getMonth() === 0 && now.getDate() <= 3 ? now.getFullYear() - 1 : now.getFullYear();
  var xmas = new Date(year, 11, 25);
  var newYearEnd = new Date(year + 1, 0, 4);
  var days = Math.ceil((xmas - now) / 86400000);

  var line = null;
  if (days > 13 && days <= 70) line = 'Christmas is ' + word(Math.floor(days / 7)) + ' weeks away.';
  else if (days > 1 && days <= 13) line = 'Christmas is ' + word(days) + ' days away.';
  else if (days <= 1 && now < newYearEnd) line = 'The holidays are here.';

  els.forEach(function (el) {
    if (!line) { el.hidden = true; el.style.display = 'none'; return; }
    var suffix = el.getAttribute('data-sd-countdown-suffix');
    el.textContent = line + (suffix ? ' ' + suffix : '');
  });
})();
