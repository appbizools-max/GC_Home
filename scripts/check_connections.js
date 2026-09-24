/**
 * GC HOME+ — Live Connection Diagnostic
 * Tests: Supabase DB tables, RPC functions, Storage, Auth, Realtime
 * Usage: node scripts/check_connections.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

// Check if service role key is present in env or admin-panel/.env
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

const RESULTS = [];
let passed = 0, failed = 0, warned = 0;

function log(status, name, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️ ';
  const line = `  ${icon} ${name}${detail ? ' — ' + detail : ''}`;
  console.log(line);
  RESULTS.push({ status, name, detail });
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else warned++;
}

function request(path, method = 'GET', body = null, authKey = ANON_KEY) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'zpkukinayxcbwyklfdqn.supabase.co',
      path,
      method,
      headers: {
        'apikey': authKey,
        'Authorization': `Bearer ${authKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 8000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });

    req.on('error', (e) => resolve({ status: 0, body: null, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: null, error: 'timeout' }); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkTable(table, expectedFields = []) {
  const res = await request(`/rest/v1/${table}?limit=1&select=*`);
  if (res.status === 0) {
    log('FAIL', `Table: ${table}`, `Network error: ${res.error}`);
  } else if (res.status === 200) {
    const count = Array.isArray(res.body) ? res.body.length : '?';
    if (expectedFields.length && count > 0) {
      const row = res.body[0];
      const missing = expectedFields.filter(f => !(f in row));
      if (missing.length > 0) {
        log('WARN', `Table: ${table}`, `Accessible (${count} row(s)) — Missing fields: ${missing.join(', ')}`);
      } else {
        log('PASS', `Table: ${table}`, `Accessible, ${count} row(s)`);
      }
    } else {
      log('PASS', `Table: ${table}`, `Accessible, ${count} row(s)`);
    }
  } else if (res.status === 404) {
    log('FAIL', `Table: ${table}`, `404 — Table does not exist or PostgREST cannot see it`);
  } else if (res.status === 401 || res.status === 403) {
    log('WARN', `Table: ${table}`, `${res.status} — RLS blocking anon access (table exists but no public read policy)`);
  } else {
    log('FAIL', `Table: ${table}`, `HTTP ${res.status} — ${res.raw?.substring(0, 100)}`);
  }
}

async function checkRpc(funcName, params = {}) {
  const res = await request(`/rest/v1/rpc/${funcName}`, 'POST', params);
  if (res.status === 0) {
    log('FAIL', `RPC: ${funcName}`, `Network error: ${res.error}`);
  } else if (res.status === 200) {
    log('PASS', `RPC: ${funcName}`, 'Function exists and returned 200');
  } else if (res.status === 404) {
    log('FAIL', `RPC: ${funcName}`, '404 — Function does not exist');
  } else if (res.status === 400) {
    // 400 on RPC often means wrong params but function exists
    log('WARN', `RPC: ${funcName}`, `400 — Function exists but param mismatch (expected): ${res.raw?.substring(0, 80)}`);
  } else if (res.status === 401 || res.status === 403) {
    log('WARN', `RPC: ${funcName}`, `${res.status} — Function exists but requires auth`);
  } else {
    log('WARN', `RPC: ${funcName}`, `HTTP ${res.status}`);
  }
}

async function checkStorage(bucket) {
  const res = await request(`/storage/v1/bucket/${bucket}`, 'GET', null, SERVICE_ROLE_KEY || ANON_KEY);
  if (res.status === 200) {
    const pub = res.body?.public ? 'public' : 'private';
    log('PASS', `Storage bucket: ${bucket}`, `Exists (${pub})`);
  } else if (res.status === 400 && res.body?.error === 'Bucket not found') {
    log('FAIL', `Storage bucket: ${bucket}`, 'Bucket does not exist — run migration 033');
  } else if (res.status === 404) {
    log('FAIL', `Storage bucket: ${bucket}`, '404 — Bucket not found — run migration 033');
  } else if (res.status === 401 || res.status === 403) {
    log('WARN', `Storage bucket: ${bucket}`, `${res.status} — May exist but requires service role to inspect`);
  } else {
    log('WARN', `Storage bucket: ${bucket}`, `HTTP ${res.status} — ${res.raw?.substring(0, 80)}`);
  }
}

async function checkAuth() {
  const res = await request('/auth/v1/settings');
  if (res.status === 200) {
    const phone = res.body?.external?.phone || res.body?.phone_enabled;
    const google = res.body?.external?.google?.enabled;
    log('PASS', 'Auth: API reachable', `Phone OTP: ${phone ? 'enabled' : 'check dashboard'} | Google OAuth: ${google ? 'enabled' : 'check dashboard'}`);
  } else {
    log('WARN', 'Auth: API', `HTTP ${res.status}`);
  }
}

async function checkRealtime() {
  // Check if realtime endpoint is reachable (we can't do a WebSocket from Node easily, 
  // so we check the REST healthcheck)
  const res = await request('/realtime/v1/api');
  if (res.status === 200 || res.status === 404) {
    // 404 is normal here — means realtime service is running but this path doesn't exist
    log('PASS', 'Realtime: Service reachable', 'Supabase Realtime endpoint is up');
  } else if (res.status === 0) {
    log('FAIL', 'Realtime: Service', `Unreachable — ${res.error}`);
  } else {
    log('PASS', 'Realtime: Service reachable', `HTTP ${res.status} (normal for realtime)`);
  }
}

async function checkTrigger() {
  // Query information_schema to check if our payout trigger exists
  const res = await request(
    `/rest/v1/rpc/check_payout_trigger`,
    'POST',
    {}
  );
  // This RPC won't exist — instead check via a known-safe query approach
  // We'll use the information_schema via a custom RPC if available
  // Fall back to a descriptive warning
  log('WARN', 'Payout Trigger: trg_auto_payout_on_completion',
    'Cannot verify via anon key — run this in SQL Editor to confirm:\n' +
    '    SELECT trigger_name FROM information_schema.triggers\n' +
    "    WHERE event_object_table = 'bookings'\n" +
    "    AND trigger_name = 'trg_auto_payout_on_completion';"
  );
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       GC HOME+ — Live Connection Diagnostic              ║');
  console.log('║       Project: zpkukinayxcbwyklfdqn.supabase.co          ║');
  console.log(`║       Time: ${new Date().toLocaleTimeString()}                              ║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── 1. CORE DATABASE TABLES ──
  console.log('━━━ 1. CORE DATABASE TABLES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await checkTable('bookings', ['id', 'booking_code', 'status', 'customer_name', 'total_amount']);
  await checkTable('maid_profiles', ['id', 'full_name', 'status', 'is_online']);
  await checkTable('user_profiles', ['id', 'phone', 'role']);
  await checkTable('services', ['id', 'name', 'starting_price', 'is_active']);
  await checkTable('service_categories', ['id', 'name']);
  await checkTable('service_addons', ['id', 'name', 'service_id']);

  // ── 2. BOOKING WORKFLOW TABLES ──
  console.log('\n━━━ 2. BOOKING WORKFLOW TABLES ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await checkTable('partner_assignments', ['id', 'booking_id', 'partner_id', 'response_status']);
  await checkTable('booking_items', ['id', 'booking_id', 'service_name', 'unit_price']);
  await checkTable('booking_timeline', ['id', 'booking_id', 'event_type']);
  await checkTable('notifications', ['id', 'recipient_id', 'title', 'message']);

  // ── 3. FINANCIAL TABLES ──
  console.log('\n━━━ 3. FINANCIAL TABLES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await checkTable('payouts', ['id', 'booking_id', 'maid_id', 'net_amount', 'status']);
  await checkTable('ratings', ['id', 'booking_id', 'maid_id', 'rating']);
  await checkTable('offers', ['id', 'code', 'discount_type']);

  // ── 4. ADMIN & PLATFORM TABLES ──
  console.log('\n━━━ 4. ADMIN & PLATFORM TABLES ━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await checkTable('platform_settings', ['key', 'value']);
  await checkTable('service_areas', ['id', 'city']);
  await checkTable('homepage_banners', ['id', 'title', 'image_url']);
  await checkTable('saved_addresses', ['id', 'user_id', 'locality']);

  // ── 5. RPC FUNCTIONS ──
  console.log('\n━━━ 5. RPC / DATABASE FUNCTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━');
  const bRes = await request('/rest/v1/bookings?select=booking_code&limit=1');
  const sampleCode = Array.isArray(bRes.body) && bRes.body[0]?.booking_code ? bRes.body[0].booking_code : 'GC-00000';
  await checkRpc('find_eligible_partners', { booking_id: '00000000-0000-0000-0000-000000000000' });
  await checkRpc('accept_booking', { p_booking_id: '00000000-0000-0000-0000-000000000000', p_maid_id: '00000000-0000-0000-0000-000000000000' });
  await checkRpc('verify_booking_otp', { p_booking_code: sampleCode, p_otp: '000000' });
  await checkRpc('generate_booking_otp', { p_booking_code: sampleCode });
  await checkRpc('resolve_booking_uuid', { p_booking_code: sampleCode });

  // ── 6. STORAGE BUCKETS ──
  console.log('\n━━━ 6. STORAGE BUCKETS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await checkStorage('gc-home-assets');
  await checkStorage('partner-kyc');

  // ── 7. AUTH ──
  console.log('\n━━━ 7. AUTHENTICATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await checkAuth();

  // ── 8. REALTIME ──
  console.log('\n━━━ 8. REALTIME ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await checkRealtime();

  // ── 9. PAYOUT TRIGGER (informational) ──
  console.log('\n━━━ 9. PAYOUT TRIGGER (manual verify required) ━━━━━━━━━━');
  await checkTrigger();

  // ── SUMMARY ──
  const total = passed + failed + warned;
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                   DIAGNOSTIC SUMMARY                    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total checks : ${String(total).padEnd(40)}║`);
  console.log(`║  ✅ PASS       : ${String(passed).padEnd(40)}║`);
  console.log(`║  ❌ FAIL       : ${String(failed).padEnd(40)}║`);
  console.log(`║  ⚠️  WARN       : ${String(warned).padEnd(39)}║`);
  console.log('╠══════════════════════════════════════════════════════════╣');

  if (failed === 0) {
    console.log('║  🎉 All critical connections PASSING.                    ║');
  } else {
    console.log('║  🔴 Issues found — see ❌ items above.                   ║');
  }
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    console.log('🔴 FAILED CHECKS:');
    RESULTS.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   → ${r.name}: ${r.detail}`);
    });
  }

  if (warned > 0) {
    console.log('\n⚠️  WARNINGS (non-critical):');
    RESULTS.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`   → ${r.name}: ${r.detail}`);
    });
  }

  console.log('');
}

main().catch(console.error);
