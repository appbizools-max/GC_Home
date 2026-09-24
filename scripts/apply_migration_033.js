/**
 * GC HOME+ — Apply Migration 033 to Supabase
 * Fixes: storage buckets (gc-home-assets + partner-kyc) and payout trigger
 *
 * Usage: node scripts/apply_migration_033.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
// Using the anon key from config — for storage bucket creation we need service_role
// If you have a service_role key, set it here or in env var SUPABASE_SERVICE_ROLE_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.log('\n========================================================');
  console.log('GC HOME+ Migration 033 — Manual Application Required');
  console.log('========================================================');
  console.log('\nThe SUPABASE_SERVICE_ROLE_KEY is not set in the environment.');
  console.log('To apply migration 033, please follow these steps:\n');
  console.log('1. Open your Supabase Project Dashboard:');
  console.log('   https://supabase.com/dashboard/project/zpkukinayxcbwyklfdqn\n');
  console.log('2. Go to: SQL Editor (left sidebar)\n');
  console.log('3. Click "New Query"\n');
  console.log('4. Paste the contents of this file:');
  console.log('   E:\\Home Clean\\GC_Home\\migrations\\033_fix_storage_bucket_and_payout_trigger.sql\n');
  console.log('5. Click "Run"\n');
  console.log('Expected results after running:');
  console.log('  ✅ gc-home-assets bucket created/updated (public = true)');
  console.log('  ✅ partner-kyc bucket created');
  console.log('  ✅ Storage RLS policies applied');
  console.log('  ✅ fn_auto_create_payout_on_completion() function created');
  console.log('  ✅ trg_auto_payout_on_completion trigger created on bookings');
  console.log('\nVerification queries to run after:');
  console.log("  SELECT id, name, public FROM storage.buckets WHERE id IN ('gc-home-assets', 'partner-kyc');");
  console.log("  SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'bookings' AND trigger_name = 'trg_auto_payout_on_completion';");
  console.log('');
  process.exit(0);
}

// If service role key is present, attempt programmatic migration
const migrationPath = path.join(__dirname, '..', 'migrations', '033_fix_storage_bucket_and_payout_trigger.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
const apiUrl = `/rest/v1/rpc/exec_sql`;

const body = JSON.stringify({ query: sql });
const options = {
  hostname: `${projectRef}.supabase.co`,
  path: apiUrl,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration 033 applied successfully.');
    } else {
      console.log(`Status: ${res.statusCode}`);
      console.log('Response:', data);
      console.log('\nPlease apply the migration manually via Supabase Dashboard > SQL Editor.');
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  console.log('Please apply migration 033 manually via Supabase Dashboard > SQL Editor.');
});

req.write(body);
req.end();
