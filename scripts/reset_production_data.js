/**
 * GC HOME+ — Fresh Production Data Reset
 * Purges all operational data (customers, maids, bookings, payouts, addresses)
 * Strictly preserves: Services, Service Categories, Service Add-ons, Service Areas, Settings, Banners
 *
 * Usage: node scripts/reset_production_data.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
let SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  try {
    const adminEnvPath = path.join(__dirname, '..', 'admin-panel', '.env');
    if (fs.existsSync(adminEnvPath)) {
      const content = fs.readFileSync(adminEnvPath, 'utf8');
      const match = content.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
      if (match) SERVICE_ROLE_KEY = match[1];
    }
  } catch {}
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Service role key is required for data reset.');
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

// Ordered strictly by child-table dependencies
const PURGE_ORDER = [
  'booking_timeline',
  'booking_items',
  'partner_assignments',
  'booking_otp',
  'ratings',
  'payouts',
  'payment_reports',
  'chat_messages',
  'chat_conversations',
  'notifications',
  'saved_addresses',
  'bookings',
  'partner_services',
  'maid_kyc_documents',
  'maid_profiles',
  'user_profiles',
];

async function purgeTable(table) {
  // PostgREST delete all rows matching id not equal to a dummy nil uuid
  const res = await request(`/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`, 'DELETE');
  if (res.status === 200 || res.status === 204) {
    console.log(`  ✅ Purged: ${table}`);
  } else if (res.status === 404) {
    console.log(`  ⚪ Skipped (table does not exist): ${table}`);
  } else {
    // If table uses non-uuid id or has no 0000.. constraint, try deleting where id is not null
    const retry = await request(`/rest/v1/${table}?id=not.is.null`, 'DELETE');
    if (retry.status === 200 || retry.status === 204) {
      console.log(`  ✅ Purged: ${table}`);
    } else {
      console.log(`  ⚠️ Purge note for ${table}: HTTP ${res.status} — ${res.raw?.substring(0, 100)}`);
    }
  }
}

async function getCount(table) {
  const res = await request(`/rest/v1/${table}?select=id&limit=1`, 'GET');
  const countStr = res.headers?.['content-range'] ? res.headers['content-range'].split('/')[1] : '0';
  return parseInt(countStr, 10) || 0;
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       GC HOME+ — PRODUCTION DATA RESET                   ║');
  console.log('║       Purging all user/booking data (Catalog Intact)     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('━━━ 1. PURGING TRANSACTIONAL & USER DATA ━━━━━━━━━━━━━━━━━');
  for (const table of PURGE_ORDER) {
    await purgeTable(table);
  }

  console.log('\n━━━ 2. VERIFYING RESET COUNTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const customersCount = await getCount('user_profiles');
  const maidsCount = await getCount('maid_profiles');
  const bookingsCount = await getCount('bookings');
  const payoutsCount = await getCount('payouts');
  const ratingsCount = await getCount('ratings');
  const notifsCount = await getCount('notifications');

  console.log(`  • Customers (user_profiles) : ${customersCount}`);
  console.log(`  • Partners (maid_profiles)  : ${maidsCount}`);
  console.log(`  • Bookings (bookings)       : ${bookingsCount}`);
  console.log(`  • Payouts (payouts)         : ${payoutsCount}`);
  console.log(`  • Ratings (ratings)         : ${ratingsCount}`);
  console.log(`  • Notifications             : ${notifsCount}`);

  console.log('\n━━━ 3. VERIFYING PRESERVED SERVICE CATALOG ━━━━━━━━━━━━━━');
  const servicesCount = await getCount('services');
  const categoriesCount = await getCount('service_categories');
  const addonsCount = await getCount('service_addons');

  console.log(`  • Services           : ${servicesCount} (PRESERVED)`);
  console.log(`  • Service Categories : ${categoriesCount} (PRESERVED)`);
  console.log(`  • Service Add-ons    : ${addonsCount} (PRESERVED)`);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  if (customersCount === 0 && maidsCount === 0 && bookingsCount === 0 && servicesCount > 0) {
    console.log('║  🎉 CLEAN RESET SUCCESSFUL — Ready for Fresh Testing!   ║');
  } else {
    console.log('║  ⚠️ Review counts above.                                ║');
  }
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

run().catch(console.error);
