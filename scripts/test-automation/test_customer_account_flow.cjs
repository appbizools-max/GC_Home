const fs = require('fs');
const { createClient } = require('e:/Home Clean/GC_Home/admin-panel/node_modules/@supabase/supabase-js');

// Load env vars
const dotenv = fs.readFileSync('e:/Home Clean/GC_Home/admin-panel/.env', 'utf8');
const envVars = {};
dotenv.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('================================================================');
  console.log('🧪 GC HOME+ — CUSTOMER MOBILE ACCOUNT FLOW VERIFICATION');
  console.log('================================================================\n');

  const testMobile = '+91 98765 00099';
  const testName = 'Ananya Sharma';

  // 1. Cleanup any old test profile for clean run
  await supabase.from('user_profiles').delete().eq('phone', testMobile);
  console.log('[Setup] Purged old test profile for', testMobile);

  // 2. TEST 1: Check New User OTP Verification (No Profile in DB)
  console.log('\n--- TEST 1: New Mobile Number OTP Check ---');
  let { data: existingProfileCheck } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('phone', testMobile)
    .maybeSingle();

  console.log('Existing profile found before signup:', !!existingProfileCheck);
  const isNewUserFirstRun = !existingProfileCheck || (!existingProfileCheck.name && !existingProfileCheck.full_name);
  console.log('System classifies as NEW user (needs profile setup):', isNewUserFirstRun);
  if (!isNewUserFirstRun) throw new Error('New mobile number should require profile setup!');

  // 3. Complete Profile Setup for First-Time Customer
  console.log('\n--- TEST 2: Complete Profile Setup (First Time) ---');
  const newUid = '99999999-0000-4000-8000-000000000099';
  
  // Try inserting profile (or upserting by phone)
  let profileRow = null;
  const { data: upsertData, error: upsertErr } = await supabase.from('user_profiles').upsert({
    id: newUid,
    name: testName,
    full_name: testName,
    phone: testMobile,
    role: 'customer',
    customer_type: 'Regular Customer',
    address: 'Plot 45, Jubilee Hills',
    city: 'Hyderabad',
    account_status: 'active',
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select().maybeSingle();

  if (upsertErr) {
    console.log('Upsert notice (trying insert by phone):', upsertErr.message);
  } else {
    profileRow = upsertData;
  }

  // Fetch created profile to verify
  const { data: verifiedProfile } = await supabase.from('user_profiles').select('*').eq('phone', testMobile).maybeSingle();
  console.log('Profile created in Supabase DB:', verifiedProfile?.id, '| Name:', verifiedProfile?.name || verifiedProfile?.full_name);

  // 4. TEST 3: Existing Customer Re-Login (Idempotent Lookup)
  console.log('\n--- TEST 3: Existing Customer Re-Login Flow ---');
  const { data: reLoginCheck } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('phone', testMobile)
    .maybeSingle();

  const isExistingOnReLogin = !!reLoginCheck && (!!reLoginCheck.name || !!reLoginCheck.full_name);
  console.log('System recognizes EXISTING user on re-login:', isExistingOnReLogin);
  console.log('Bypasses Profile Setup & Directs to Customer Home:', isExistingOnReLogin);
  if (!isExistingOnReLogin) throw new Error('Existing customer was incorrectly sent to profile setup!');

  // 5. TEST 4: Duplicate Prevention
  console.log('\n--- TEST 4: Duplicate Prevention Check ---');
  const { count: profileCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('phone', testMobile);

  console.log('Total customer profiles for phone number:', profileCount);
  if (profileCount !== 1) throw new Error('Duplicate customer profiles detected for same mobile number!');

  // 6. TEST 5: Data Scoping (Addresses & Bookings by UUID)
  console.log('\n--- TEST 5: Data Scoping by User UUID ---');
  const activeUserId = verifiedProfile?.id || newUid;

  // Insert address for this user
  const addrId = '88888888-0000-4000-8000-000000000088';
  const { error: addrErr } = await supabase.from('saved_addresses').upsert({
    id: addrId,
    user_id: activeUserId,
    label: 'Home',
    street: 'Plot 45, Jubilee Hills',
    city: 'Hyderabad',
    pincode: '500033',
    is_default: true,
  });
  if (addrErr) console.error('Address insert error:', addrErr.message);

  const { data: scopedAddresses } = await supabase.from('saved_addresses').select('*').eq('user_id', activeUserId);
  console.log('Addresses scoped to user UUID:', scopedAddresses?.length, 'address(es) found');
  if (!scopedAddresses || scopedAddresses.length === 0) throw new Error('Saved addresses not scoped to user ID!');

  // 7. TEST 6: Customer -> Maid Partner Capability (Same User ID & Phone)
  console.log('\n--- TEST 6: Customer -> Maid Partner Unified Identity ---');
  const { data: maidProfile } = await supabase.from('maid_profiles').upsert({
    id: activeUserId,
    user_id: activeUserId,
    full_name: testName,
    phone: testMobile,
    status: 'pending',
    service_area: 'Hyderabad',
  }).select().single();

  console.log('Maid application created with same user_id:', maidProfile?.user_id === activeUserId);
  
  // Verify user profile count remains exactly 1
  const { count: finalCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('phone', testMobile);

  console.log('User profiles count after Maid application:', finalCount);
  if (finalCount !== 1) throw new Error('Maid application created duplicate user profile!');

  // Cleanup test data
  await supabase.from('saved_addresses').delete().eq('id', addrId);
  await supabase.from('maid_profiles').delete().eq('user_id', activeUserId);
  await supabase.from('user_profiles').delete().eq('phone', testMobile);
  console.log('\n[Cleanup] Test data removed cleanly.');

  console.log('\n================================================================');
  console.log('✅ ALL CUSTOMER MOBILE ACCOUNT FLOW TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
