# Zetavai website: notes for Claude Code

Plain HTML website for www.zetavai.com, hosted on Vercel. No build step and no framework.

## Structure
- `public/` is the website. Every file in it is published as-is.
  - One HTML file per page: `index.html`, `services.html`, `services/manufacturing.html`, `services/professionals.html`, `approach.html`, `about.html`, `contact.html`, `faq.html`, `privacy.html`, `thank-you.html`, `404.html`.
  - URLs have no `.html` and no trailing slash (`/about`, not `/about.html`), set by `cleanUrls` and `trailingSlash` in `vercel.json`. Always link to the clean URL.
  - `assets/css/styles.css`: the only stylesheet. Colours and sizes are CSS variables in `:root`.
  - `assets/js/site.js`: menu, mobile collapsible sections, visit attribution. Loaded on every page.
  - `assets/js/contact.js`: form validation and sending. Loaded only on `contact.html`.
  - `sitemap.xml`, `robots.txt`, `llms.txt`: search engines and AI assistants.
- `api/contact.js`: Vercel serverless function behind the form. Forwards to Google Apps Script using the env var `APPS_SCRIPT_URL` (no shared secret).
- `google-apps-script/Code.gs`: the script attached to the leads Google Sheet. Not deployed by Vercel.
- `dev-server.js`: local preview with `node dev-server.js` (http://localhost:3000). Not used by Vercel.

## Rules when editing
- The header (`<header class="site-header">`) and footer (`<footer class="site-footer">`) are repeated in every HTML file. A change to either must be made in all 11 files.
- Contact email (`zetavaiofficial@gmail.com`) appears in pages, `llms.txt`, the JSON-LD blocks and `google-apps-script/Code.gs`. Search and replace across the repo.
- Each page has in `<head>`: `<title>` (≤ 60 characters), `<meta name="description">` (≤ 160 characters), `canonical`, Open Graph and Twitter tags, and a JSON-LD block. Keep them in sync when changing page content.
- FAQ answers exist twice per page: visible in the `.faq` HTML and in the `FAQPage` JSON-LD. Change both.
- New page: copy an existing page, update the head tags, add it to `sitemap.xml`, link it from the footer or menu, and add it to `llms.txt`.
- Change `<lastmod>` in `sitemap.xml` when a page's content changes.
- Main call to action wording is "Book a consultation" and links to `/contact`. The form button is "Request consultation".
- Style: black, white and greys only; Albert Sans (self-hosted); light-weight headlines; no emoji or icon fonts; mobile-friendly first.
- Never put secrets in `public/`. Secrets live only in Vercel environment variables and Apps Script properties.
