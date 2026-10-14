// Local preview of the website, including the consultation form.
// No installs needed. Requires Node.js 18 or newer.
//
//   node dev-server.js          then open http://localhost:3000
//
// The form needs APPS_SCRIPT_URL. Put it in a .env file
// (copy .env.example) to send test requests to your real Google Sheet.
// This file is only for previewing; Vercel does not use it.

const http = require('http');
const fs = require('fs');
const path = require('path');
const handler = require('./api/contact.js');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};

// Load .env if present
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
} catch (e) {}

function sendFile(res, file, status = 200) {
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/contact') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      req.body = Object.fromEntries(new URLSearchParams(raw));
      res.status = (code) => ((res.statusCode = code), res);
      res.json = (obj) => (res.setHeader('Content-Type', 'application/json'), res.end(JSON.stringify(obj)));
      res.send = (text) => res.end(text);
      res.redirect = (code, to) => (res.writeHead(code, { Location: to }), res.end());
      handler(req, res);
    });
    return;
  }

  // Clean URLs: /about -> public/about.html, / -> public/index.html
  const clean = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/index';
  const candidates = [path.join(ROOT, clean), path.join(ROOT, clean + '.html')];
  const file = candidates.find((f) => f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isFile());
  if (file) return sendFile(res, file);
  sendFile(res, path.join(ROOT, '404.html'), 404);
}).listen(PORT, () => console.log(`Zetavai preview: http://localhost:${PORT}`));
