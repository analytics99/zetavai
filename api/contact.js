// Vercel serverless function: POST /api/contact
//
// Receives consultation requests from the form on /contact, checks them,
// and forwards valid ones to a Google Apps Script that writes a row to the
// leads Google Sheet and emails a notification.
//
// Environment variables (Vercel > Project > Settings > Environment Variables):
//   APPS_SCRIPT_URL  The "Web app" URL of the deployed Apps Script (ends in /exec)
//   FORM_SECRET      A long random string, identical to FORM_SECRET in the Apps Script properties

const BUSINESS_TYPES = ['Manufacturing or MSME', 'Professional or small business', 'Other'];
const MIN_FILL_MS = 2500; // a person needs longer than this to fill in the form

function clean(value, max) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return Object.fromEntries(new URLSearchParams(req.body));
  return {};
}

module.exports = async function handler(req, res) {
  const wantsJson = String(req.headers.accept || '').includes('application/json');

  function respond(ok, status, error) {
    res.setHeader('Cache-Control', 'no-store');
    if (wantsJson) {
      res.status(status || 200).json(ok ? { ok: true } : { ok: false, error });
    } else {
      // Form sent without JavaScript: go to the thank-you page or back to the form.
      res.redirect(303, ok ? '/thank-you' : '/contact?error=1');
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method not allowed');
  }

  // Only accept submissions from this website.
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin && host && new URL(origin).host !== host) return respond(false, 403, 'forbidden');

  const form = readBody(req);

  // Spam checks: a hidden field people never fill in, and a minimum fill time.
  // Bots get a normal-looking success so they do not learn to adapt.
  if (clean(form.website, 200)) return respond(true);
  const startedAt = Number(form.started_at);
  if (startedAt && Date.now() - startedAt < MIN_FILL_MS) return respond(true);

  const lead = {
    name: clean(form.name, 120),
    company: clean(form.company, 160),
    email: clean(form.email, 200).toLowerCase(),
    phone: clean(form.phone, 24),
    business_type: clean(form.business_type, 60),
    message: clean(form.message, 3000),
    consent: form.consent === 'yes',
    page: clean(form.page, 200),
    landing_page: clean(form.landing_page, 200),
    referrer: clean(form.referrer, 300),
    utm_source: clean(form.utm_source, 100),
    utm_medium: clean(form.utm_medium, 100),
    utm_campaign: clean(form.utm_campaign, 100),
    country: clean(req.headers['x-vercel-ip-country'], 4),
    submitted_at: new Date().toISOString(),
  };

  const errors = [];
  if (lead.name.length < 2) errors.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) errors.push('email');
  if (!/^\+?[0-9\s\-()]{7,20}$/.test(lead.phone) || lead.phone.replace(/\D/g, '').length < 7) errors.push('phone');
  if (!lead.consent) errors.push('consent');
  if (!BUSINESS_TYPES.includes(lead.business_type)) lead.business_type = 'Other';
  if (errors.length) return respond(false, 422, 'invalid:' + errors.join(','));

  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.FORM_SECRET;
  if (!url || !secret) {
    console.error('[contact] APPS_SCRIPT_URL or FORM_SECRET is not set');
    return respond(false, 500, 'not_configured');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ secret }, lead)),
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || !data.ok) {
      console.error('[contact] Apps Script rejected the request', response.status, data && data.error);
      return respond(false, 502, 'storage_failed');
    }
  } catch (err) {
    console.error('[contact] Could not reach Apps Script', err);
    return respond(false, 502, 'storage_unreachable');
  }

  return respond(true);
};
