require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FRONTEND_VERIFY_BASE = process.env.FRONTEND_VERIFY_BASE || 'http://localhost:5500/My_moon/verify.html';

// In-memory user store (demo only)
const users = []; // { id, email, passwordHash, verified, verificationToken }

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      // Use provided SMTP
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    // Create ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal account created:', testAccount.user);
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  })();

  return transporterPromise;
}

async function sendVerificationEmail(email, token) {
  const transporter = await getTransporter();
  const verifyLink = `${FRONTEND_VERIFY_BASE}?token=${encodeURIComponent(token)}`;

  const message = {
    from: 'no-reply@dentalclinic.local',
    to: email,
    subject: 'Verify your email for Dr. Bensefia Clinic',
    text: `Please verify your email by visiting: ${verifyLink}`,
    html: `<p>Please verify your email by clicking the link below:</p><p><a href="${verifyLink}">Verify Email</a></p><p>If the link does not work, use this token: <strong>${token}</strong></p>`
  };

  const info = await transporter.sendMail(message);
  // If using Ethereal, print preview URL
  if (nodemailer.getTestMessageUrl) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log('Preview URL:', url);
  }
  return info;
}

// Helpers
function findUserByEmail(email) {
  return users.find(u => u.email === (email || '').toLowerCase());
}

// Routes
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ success: false, reason: 'invalid' });
  const existing = findUserByEmail(email);
  if (existing) return res.json({ success: false, reason: 'exists' });

  const token = Math.random().toString(36).slice(2, 10).toUpperCase();
  const user = {
    id: uuidv4(),
    email: email.toLowerCase(),
    passwordHash: Buffer.from(password).toString('base64'),
    verified: false,
    verificationToken: token,
    createdAt: new Date()
  };
  users.push(user);

  try {
    await sendVerificationEmail(user.email, token);
  } catch (err) {
    console.error('Send email error', err);
  }

  return res.json({ success: true, message: 'registered' });
});

app.post('/api/send-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, reason: 'invalid' });
  const user = findUserByEmail(email);
  if (!user) return res.json({ success: false, reason: 'not_found' });
  const token = Math.random().toString(36).slice(2, 10).toUpperCase();
  user.verificationToken = token;
  user.verified = false;
  try {
    await sendVerificationEmail(user.email, token);
    return res.json({ success: true });
  } catch (err) {
    console.error('Send email error', err);
    return res.json({ success: false, reason: 'send_failed' });
  }
});

app.post('/api/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.json({ success: false });
  const user = users.find(u => u.verificationToken === token);
  if (!user) return res.json({ success: false });
  user.verified = true;
  delete user.verificationToken;
  return res.json({ success: true, email: user.email });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ success: false, reason: 'invalid' });
  const user = findUserByEmail(email);
  if (!user) return res.json({ success: false, reason: 'not_found' });
  if (user.passwordHash !== Buffer.from(password).toString('base64')) return res.json({ success: false, reason: 'invalid_credentials' });
  if (!user.verified) return res.json({ success: false, reason: 'not_verified' });

  // Create a simple session token (demo)
  const sessionToken = uuidv4();
  return res.json({ success: true, token: sessionToken, user: { email: user.email } });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
