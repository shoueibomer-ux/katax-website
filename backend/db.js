const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let client = null;

function getSupabase() {
  if (client) return client;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY in backend/.env — see README.md for setup steps.'
    );
  }
  client = createClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}

module.exports = { getSupabase };
