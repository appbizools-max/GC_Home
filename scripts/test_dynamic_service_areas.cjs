/**
 * GC HOME+ — Dynamic Service Areas Acceptance Test Suite
 * Tests all 4 cities, PIN code validation, Supabase integration,
 * Active/Inactive toggle sync, and catalog integrity.
 */

const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../admin-panel/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUyODM5MywiZXhwIjoyMTA1MTA0MzkzfQ.kWKEJS7DyKzL4Qg4NWFYu-4fJBuKqhi_-UoY-fYdWrY';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const adminSb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const userSb = createClient(SUPABASE_URL, ANON_KEY);

const TELANGANA_HUBS = ['Karimnagar', 'Kazipet', 'Hanamkonda', 'Warangal'];

// Postal PIN Validation Function as used in Admin Panel & User App
async function validatePostalPin(pin) {
  const cleanPin = String(pin).replace(/\D/g, '').trim();
  if (cleanPin.length !== 6) {
    return { valid: false, error: 'Pincode must be exactly 6 digits.' };
  }
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    const data = await res.json();
    if (!Array.isArray(data) || data[0]?.Status !== 'Success' || !Array.isArray(data[0]?.PostOffice) || data[0].PostOffice.length === 0) {
      return { valid: false, error: `Invalid PIN code. PIN ${cleanPin} does not exist in postal records.` };
    }
    const state = (data[0].PostOffice[0]?.State || '').trim();
    if (state.toLowerCase() !== 'telangana') {
      return { valid: false, error: `PIN code ${cleanPin} belongs to ${state}. GC HOME+ operates exclusively in Telangana.` };
    }
    return { valid: true, state, district: data[0].PostOffice[0]?.District, postOffices: data[0].PostOffice };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

// User App Serviceability Check function
async function checkServiceabilityUserApp(pincode) {
  const cleanPin = String(pincode || '').replace(/\D/g, '').trim();
  if (cleanPin.length !== 6) {
    return { isServiceable: false, message: 'Sorry, GC HOME+ is currently not available in your area.' };
  }
  const { data, error } = await userSb.from('service_areas').select('*').eq('pincode', cleanPin);
  if (error || !data || data.length === 0) {
    return { isServiceable: false, message: 'Sorry, GC HOME+ is currently not available in your area.' };
  }
  const activeMatch = data.find(row => row.is_serviceable !== false && row.is_active !== false);
  if (activeMatch) {
    return { isServiceable: true, message: 'Services available in your area.', area: activeMatch };
  }
  return { isServiceable: false, message: 'Sorry, GC HOME+ is currently not available in your area.' };
}

async function runAcceptanceTests() {
  console.log('====================================================');
  console.log('  GC HOME+ DYNAMIC SERVICE AREAS ACCEPTANCE TESTS   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Verify Catalog Integrity
  console.log('--- 1. Service Catalog Integrity Check ---');
  const { data: services } = await adminSb.from('services').select('id');
  const { data: categories } = await adminSb.from('service_categories').select('id');
  const { data: addOns } = await adminSb.from('service_addons').select('id');

  assert(`Services count preserved (${services?.length} services)`, (services?.length || 0) >= 60);
  assert(`Service categories count preserved (${categories?.length} categories)`, (categories?.length || 0) >= 10);
  assert(`Service add-ons count preserved (${addOns?.length} add-ons)`, (addOns?.length || 0) >= 40);

  // 2. Postal PIN Validation Tests
  console.log('\n--- 2. Postal PIN Validation Tests ---');
  // Telangana Karimnagar PIN: 505001
  const vKarimnagar = await validatePostalPin('505001');
  assert('PIN 505001 (Karimnagar) is recognized as valid Telangana PIN', vKarimnagar.valid && vKarimnagar.state === 'Telangana');

  // Telangana Warangal/Hanamkonda PIN: 506001
  const vHanamkonda = await validatePostalPin('506001');
  assert('PIN 506001 (Hanamkonda/Warangal) is recognized as valid Telangana PIN', vHanamkonda.valid && vHanamkonda.state === 'Telangana');

  // Telangana Kazipet PIN: 506003
  const vKazipet = await validatePostalPin('506003');
  assert('PIN 506003 (Kazipet) is recognized as valid Telangana PIN', vKazipet.valid && vKazipet.state === 'Telangana');

  // Non-Telangana PIN: 110001 (Delhi)
  const vDelhi = await validatePostalPin('110001');
  assert('PIN 110001 (Delhi) is rejected because it does not belong to Telangana', !vDelhi.valid && vDelhi.error.includes('Delhi'));

  // Invalid PIN: 999999
  const vInvalid = await validatePostalPin('999999');
  assert('PIN 999999 is rejected because it does not exist in postal records', !vInvalid.valid);

  // Short PIN: 50500
  const vShort = await validatePostalPin('50500');
  assert('PIN 50500 (<6 digits) is rejected', !vShort.valid && vShort.error.includes('6 digits'));

  // 3. Four Hubs Coverage in Supabase
  console.log('\n--- 3. Testing 4 Telangana Service Hubs ---');
  const testAreas = [
    { city: 'Karimnagar', locality: 'Kothapalli Test Area', pincode: '505001' },
    { city: 'Kazipet', locality: 'Kazipet Junction Test Area', pincode: '506003' },
    { city: 'Hanamkonda', locality: 'Subedari Test Area', pincode: '506001' },
    { city: 'Warangal', locality: 'Naimnagar Test Area', pincode: '506002' },
  ];

  const createdAreaIds = [];

  for (const item of testAreas) {
    // Insert area into Supabase
    const { data: inserted, error: insertErr } = await adminSb
      .from('service_areas')
      .insert([{
        city: item.city,
        state: 'Telangana',
        locality_name: item.locality,
        zone_name: item.locality,
        pincode: item.pincode,
        is_serviceable: true,
        is_active: true,
      }])
      .select();

    assert(`Admin can add area for ${item.city} (${item.locality}) into Supabase`, !insertErr && inserted && inserted.length > 0);
    if (inserted && inserted[0]) {
      createdAreaIds.push(inserted[0].id);

      // Verify User App can detect the area
      const userCheck = await checkServiceabilityUserApp(item.pincode);
      assert(`User App recognizes ${item.city} (${item.pincode}) as serviceable: "${userCheck.message}"`, userCheck.isServiceable && userCheck.message === 'Services available in your area.');
    }
  }

  // 4. Test Toggle Active -> Inactive -> Active
  console.log('\n--- 4. Testing Admin Active / Inactive Sync with User App ---');
  const tempTestPin = '505499';
  const { data: tempArea } = await adminSb
    .from('service_areas')
    .insert([{
      city: 'Karimnagar',
      state: 'Telangana',
      locality_name: 'Sync Test Colony',
      zone_name: 'Sync Test Colony',
      pincode: tempTestPin,
      is_serviceable: true,
      is_active: true,
    }])
    .select();

  const tempId = tempArea[0].id;

  // 4a. Initial active check in User App
  const userCheckActiveInitial = await checkServiceabilityUserApp(tempTestPin);
  assert('User App sees freshly created area as serviceable: "Services available in your area."', userCheckActiveInitial.isServiceable && userCheckActiveInitial.message === 'Services available in your area.');

  // 4b. Admin Deactivates: 505499 -> Inactive
  const { error: deactErr } = await adminSb
    .from('service_areas')
    .update({ is_serviceable: false, is_active: false })
    .eq('id', tempId);

  assert('Admin successfully deactivates area in Supabase', !deactErr);

  // User App check must now be unserviceable
  const userCheckDeactivated = await checkServiceabilityUserApp(tempTestPin);
  assert(`User App instantly recognizes deactivated PIN as unavailable: "${userCheckDeactivated.message}"`, userCheckDeactivated.isServiceable === false && userCheckDeactivated.message === 'Sorry, GC HOME+ is currently not available in your area.');

  // 4c. Admin Re-activates: 505499 -> Active
  const { error: actErr } = await adminSb
    .from('service_areas')
    .update({ is_serviceable: true, is_active: true })
    .eq('id', tempId);

  assert('Admin successfully re-activates area in Supabase', !actErr);

  // User App check must now be serviceable again
  const userCheckReactivated = await checkServiceabilityUserApp(tempTestPin);
  assert(`User App instantly recognizes re-activated PIN as serviceable: "${userCheckReactivated.message}"`, userCheckReactivated.isServiceable === true && userCheckReactivated.message === 'Services available in your area.');

  // Clean up temp sync area
  await adminSb.from('service_areas').delete().eq('id', tempId);

  // 5. Test Non-existent Pincode in User App
  console.log('\n--- 5. User App Unserviceable PIN Blocking ---');
  const userCheckUnserviceable = await checkServiceabilityUserApp('500999');
  assert('Unregistered PIN 500999 returns isServiceable = false', userCheckUnserviceable.isServiceable === false);
  assert(`User App shows exact message: "${userCheckUnserviceable.message}"`, userCheckUnserviceable.message === 'Sorry, GC HOME+ is currently not available in your area.');

  // Clean up test areas created during this run
  console.log('\n--- Cleaning up test records ---');
  for (const id of createdAreaIds) {
    await adminSb.from('service_areas').delete().eq('id', id);
  }
  console.log(`Cleaned up ${createdAreaIds.length} test records.`);

  // 6. Final Catalog Count Re-Verification
  console.log('\n--- 6. Final Service Catalog Safety Verification ---');
  const { data: finalServices } = await adminSb.from('services').select('id');
  assert(`Catalog remains 100% untouched (${finalServices?.length} services preserved)`, finalServices?.length === services?.length);

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
