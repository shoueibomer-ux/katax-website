require('dotenv').config();
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const contactRouter = require('./routes/contact');
const contentRouter = require('./routes/content');
const adminRouter = require('./routes/admin');
const { getSupabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Serve the static site
app.use(express.static(FRONTEND_DIR, { extensions: ['html'] }));

// Basic protection against contact-form abuse: 5 submissions / 15 min / IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent from this connection. Please try again later or call us.' }
});

// Slow down brute-forcing the admin password: 10 attempts / 15 min / IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});

app.use('/api/contact', contactLimiter, contactRouter);
app.use('/api/content', contentRouter);
app.use('/api/admin/login', loginLimiter);
app.use('/api/admin', adminRouter);
app.get('/api/posts', async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (e) {
    console.error('Failed to load public posts:', e.message);
    res.status(500).json({ error: 'Could not load posts.' });
  }
});


app.get('/api/health', (req, res) => res.json({ ok: true }));

// Fallback to index.html for unmatched routes (keeps things simple for a static multi-page site)
app.use((req, res) => {
  res.status(404).sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`KATAX site running at http://localhost:${PORT}`);
});
