const express = require('express');
const { getSupabase } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
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

module.exports = router;
