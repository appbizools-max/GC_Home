import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tablesToTest = [
  'services',
  'bookings',
  'maid_profiles',
  'user_profiles',
  'saved_addresses',
  'ratings',
  'notifications',
  'platform_settings',
  'payments',
  'job_assignments',
  'service_categories',
  'service_addons',
  'payouts',
  'booking_timeline',
  'audit_logs',
  'app_config',
  'addresses',
  'transactions',
  'profiles'
];

async function runAudit() {
  console.log('=== STARTING SUPABASE LIVE AUDIT ===');
  const results = {};

  for (const table of tablesToTest) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);

      if (error) {
        results[table] = { status: 'ERROR', error: error.message, code: error.code };
      } else {
        results[table] = {
          status: 'SUCCESS',
          count: count ?? data?.length,
          sampleCols: data && data.length > 0 ? Object.keys(data[0]) : 'empty'
        };
      }
    } catch (err) {
      results[table] = { status: 'EXCEPTION', error: err.message };
    }
  }

  console.log(JSON.stringify(results, null, 2));

  // Test RPC functions
  console.log('\n=== TESTING RPC FUNCTIONS ===');
  const rpcs = [
    'get_operational_dashboard_stats',
    'get_admin_dashboard_metrics',
    'assign_maid_to_booking',
    'accept_job_assignment',
    'reject_job_assignment',
    'start_service_with_otp',
    'complete_service_and_settle',
    'submit_maid_kyc'
  ];

  for (const rpcName of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpcName, {});
      console.log(`RPC ${rpcName}: ${error ? `ERROR (${error.code}: ${error.message})` : 'EXISTS & RETURNED DATA'}`);
    } catch (e) {
      console.log(`RPC ${rpcName}: EXCEPTION (${e.message})`);
    }
  }

  // Test Storage Buckets
  console.log('\n=== TESTING STORAGE BUCKETS ===');
  try {
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
      console.log('Storage buckets list error:', bErr.message);
    } else {
      console.log('Storage Buckets:', buckets.map(b => ({ name: b.name, public: b.public })));
    }
  } catch (e) {
    console.log('Storage exception:', e.message);
  }

  // Test Auth methods
  console.log('\n=== TESTING AUTH SESSION ===');
  try {
    const { data: sessionData, error: sErr } = await supabase.auth.getSession();
    console.log('GetSession result:', sessionData ? 'OK' : 'NULL', sErr ? sErr.message : 'No error');
  } catch (e) {
    console.log('Auth exception:', e.message);
  }
}

runAudit();
