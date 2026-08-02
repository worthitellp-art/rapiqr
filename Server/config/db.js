const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://flddzslryxphugbkktkr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  // No silent fallback to the anon key: that key is RLS-restricted and would make
  // admin writes fail unpredictably while looking like they succeeded (see task.md #9).
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in Server/.env — refusing to start with the anon key as a stand-in.');
}

// Server-side Supabase client with admin privileges
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = {
  supabaseAdmin,
  supabaseUrl
};
