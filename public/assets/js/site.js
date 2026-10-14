/* Zetavai website: behaviour shared by every page.
   - Mobile menu (open/close, Escape key)
   - Sections that are open on desktop and collapsed on phones
   - Remembering where a visitor came from, for the consultation form */

(function () {
  'use strict';

  /* Mobile menu */
  var toggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* Sections marked data-fold: open on larger screens, collapsed on phones */
  var folds = document.querySelectorAll('details[data-fold]');
  if (folds.length) {
    var mobile = window.matchMedia('(max-width: 820px)');
    var sync = function () {
      folds.forEach(function (d) {
        d.open = !mobile.matches;
      });
    };
    folds.forEach(function (d) {
      var summary = d.querySelector('summary');
      if (summary) {
        summary.addEventListener('click', function (e) {
          if (!mobile.matches) e.preventDefault();
        });
      }
    });
    if (mobile.addEventListener) mobile.addEventListener('change', sync);
    else mobile.addListener(sync);
    sync();
  }

  /* Remember where the visitor first came from (campaign link, referrer),
     so a consultation request can be credited to the right channel. */
  try {
    var KEY = 'zv_attribution';
    if (!sessionStorage.getItem(KEY)) {
      var params = new URLSearchParams(location.search);
      var ref = document.referrer && document.referrer.indexOf(location.origin) !== 0 ? document.referrer : '';
      sessionStorage.setItem(
        KEY,
        JSON.stringify({
          landing_page: location.pathname,
          referrer: ref,
          utm_source: params.get('utm_source') || '',
          utm_medium: params.get('utm_medium') || '',
          utm_campaign: params.get('utm_campaign') || '',
        })
      );
    }
  } catch (e) {
    /* storage unavailable: attribution is optional */
  }
})();
