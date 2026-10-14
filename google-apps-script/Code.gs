/**
 * Zetavai website: consultation requests -> Google Sheet (+ email alert)
 *
 * Setup (once):
 * 1. Create a Google Sheet, for example "Zetavai website leads".
 * 2. In the Sheet: Extensions > Apps Script. Replace the code with this file. Save.
 * 3. Project Settings (gear icon): set Time zone to (GMT+05:30) India Standard Time.
 * 4. Deploy > New deployment > type "Web app":
 *        Execute as: Me
 *        Who has access: Anyone
 *    Authorise when asked, then copy the Web app URL into Vercel as APPS_SCRIPT_URL.
 * 5. After any code change: Deploy > Manage deployments > Edit > Version: New version.
 *    (The URL stays the same.)
 */

const SHEET_NAME = 'Leads';
const NOTIFY_EMAIL = 'zetavaiofficial@gmail.com'; // set to '' to turn off email alerts

const COLUMNS = [
  ['submitted_at', 'Received'],
  ['name', 'Name'],
  ['company', 'Company'],
  ['email', 'Email'],
  ['phone', 'Mobile'],
  ['business_type', 'Business type'],
  ['message', 'Message'],
  ['consent', 'Consent'],
  ['page', 'Sent from page'],
  ['landing_page', 'First page visited'],
  ['referrer', 'Referrer'],
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_campaign', 'utm_campaign'],
  ['country', 'Country'],
];

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }
  if (!data || !data.email || !data.name) {
    return json_({ ok: false, error: 'missing_fields' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_();
    const row = COLUMNS.map(function (c) {
      if (c[0] === 'submitted_at') return new Date();
      if (c[0] === 'consent') return data.consent ? 'Yes' : 'No';
      return safe_(data[c[0]]);
    });
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: data.email,
        subject: 'New consultation request: ' + data.name + (data.company ? ' (' + data.company + ')' : ''),
        body: [
          'Name: ' + data.name,
          'Company: ' + (data.company || '-'),
          'Email: ' + data.email,
          'Mobile: ' + data.phone,
          'Business: ' + data.business_type,
          '',
          'Message:',
          data.message || '-',
          '',
          'Source: ' + (data.utm_source || data.referrer || 'direct') + ' | first page: ' + (data.landing_page || '-'),
          '',
          'Open the sheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
        ].join('\n'),
      });
    } catch (err) {
      // The row is already saved; a failed email should not fail the request.
      console.error('Notification email failed: ' + err);
    }
  }

  return json_({ ok: true });
}

function doGet() {
  return json_({ ok: true, service: 'zetavai-leads' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(function (c) { return c[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  }
  return sheet;
}

// Stops spreadsheet formula injection (values starting with = + - @ are
// stored as plain text) and keeps phone numbers like +91... intact.
function safe_(value) {
  const s = value == null ? '' : String(value);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
