const express = require('express');
const { getSupabase } = require('../db');
const router = express.Router();

// Lazily require nodemailer so the server still runs if email isn't configured
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch (e) { /* optional */ }

function getTransport() {
  if (!nodemailer) return null;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const service = String(body.service || '').trim();
  const message = String(body.message || '').trim();
  const honeypot = String(body.company_website || '').trim();

  // Spam trap: bots fill hidden fields. Pretend success, do nothing further.
  if (honeypot) {
    return res.status(200).json({ ok: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return res.status(400).json({ error: 'One of the fields is too long.' });
  }

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name, email, phone, service, message,
    received_at: new Date().toISOString(),
    ip: req.ip
  };

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('contacts').insert([entry]);
    if (error) throw error;
  } catch (e) {
    console.error('Failed to save submission:', e.message);
    return res.status(500).json({ error: 'Could not save your message. Please call us instead.' });
  }

  // Best-effort email notification — never fails the request if it errors
  const transport = getTransport();
  if (transport) {
    const to = process.env.CONTACT_TO || 'info@katax.ca';
    transport.sendMail({
      from: process.env.SMTP_USER,
      to,
      replyTo: email,
      subject: `New website enquiry — ${name}`,
      text:
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'n/a'}\nService: ${service || 'n/a'}\n\n${message}`
    }).catch((e) => console.error('Email notification failed (submission was still saved):', e.message));
  }

  return res.status(200).json({ ok: true });
});

module.exports = router;
