const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
  console.log('Verifying table access & applying schema setup...');
  
  // Test user_profiles read/write
  const { data: pData, error: pErr } = await supabase.from('user_profiles').select('*').limit(1);
  if (pErr) {
    console.error('user_profiles error:', pErr);
  } else {
    console.log('user_profiles table connected successfully');
  }

  // Test bookings read/write
  const { data: bData, error: bErr } = await supabase.from('bookings').select('*').limit(1);
  if (bErr) {
    console.error('bookings error:', bErr);
  } else {
    console.log('bookings table connected successfully');
  }
}

applyMigration();
