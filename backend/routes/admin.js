const express = require('express');
const crypto = require('crypto');
const { getSupabase } = require('../db');
const router = express.Router();

// In-memory session store: token -> expiry timestamp.
// Simple by design — this is a single-admin site, not a multi-user system.
// Tokens are lost on server restart, which just means logging in again.
const sessions = new Map();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function issueToken() {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function requireAuth(req, res, next) {
  const auth = req.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const expiry = token && sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Not authenticated. Please log in again.' });
  }
  next();
}

// Clean up expired sessions periodically so the Map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of sessions) {
    if (expiry < now) sessions.delete(token);
  }
}, 60 * 60 * 1000).unref();

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({
      error: 'Admin panel is not configured yet. Set ADMIN_PASSWORD in the server .env file.'
    });
  }
  if (typeof password !== 'string' || password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = issueToken();
  res.json({ token, expiresInDays: 30 });
});

router.post('/logout', requireAuth, (req, res) => {
  const auth = req.get('Authorization') || '';
  const token = auth.slice(7);
  sessions.delete(token);
  res.json({ ok: true });
});

// ---- Messages (contact form submissions) ----

router.get('/messages', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('received_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('Failed to read messages:', e.message);
    res.status(500).json({ error: 'Could not load messages.' });
  }
});

router.delete('/messages/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('contacts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete message:', e.message);
    res.status(500).json({ error: 'Could not delete message.' });
  }
});

// ---- Site content ----

router.get('/content', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('site_content')
      .select('data')
      .eq('id', 1)
      .single();
    if (error) throw error;
    res.json(data.data);
  } catch (e) {
    console.error('Failed to read site content:', e.message);
    res.status(500).json({ error: 'Could not load site content.' });
  }
});

function isValidContent(body) {
  if (!body || typeof body !== 'object') return false;
  const { hero, contact, services } = body;
  if (!hero || typeof hero.headline !== 'string' || typeof hero.subtext !== 'string') return false;
  if (!contact || typeof contact.phone !== 'string' || typeof contact.email !== 'string') return false;
  if (!Array.isArray(services) || services.length === 0) return false;
  return services.every((s) => typeof s.code === 'string' && typeof s.title === 'string' && typeof s.description === 'string');
}

router.put('/content', requireAuth, async (req, res) => {
  if (!isValidContent(req.body)) {
    return res.status(400).json({ error: 'Content is missing required fields — check hero, contact, and services.' });
  }
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('site_content')
      .upsert({ id: 1, data: req.body });
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to save site content:', e.message);
    res.status(500).json({ error: 'Could not save site content.' });
  }
});

// ---- Client database ----

const CLIENT_STATUSES = ['Lead', 'Active', 'Completed', 'On Hold'];

router.get('/clients', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('Failed to read clients:', e.message);
    res.status(500).json({ error: 'Could not load clients.' });
  }
});

function isValidClient(body) {
  if (!body || typeof body !== 'object') return false;
  if (typeof body.name !== 'string' || !body.name.trim()) return false;
  if (body.status && !CLIENT_STATUSES.includes(body.status)) return false;
  return true;
}

router.post('/clients', requireAuth, async (req, res) => {
  if (!isValidClient(req.body)) {
    return res.status(400).json({ error: 'A client needs at least a name, and status must be one of: ' + CLIENT_STATUSES.join(', ') });
  }
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: req.body.name.trim(),
    phone: (req.body.phone || '').trim(),
    email: (req.body.email || '').trim(),
    service: (req.body.service || '').trim(),
    status: req.body.status || 'Lead',
    notes: (req.body.notes || '').trim(),
    created_at: new Date().toISOString()
  };
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('clients').insert([entry]);
    if (error) throw error;
    res.status(201).json(entry);
  } catch (e) {
    console.error('Failed to add client:', e.message);
    res.status(500).json({ error: 'Could not save the new client.' });
  }
});

router.put('/clients/:id', requireAuth, async (req, res) => {
  if (!isValidClient(req.body)) {
    return res.status(400).json({ error: 'A client needs at least a name, and status must be one of: ' + CLIENT_STATUSES.join(', ') });
  }
  const updates = {
    name: req.body.name.trim(),
    phone: (req.body.phone || '').trim(),
    email: (req.body.email || '').trim(),
    service: (req.body.service || '').trim(),
    status: req.body.status || 'Lead',
    notes: (req.body.notes || '').trim(),
    updated_at: new Date().toISOString()
  };
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Client not found.' });
    res.json(data[0]);
  } catch (e) {
    console.error('Failed to update client:', e.message);
    res.status(500).json({ error: 'Could not update the client.' });
  }
});

router.delete('/clients/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('clients').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete client:', e.message);
    res.status(500).json({ error: 'Could not delete the client.' });
  }
});

module.exports = router;
