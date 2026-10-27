/* Sundown inner page header: mobile menu, Safaris dropdown, announcement rotation. */
(function () {
  'use strict';
  var h = document.getElementById('site-header');
  if (!h) return;

  // Collapse the announcement bar once the visitor scrolls
  function onScroll() { h.classList.toggle('is-scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  var burger = h.querySelector('.sd-burger');
  var mm = document.getElementById('sd-mm');
  function setMenu(open) {
    if (!burger || !mm) return;
    mm.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (burger) burger.addEventListener('click', function () { setMenu(mm.hidden); });
  if (mm) mm.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closeDd(); } });

  // Safaris accordion inside the mobile menu
  var accBtn = h.querySelector('.sd-mm-acc-btn');
  var acc = document.getElementById('sd-mm-acc');
  if (accBtn && acc) accBtn.addEventListener('click', function () {
    var open = acc.hidden;
    acc.hidden = !open;
    accBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Safaris dropdown: opens on hover with a mouse, on tap or Enter otherwise
  var dd = h.querySelector('.sd-dd');
  var ddBtn = h.querySelector('.sd-dd-btn');
  function closeDd() { if (dd) { dd.classList.remove('is-open'); ddBtn.setAttribute('aria-expanded', 'false'); } }
  if (dd && ddBtn) {
    ddBtn.addEventListener('click', function () {
      var open = !dd.classList.contains('is-open');
      dd.classList.toggle('is-open', open);
      ddBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) closeDd(); });
  }

  // Rotate the announcement messages
  var items = h.querySelectorAll('.sd-announce-list li');
  if (items.length > 1) {
    var i = 0, paused = false, bar = h.querySelector('.sd-announce');
    bar.addEventListener('mouseenter', function () { paused = true; });
    bar.addEventListener('mouseleave', function () { paused = false; });
    setInterval(function () {
      if (paused || document.hidden) return;
      items[i].classList.remove('is-active');
      i = (i + 1) % items.length;
      items[i].classList.add('is-active');
    }, 5500);
  }
})();
