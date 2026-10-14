/* Zetavai website: consultation form on /contact.
   Checks the fields, sends the request to /api/contact, records the
   conversion in Vercel Analytics and moves the visitor to /thank-you.
   Without JavaScript the form still posts normally. */

(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (!form || !status) return;

  var BUTTON_LABEL = 'Request consultation';
  var email = form.getAttribute('data-email');

  // Shown when a request sent without JavaScript could not be delivered (/contact?error=1).
  if (new URLSearchParams(location.search).has('error')) {
    status.textContent = 'Your request could not be sent. Please try again, or email us at ' + email + '.';
  }

  function set(name, value) {
    var el = form.elements.namedItem(name);
    if (el) el.value = value;
  }

  // Hidden fields: when the form was opened, which page, and where the visitor came from.
  set('started_at', String(Date.now()));
  set('page', location.pathname);
  try {
    var a = JSON.parse(sessionStorage.getItem('zv_attribution') || '{}');
    ['landing_page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
      set(k, a[k] || '');
    });
  } catch (e) {
    /* attribution is optional */
  }

  var checks = {
    name: function (el) {
      return el.value.trim().length >= 2;
    },
    email: function (el) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
    },
    phone: function (el) {
      return /^\+?[0-9\s\-()]{7,20}$/.test(el.value.trim()) && el.value.replace(/\D/g, '').length >= 7;
    },
    consent: function (el) {
      return el.checked;
    },
  };

  function validate(name) {
    var el = form.elements.namedItem(name);
    var ok = checks[name](el);
    var field = el.closest('.field');
    if (field) field.classList.toggle('has-error', !ok);
    el.setAttribute('aria-invalid', String(!ok));
    if (!ok) el.setAttribute('aria-describedby', 'f-' + name + '-error');
    else el.removeAttribute('aria-describedby');
    return ok;
  }

  Object.keys(checks).forEach(function (name) {
    var el = form.elements.namedItem(name);
    // Clear an error while the visitor types, so nothing shifts when they move on.
    el.addEventListener('input', function () {
      var field = el.closest('.field');
      if (field && field.classList.contains('has-error') && checks[name](el)) validate(name);
    });
    // Flag a problem when leaving a filled-in field.
    el.addEventListener('blur', function () {
      if (el.type !== 'checkbox' && el.value && !checks[name](el)) validate(name);
    });
    el.addEventListener('change', function () {
      var field = el.closest('.field');
      if (field && field.classList.contains('has-error')) validate(name);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';

    var allValid = Object.keys(checks).map(validate).indexOf(false) === -1;
    if (!allValid) {
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending…';

    var data = new FormData(form);
    fetch(form.action, {
      method: 'POST',
      body: new URLSearchParams(data),
      headers: { Accept: 'application/json' },
    })
      .then(function (res) {
        return res.json().catch(function () {
          return {};
        }).then(function (body) {
          if (!res.ok || !body.ok) throw new Error(body.error || 'failed');
        });
      })
      .then(function () {
        // Conversion event in Vercel Web Analytics (custom events may need a paid plan).
        try {
          if (window.va) window.va('event', { name: 'Consultation requested', data: { business_type: String(data.get('business_type') || '') } });
        } catch (err) {
          /* analytics is optional */
        }
        window.location.href = '/thank-you';
      })
      .catch(function () {
        status.textContent = 'Your request could not be sent. Please try again, or email us at ' + email + '.';
        button.disabled = false;
        button.textContent = BUTTON_LABEL;
      });
  });
})();
