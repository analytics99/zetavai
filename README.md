# Zetavai website

The www.zetavai.com website: plain HTML, CSS and JavaScript, hosted on [Vercel](https://vercel.com). No build step, no framework. Open any file, change it, push, and it's live.

- 9 public pages with real URLs, plus a thank-you page and a 404 page
- Consultation form that saves every request to a Google Sheet and emails you
- SEO and AEO: titles, descriptions, canonical URLs, share previews, structured data (JSON-LD), `sitemap.xml`, `robots.txt`, `llms.txt`
- Vercel Web Analytics and Speed Insights (no cookies, no cookie banner)
- Security headers, a self-hosted font (no Google Fonts requests), compressed images

## Folder layout

```
public/                     The website (everything here is published)
  index.html                Home
  services.html             Services overview
  services/manufacturing.html
  services/professionals.html
  approach.html  about.html  contact.html  faq.html  privacy.html
  thank-you.html  404.html
  assets/css/styles.css     All styling
  assets/js/site.js         Menu, mobile sections, visit attribution
  assets/js/contact.js      Form checks and sending
  assets/fonts/  assets/images/team/
  sitemap.xml  robots.txt  llms.txt  og-image.png  favicons
api/contact.js              Form backend (Vercel serverless function)
google-apps-script/Code.gs  Script for the leads Google Sheet
dev-server.js               Local preview (node dev-server.js)
vercel.json                 Clean URLs, redirects, security headers
CLAUDE.md                   Editing rules for Claude Code
```

## Preview on your computer
Requires Node.js 18 or newer. No installs.
```bash
node dev-server.js        # open http://localhost:3000
```
To test the form against your real Google Sheet, copy `.env.example` to `.env` and fill in both values first.

---

## Go live: step by step

You need a GitHub account, a Vercel account (sign in with GitHub) and the Google account that should own the leads sheet.

### 1. Put the code on GitHub
Create a **private** repository, for example `zetavai-website`, and push this folder:
```bash
git init
git add .
git commit -m "Zetavai website"
git branch -M main
git remote add origin https://github.com/<your-account>/zetavai-website.git
git push -u origin main
```

### 2. Create the leads Google Sheet
1. Create a Google Sheet named **Zetavai website leads**.
2. **Extensions > Apps Script**: delete the sample code, paste in `google-apps-script/Code.gs`, click **Save**.
3. **Project Settings** (gear icon):
   - **Time zone**: *(GMT+05:30) India Standard Time*
   - **Script properties**:
     - `FORM_SECRET`: a long random password (30+ characters). Vercel needs the same value.
     - `NOTIFY_EMAIL`: `zetavaiofficial@gmail.com`
4. **Deploy > New deployment**, type **Web app**: Execute as **Me**, Who has access **Anyone**.
5. Click **Deploy**, allow the permissions, and copy the **Web app URL** (ends in `/exec`).

A **Leads** tab with headers is created on the first request.

### 3. Deploy on Vercel
1. **Add New > Project**, import the GitHub repository.
2. Framework preset: **Other**. Build command: leave empty. Output directory: `public` (already set in `vercel.json`).
3. **Environment Variables**:
   - `APPS_SCRIPT_URL`: the Web app URL from step 2
   - `FORM_SECRET`: the same value as in the Apps Script
4. **Deploy**. Test the form on the `.vercel.app` preview address: a row should appear in the sheet and an email should arrive.

### 4. Turn on analytics
In the Vercel project, enable **Analytics** and **Speed Insights**. The scripts are already in every page.

### 5. Switch zetavai.com to the new site
See "Switching from the current live site" below first. Then in **Settings > Domains** add `www.zetavai.com` and `zetavai.com` (redirecting to `www`), and update the DNS records at your domain registrar as Vercel shows. HTTPS is automatic.

### 6. Tell search engines
1. **Google Search Console**: add the *Domain* property `zetavai.com`, verify with the DNS record, then submit `https://www.zetavai.com/sitemap.xml` under **Sitemaps**.
2. **Bing Webmaster Tools**: import from Search Console. Bing also feeds several AI assistants.
3. **Google Business Profile**: create one for Zetavai in Pune with the same name, website and email.

### 7. Check after launch
- https://securityheaders.com: test `https://www.zetavai.com`; the headers from `vercel.json` should appear.
- https://search.google.com/test/rich-results: confirm the organisation and FAQ data are read.
- Share the home page link on WhatsApp or LinkedIn to see the preview image.

---

## Switching from the current live site

- **If the current site is already on Vercel:** connect this repository to the same Vercel project (Settings > Git) or replace the old repository's files with these. The domain and its settings stay as they are.
- **If it is hosted elsewhere:** deploy the new project first, test it on the `.vercel.app` address, then move the domain.
- Keep the address exactly `https://www.zetavai.com` (with `www`), as today.
- The old site only had one page (`/`), with sections reached through `#who`, `#services` and similar. Those links still open the new home page, so nothing breaks.

---

## Making changes

| What | Where |
|---|---|
| Page text | the page's `.html` file in `public/` |
| Header menu or footer | every `.html` file (they are repeated; see `CLAUDE.md`) |
| Colours, spacing, font sizes | `public/assets/css/styles.css` (variables at the top) |
| Email address | search and replace across the repository |
| Team photos | `public/assets/images/team/` (same file names, WebP) |
| Search snippet of a page | `<title>` and `<meta name="description">` in that page |
| New page | copy a page, update its head tags, add it to `sitemap.xml` and `llms.txt` |

**WhatsApp:** add a row to the contact list in `contact.html`, for example
`<div><dt>WhatsApp</dt><dd><a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener">Chat with us</a></dd></div>`

**Calendar booking:** add the booking link to `thank-you.html`, so people can pick a time right after sending the form.

**Campaign links:** add `utm_` tags to links you share, so the sheet shows which channel each lead came from:
`https://www.zetavai.com/?utm_source=linkedin&utm_medium=social&utm_campaign=launch`

---

## How the form works

1. On `/contact`, `contact.js` checks the fields and shows clear messages.
2. The form posts to `/api/contact` (`api/contact.js`), which:
   - accepts requests only from this website
   - silently drops spam: a hidden field bots fill in, and submissions faster than a person could type
   - validates name, email, mobile number and consent
   - records where the visitor came from: first page, referrer, `utm_` tags, country
   - forwards the request to the Apps Script with the shared `FORM_SECRET`
3. The Apps Script adds a row to **Leads** and emails `NOTIFY_EMAIL`. Values starting with `=`, `+`, `-` or `@` are stored as text, so +91 numbers stay intact and spreadsheet formulas can't be injected.
4. The visitor lands on `/thank-you`. Vercel Analytics records the custom event **Consultation requested** (custom events may need a paid Vercel plan; thank-you page views count on every plan).

The form also works without JavaScript.

---

## Before launch: please review

- **Privacy policy** (`privacy.html`): a draft. Have it checked by a qualified professional, including the 24-month retention period and whether you need an Impressum for German clients.
- **FAQ answers** (`faq.html`, `services/manufacturing.html`, `services/professionals.html`): check every answer matches how you work and price. Each answer appears twice per page, in the visible FAQ and in the JSON-LD block; change both.
- **Team photos:** Pranav's and Pravin's are small originals. Studio photos at 1500px or more, like Jay's, will look sharper.
