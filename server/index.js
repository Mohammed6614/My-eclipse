require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FRONTEND_VERIFY_BASE = process.env.FRONTEND_VERIFY_BASE || 'http://localhost:5500/My_moon/verify.html';
const DB_PATH = path.join(__dirname, 'data.json');

function ensureDB() { if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], bookings: [] }, null, 2)); }
function loadDB() { ensureDB(); try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8') || '{}'); } catch (e) { console.error('read db', e); return { users: [], bookings: [] }; } }
function saveDB(db) { try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); } catch (e) { console.error('save db', e); } }

let transporterPromise = null;
async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      const options = { host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587', 10), secure: process.env.SMTP_SECURE === 'true' };
      if (process.env.SMTP_USER) options.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
      return nodemailer.createTransport(options);
    }
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal account created:', testAccount.user);
    return nodemailer.createTransport({ host: testAccount.smtp.host, port: testAccount.smtp.port, secure: testAccount.smtp.secure, auth: { user: testAccount.user, pass: testAccount.pass } });
  })();
  return transporterPromise;
}

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, reason: 'invalid' });
  const db = loadDB();
  if (db.users.find(u => u.email === email.toLowerCase())) return res.status(400).json({ success: false, reason: 'exists' });
  const hash = await bcrypt.hash(password, 10);
  const verificationToken = Math.random().toString(36).slice(2, 10).toUpperCase();
  const user = { id: uuidv4(), email: email.toLowerCase(), passwordHash: hash, verified: false, verificationToken };
  db.users.push(user); saveDB(db);
  (async () => {
    try {
      const transporter = await getTransporter();
      const verifyUrl = `${FRONTEND_VERIFY_BASE}?email=${encodeURIComponent(user.email)}&token=${verificationToken}`;
      const info = await transporter.sendMail({ from: 'no-reply@dentalclinic.local', to: user.email, subject: 'Verify your email', text: `Please verify: ${verifyUrl}`, html: `<p>Please verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>` });
      if (nodemailer.getTestMessageUrl) console.log('Verification preview URL:', nodemailer.getTestMessageUrl(info));
    } catch (e) { console.error('email error', e); }
  })();
  return res.json({ success: true, message: 'registered' });
});

app.post('/api/verify', (req, res) => {
  const { email, token } = req.body || {};
  if (!email || !token) return res.status(400).json({ success: false, reason: 'invalid' });
  const db = loadDB(); const user = db.users.find(u => u.email === email.toLowerCase()); if (!user) return res.status(404).json({ success: false, reason: 'not_found' }); if (user.verificationToken === token) { user.verified = true; user.verificationToken = null; saveDB(db); return res.json({ success: true, email: user.email }); } return res.status(400).json({ success: false, reason: 'invalid_token' });
});

