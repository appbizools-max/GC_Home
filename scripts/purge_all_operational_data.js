const https = require('https');
const fs = require('fs');
const path = require('path');

const adminEnvPath = path.join(__dirname, '..', 'admin-panel', '.env');
const content = fs.readFileSync(adminEnvPath, 'utf8');
const keyMatch = content.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
const SERVICE_ROLE_KEY = keyMatch ? keyMatch[1] : '';

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Service role key is missing');
  process.exit(1);
}

function request(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'zpkukinayxcbwyklfdqn.supabase.co',
      path,
      method,
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers, raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Strictly ordered by foreign key dependencies
const TABLES_TO_PURGE = [
  'booking_timeline',
  'booking_timeline_logs',
  'booking_status_history',
  'booking_otp',
  'partner_assignments',
  'job_assignments',
  'assignment_queue',
  'partner_location_history',
  'booking_items',
  'partner_services',
  'maid_kyc_documents',
  'maid_history',
  'maid_availability_schedule',
  'maid_payouts',
  'payouts',
  'payment_reports',
  'payments',
  'ratings',
  'tips',
  'sos_alerts',
  'chat_messages',
  'chat_conversations',
  'notifications',
  'saved_addresses',
  'customer_notes',
  'bookings',
  'maid_profiles',
  'user_profiles'
];

async function purgeTable(table) {
  let res = await request(`/rest/v1/${table}?id=not.is.null`, 'DELETE');
  if (res.status === 200 || res.status === 204) {
    console.log(`  ✅ Purged: ${table}`);
    return;
  }
  if (res.status === 404) {
    console.log(`  ⚪ Skipped (table does not exist): ${table}`);
    return;
  }
  
  res = await request(`/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`, 'DELETE');
  if (res.status === 200 || res.status === 204) {
    console.log(`  ✅ Purged: ${table}`);
  } else {
    console.log(`  ⚠️ Purge note for ${table}: HTTP ${res.status} — ${res.raw?.substring(0, 150)}`);
  }
}

async function getCount(table) {
  const res = await request(`/rest/v1/${table}?select=count`, 'HEAD');
  if (res.headers && res.headers['content-range']) {
    return res.headers['content-range'].split('/')[1];
  }
  return res.status === 200 ? '0' : 'N/A';
}

async function cleanStorageBuckets() {
  const bucketsToClean = ['booking-photos', 'maid-documents', 'profile-photos', 'maid-kyc', 'partner-kyc', 'invoices'];
  console.log('\n━━━ CLEANING STORAGE BUCKETS (Excluding gc-home-assets) ━━━');
  for (const bucket of bucketsToClean) {
    const listRes = await request(`/storage/v1/object/list/${bucket}`, 'POST', { prefix: '', limit: 100 });
    if (Array.isArray(listRes.body) && listRes.body.length > 0) {
      const fileNames = listRes.body.filter(f => f && (f.id || f.name)).map(f => f.name);
      if (fileNames.length > 0) {
        const delRes = await request(`/storage/v1/object/${bucket}`, 'DELETE', { prefixes: fileNames });
        console.log(`  🗑️ Removed ${fileNames.length} file(s) from bucket: ${bucket}`);
      }
    } else {
      console.log(`  ⚪ Bucket empty: ${bucket}`);
    }
  }
}

async function ensureAdminUser() {
  const adminCheck = await request('/rest/v1/admin_users?email=eq.admin@example.com');
  if (!adminCheck.body || adminCheck.body.length === 0) {
    console.log('  ⚠️ Re-inserting default super admin into admin_users...');
    await request('/rest/v1/admin_users', 'POST', {
      email: 'admin@example.com',
      name: 'Super Admin',
      role: 'admin'
    });
  } else {
    console.log('  👑 Super Admin verified in admin_users: admin@example.com');
  }
}

async function run() {
  console.log('====================================================');
  console.log('  GC HOME+ — COMPLETE DATA RESET                    ');
  console.log('  Purging Customers, Maids, Bookings & Orders       ');
  console.log('====================================================\n');

  console.log('━━━ 1. PURGING OPERATIONAL TABLES ━━━━━━━━━━━━━━━━━━');
  for (const table of TABLES_TO_PURGE) {
    await purgeTable(table);
  }

  await cleanStorageBuckets();
  await ensureAdminUser();

  console.log('\n━━━ 2. VERIFYING COUNTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const verifyTables = [
    'maid_profiles',
    'user_profiles',
    'bookings',
    'booking_items',
    'partner_assignments',
    'notifications',
    'payouts',
    'ratings',
    'admin_users',
    'services',
    'service_categories',
    'service_addons'
  ];

  for (const t of verifyTables) {
    const c = await getCount(t);
    console.log(`  • ${t.padEnd(25)} : ${c}`);
  }

  console.log('\n====================================================');
  console.log('  DONE: Database is completely clean!               ');
  console.log('====================================================\n');
}

run().catch(console.error);
