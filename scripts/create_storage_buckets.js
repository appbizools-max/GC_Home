/**
 * GC HOME+ — Create Storage Buckets via Supabase Storage API
 * Uses the anon key to attempt bucket creation via REST.
 * If that fails (requires service_role), prints exact Dashboard steps.
 *
 * Usage: node scripts/create_storage_buckets.js
 */

const https = require('https');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AUTH_KEY = SERVICE_ROLE_KEY || ANON_KEY;

function request(path, method = 'GET', body = null, key = AUTH_KEY) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'zpkukinayxcbwyklfdqn.supabase.co',
      path,
      method,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), raw: data }); }
        catch { resolve({ status: res.statusCode, body: null, raw: data }); }
      });
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkBucket(name) {
  const res = await request(`/storage/v1/bucket/${name}`);
  return res.status === 200;
}

async function createBucket(name, isPublic) {
  const res = await request('/storage/v1/bucket', 'POST', {
    id: name,
    name: name,
    public: isPublic,
    allowed_mime_types: isPublic
      ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
      : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    file_size_limit: 10485760, // 10MB
  });
  return res;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         GC HOME+ — Create Storage Buckets               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const buckets = [
    { name: 'gc-home-assets', public: true,  desc: 'Service images, banners, app assets' },
    { name: 'partner-kyc',    public: false, desc: 'Partner KYC documents (private)'    },
  ];

  for (const bucket of buckets) {
    process.stdout.write(`  Checking ${bucket.name}... `);
    const exists = await checkBucket(bucket.name);

    if (exists) {
      console.log(`✅ Already exists — skipping`);
      continue;
    }

    process.stdout.write(`not found. Creating... `);
    const res = await createBucket(bucket.name, bucket.public);

    if (res.status === 200 || res.status === 201) {
      console.log(`✅ Created successfully (${bucket.public ? 'public' : 'private'})`);
    } else if (res.status === 409) {
      console.log(`✅ Already exists (409 conflict)`);
    } else if (res.status === 400 && res.raw?.includes('already exists')) {
      console.log(`✅ Already exists`);
    } else {
      console.log(`❌ Failed — HTTP ${res.status}: ${res.raw?.substring(0, 120)}`);
    }
  }

  // Re-check
  console.log('\n  Re-verifying buckets...');
  let allGood = true;
  for (const bucket of buckets) {
    const exists = await checkBucket(bucket.name);
    if (exists) {
      console.log(`  ✅ ${bucket.name} — accessible`);
    } else {
      console.log(`  ❌ ${bucket.name} — still not accessible`);
      allGood = false;
    }
  }

  if (!allGood) {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  Bucket creation requires elevated access.               ║');
    console.log('║  Create them manually in 30 seconds via Dashboard:       ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║                                                          ║');
    console.log('║  1. Open:                                                ║');
    console.log('║     https://supabase.com/dashboard/project/             ║');
    console.log('║     zpkukinayxcbwyklfdqn/storage/buckets                ║');
    console.log('║                                                          ║');
    console.log('║  2. Click "New bucket"                                   ║');
    console.log('║     Name: gc-home-assets                                 ║');
    console.log('║     ✓ Check "Public bucket"                              ║');
    console.log('║     Click "Save"                                         ║');
    console.log('║                                                          ║');
    console.log('║  3. Click "New bucket" again                             ║');
    console.log('║     Name: partner-kyc                                    ║');
    console.log('║     ✗ Leave "Public bucket" UNCHECKED                   ║');
    console.log('║     Click "Save"                                         ║');
    console.log('║                                                          ║');
    console.log('║  4. Run: node scripts/check_connections.js               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
  } else {
    console.log('\n  ✅ All storage buckets are ready!\n');
    console.log('  Run: node scripts/check_connections.js to confirm 25/27 passing.\n');
  }
}

main().catch(console.error);