app.post('/api/bookings', (req, res) => {
  const { name, email, service, date, notes } = req.body || {};
  if (!name || !email || !service) return res.status(400).json({ success: false, reason: 'invalid' });
  const db = loadDB(); const booking = { id: uuidv4(), name, email: email.toLowerCase(), service, date: date || null, notes: notes || '', createdAt: new Date().toISOString() };
  db.bookings.push(booking); saveDB(db);
  (async () => {
    let previewUrl = null; let adminPreviewUrl = null;
    try {
      const transporter = await getTransporter();
      const subject = `Booking Confirmed — ${service}`;
      const text = `Hello ${name}\n\nYour booking for ${service} has been received. Appointment date: ${date || 'To be scheduled'}.\nBooking ID: ${booking.id}\n\nThank you,\nDr. Bensefia Clinic`;
      const html = `<p>${text.replace(/\n/g,'<br/>')}</p>`;
      const info = await transporter.sendMail({ from: 'no-reply@dentalclinic.local', to: booking.email, subject, text, html });
      if (nodemailer.getTestMessageUrl) previewUrl = nodemailer.getTestMessageUrl(info);
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@drbensefia.nl';
        const mapLink = encodeURI('https://www.google.com/maps/search/?api=1&query=Dr+Bensefia+Dental+Clinic+Amsterdam');
        let ics = null;
        if (date) {
          const timeStr = (req.body.time || '').toString().trim();
          const tz = (req.body.timezone || 'UTC').toString().trim();
          const uid = booking.id;
          const dtstamp = new Date().toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
          if (timeStr) {
            const datePart = (date || '').slice(0,10).replace(/-/g,'');
            const [hh, mm] = (timeStr.split(':').concat(['00'])).slice(0,2);
            const pad = s => s.toString().padStart(2,'0');
            const dtStartLocal = `${datePart}T${pad(hh)}${pad(mm)}00`;
            let endH = parseInt(hh || '0', 10); let endM = parseInt(mm || '0', 10) + 60; endH += Math.floor(endM/60); endM = endM%60; endH = endH%24;
            const dtEndLocal = `${datePart}T${pad(endH)}${pad(endM)}00`;
            ics = `BEGIN:VCALENDAR\\r\\nVERSION:2.0\\r\\nPRODID:-//DrBensefiaClinic//EN\\r\\nBEGIN:VEVENT\\r\\nUID:${uid}\\r\\nDTSTAMP:${dtstamp}\\r\\nDTSTART;TZID=${tz}:${dtStartLocal}\\r\\nDTEND;TZID=${tz}:${dtEndLocal}\\r\\nSUMMARY:Appointment - ${service}\\r\\nDESCRIPTION:Booking ID:${booking.id}\\\\nPatient:${name}\\\\nNotes:${(notes||'')}\\\\nTimezone:${tz}\\r\\nEND:VEVENT\\r\\nEND:VCALENDAR`;
          } else {
            const dt = (date || '').split('T')[0]; const dtStart = dt.replace(/-/g,''); const year = parseInt(dt.substr(0,4),10); const month = parseInt(dt.substr(5,2),10); const day = parseInt(dt.substr(8,2),10); const next = new Date(Date.UTC(year, month-1, day+1)); const dtEnd = next.toISOString().slice(0,10).replace(/-/g,''); const dtstamp = new Date().toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'; ics = `BEGIN:VCALENDAR\\r\\nVERSION:2.0\\r\\nPRODID:-//DrBensefiaClinic//EN\\r\\nBEGIN:VEVENT\\r\\nUID:${booking.id}\\r\\nDTSTAMP:${dtstamp}\\r\\nDTSTART;VALUE=DATE:${dtStart}\\r\\nDTEND;VALUE=DATE:${dtEnd}\\r\\nSUMMARY:Appointment - ${service}\\r\\nDESCRIPTION:Booking ID:${booking.id}\\\\nPatient:${name}\\\\nNotes:${(notes||'')}\\r\\nEND:VEVENT\\r\\nEND:VCALENDAR`;
          }
        }
        const adminHtml = `<p>New booking received:</p><ul><li><strong>Patient:</strong> ${name}</li><li><strong>Email:</strong> ${booking.email}</li><li><strong>Service:</strong> ${service}</li><li><strong>Date:</strong> ${date||'To be scheduled'}</li><li><strong>Notes:</strong> ${notes||''}</li></ul><p><a href="${mapLink}">Open clinic on map</a></p>`;
        const adminMsg = { from: 'no-reply@dentalclinic.local', to: adminEmail, subject: `New Booking: ${service} — ${name}`, text: `New booking: ${service} - ${name} (ID: ${booking.id})\nDate: ${date||'To be scheduled'}\nEmail: ${booking.email}\nNotes: ${notes||''}\nMap: ${mapLink}`, html: adminHtml, attachments: [] };
        if (ics) adminMsg.attachments.push({ filename: `${booking.id}.ics`, content: ics, contentType: 'text/calendar' });
        const adminInfo = await transporter.sendMail(adminMsg);
        if (nodemailer.getTestMessageUrl) adminPreviewUrl = nodemailer.getTestMessageUrl(adminInfo);
      } catch (err) { console.error('Error sending admin booking email', err); }
    } catch (err) { console.error('Error sending booking confirmation email', err); }
    try { const db2 = loadDB(); const b = db2.bookings.find(bb => bb.id === booking.id); if (b) { if (previewUrl) b.previewUrl = previewUrl; if (adminPreviewUrl) b.adminPreviewUrl = adminPreviewUrl; saveDB(db2); } } catch (err) { console.error('Error persisting preview URLs', err); }
  })();
  return res.json({ success: true, booking });
});

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
