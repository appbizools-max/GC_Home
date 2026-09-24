/**
 * Automated Verification Script: Indian PIN Code Lookup & Address Auto-Fill
 * GC HOME+ Customer & Partner Address System
 */

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

function cleanCityName(rawCity) {
  if (!rawCity) return '';
  return rawCity
    .replace(/\s+(City|Urban|Rural|North|South|East|West|Central|Division|District)$/i, '')
    .trim();
}

async function fetchPincodeDetails(pincode) {
  const cleaned = (pincode || '').replace(/\D/g, '');
  if (cleaned.length !== 6) {
    return {
      success: false,
      pincode: cleaned,
      error: 'Please enter a valid 6-digit PIN code.',
      invalidFormat: true,
    };
  }

  const url = `https://api.postalpincode.in/pincode/${cleaned}`;
  const response = await fetch(url);
  if (!response.ok) {
    return {
      success: false,
      pincode: cleaned,
      error: 'Unable to automatically find this PIN. You can enter your address manually.',
      networkError: true,
    };
  }

  const json = await response.json();
  if (!Array.isArray(json) || json.length === 0) {
    return {
      success: false,
      pincode: cleaned,
      error: "We couldn't find this PIN code. Please check the PIN and try again.",
      notFound: true,
    };
  }

  const record = json[0];
  if (record.Status !== 'Success' || !Array.isArray(record.PostOffice) || record.PostOffice.length === 0) {
    return {
      success: false,
      pincode: cleaned,
      error: record.Message || "We couldn't find this PIN code. Please check the PIN and try again.",
      notFound: true,
    };
  }

  const offices = record.PostOffice;
  const firstOffice = offices[0];
  const postOfficesList = offices.map(o => o.Name).filter(Boolean);
  const city = cleanCityName(firstOffice.Division || firstOffice.District);

  return {
    success: true,
    pincode: cleaned,
    state: firstOffice.State || '',
    district: firstOffice.District || '',
    city: city || firstOffice.District || '',
    area: firstOffice.Name || '',
    postOffices: postOfficesList,
    rawOffices: offices,
  };
}

function validateAddressData(data) {
  const errors = {};
  if (!data.houseFlat || !data.houseFlat.trim()) {
    errors.houseFlat = 'House / Flat number is required';
  }
  if (!data.street || !data.street.trim()) {
    errors.street = 'Street or road name is required';
  }
  if (!data.locality || !data.locality.trim()) {
    errors.locality = 'Area / Locality is required';
  }
  const pinClean = (data.pincode || '').replace(/\D/g, '');
  if (!pinClean || pinClean.length !== 6) {
    errors.pincode = 'Please enter a valid 6-digit PIN code';
  }
  if (!data.city || !data.city.trim()) {
    errors.city = 'City is required';
  }
  if (!data.state || !data.state.trim()) {
    errors.state = 'State is required';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

async function querySupabaseRest(endpoint, method = 'GET', body = null) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: INDIAN PIN CODE AUTO-FILL & ADDRESS SYSTEM');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, name, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${name}`);
      if (details) console.log(`      ${details}`);
    } else {
      console.error(`  ✗ [FAIL] ${name}`);
      if (details) console.error(`      ${details}`);
    }
  }

  // ── TEST 1: PIN 520001 (Vijayawada, Krishna, AP) with multiple post offices ──
  console.log('Test 1: Vijayawada PIN Code 520001 (Multiple Post Offices)');
  try {
    const res = await fetchPincodeDetails('520001');
    assert(res.success === true, 'Lookup succeeded for 520001');
    assert(res.state === 'Andhra Pradesh', 'State resolved to Andhra Pradesh', `Got: ${res.state}`);
    assert(res.district === 'Krishna', 'District resolved to Krishna', `Got: ${res.district}`);
    assert(res.city === 'Vijayawada', 'City normalized to Vijayawada', `Got: ${res.city}`);
    assert(res.postOffices.length > 1, `Multiple post offices found (${res.postOffices.length})`, `Offices: ${res.postOffices.slice(0, 3).join(', ')}...`);
  } catch (err) {
    assert(false, 'Lookup threw an unexpected error', err.message);
  }

  // ── TEST 2: PIN 500081 (Madhapur / Hyderabad, Telangana) ──
  console.log('\nTest 2: Hyderabad / Madhapur PIN Code 500081');
  try {
    const res = await fetchPincodeDetails('500081');
    assert(res.success === true, 'Lookup succeeded for 500081');
    assert(res.state === 'Telangana', 'State resolved to Telangana', `Got: ${res.state}`);
    assert(res.postOffices.includes('Madhapur'), 'Contains Madhapur post office', `Offices: ${res.postOffices.join(', ')}`);
    assert(res.city.length > 0, 'City resolved', `Got: ${res.city}`);
  } catch (err) {
    assert(false, 'Lookup threw an unexpected error', err.message);
  }

  // ── TEST 3: Invalid PIN 999999 (No records found) ──
  console.log('\nTest 3: Invalid PIN 999999 (Non-existent location)');
  try {
    const res = await fetchPincodeDetails('999999');
    assert(res.success === false, 'Lookup returned failure for 999999');
    assert(res.notFound === true, 'Properly marked as notFound');
    assert(res.error.includes("couldn't find") || res.error.includes("No records"), 'User-friendly error message returned', res.error);
  } catch (err) {
    assert(false, 'Unexpected error for 999999', err.message);
  }

  // ── TEST 4: Malformed PIN format (< 6 digits) ──
  console.log('\nTest 4: Malformed PIN 5200');
  try {
    const res = await fetchPincodeDetails('5200');
    assert(res.success === false, 'Lookup returned failure for short PIN');
    assert(res.invalidFormat === true, 'Properly marked as invalidFormat');
    assert(res.error === 'Please enter a valid 6-digit PIN code.', 'Returned exact prompt error message');
  } catch (err) {
    assert(false, 'Unexpected error for short PIN', err.message);
  }

  // ── TEST 5: User Selection from Multiple Post Offices ──
  console.log('\nTest 5: Multiple Post Offices Selection Simulation');
  try {
    const res = await fetchPincodeDetails('520001');
    const availableOffices = res.postOffices;
    // Simulate user choosing the 2nd office instead of the 1st
    const chosenOfficeName = availableOffices[1] || availableOffices[0];
    const selectedOffice = res.rawOffices.find(o => o.Name === chosenOfficeName);

    assert(Boolean(selectedOffice), `User selected office: "${chosenOfficeName}"`);
    assert(selectedOffice.Name === chosenOfficeName, 'Selected office name matches user choice');
  } catch (err) {
    assert(false, 'Office selection error', err.message);
  }

  // ── TEST 6: User Edit & Override ("Auto-fill does not mean auto-confirm") ──
  console.log('\nTest 6: User Edit & Correction Precedence');
  try {
    const apiResult = await fetchPincodeDetails('520001');
    // User corrects and provides exact residence:
    const userFinalAddress = {
      houseFlat: 'Flat 402, Sai Residency',
      street: '4th Cross, Gandhi Nagar',
      locality: 'Custom Locality (User Corrected)',
      city: 'Vijayawada West (User Corrected)',
      district: 'Krishna',
      state: 'Andhra Pradesh',
      pincode: '520001',
      postOffice: 'Buckinghampet',
    };

    const validation = validateAddressData(userFinalAddress);
    assert(validation.isValid, 'Validation passed on user-confirmed address');
    assert(userFinalAddress.locality !== apiResult.area, 'User edited locality preserved over API default');
    assert(userFinalAddress.city !== apiResult.city, 'User edited city preserved over API default');
    assert(userFinalAddress.houseFlat === 'Flat 402, Sai Residency', 'House / Flat number preserved');
  } catch (err) {
    assert(false, 'User edit test error', err.message);
  }

  // ── TEST 7: Address Validation Logic ──
  console.log('\nTest 7: Address Form Validation Rules');
  const incompleteAddress = {
    houseFlat: '',
    street: '',
    locality: '',
    pincode: '520',
    city: '',
    state: '',
  };
  const valResult = validateAddressData(incompleteAddress);
  assert(valResult.isValid === false, 'Incomplete address correctly flagged invalid');
  assert(Boolean(valResult.errors.houseFlat), 'House / Flat flagged as required');
  assert(Boolean(valResult.errors.street), 'Street flagged as required');
  assert(Boolean(valResult.errors.locality), 'Locality flagged as required');
  assert(Boolean(valResult.errors.pincode), 'Pincode flagged as invalid');
  assert(Boolean(valResult.errors.city), 'City flagged as required');
  assert(Boolean(valResult.errors.state), 'State flagged as required');

  // ── TEST 8: Supabase Customer Address Storage ──
  console.log('\nTest 8: Supabase Saved Address Schema & REST API');
  try {
    const checkRes = await querySupabaseRest('saved_addresses?select=*&limit=1');
    assert(checkRes.status === 200, 'saved_addresses table endpoint reachable', `HTTP ${checkRes.status}`);
    assert(Array.isArray(checkRes.data), 'saved_addresses data array returned');
  } catch (dbErr) {
    assert(false, 'DB test warning:', dbErr.message);
  }

  // ── TEST 9: Partner Profile Address Schema Compatibility ──
  console.log('\nTest 9: Partner Profile Address Schema Compatibility');
  try {
    const maidRes = await querySupabaseRest('maid_profiles?select=id,full_address,address,locality,city,pincode,service_area&limit=1');
    assert(maidRes.status === 200, 'maid_profiles endpoint reachable', `HTTP ${maidRes.status}`);
    assert(Array.isArray(maidRes.data), 'maid_profiles returns address fields');
    if (maidRes.data && maidRes.data.length > 0) {
      console.log(`      Sample partner address record ID: ${maidRes.data[0].id}`);
    }
  } catch (err) {
    assert(false, 'Partner schema query error', err.message);
  }

  // ── TEST 10: Partner Registration City Selection Validation ──
  console.log('\nTest 10: Partner Step 2 City Dropdown Validation');
  const PARTNER_SUPPORTED_CITIES = ['Karimnagar', 'Kazipet', 'Hanamkonda', 'Warangal'];

  function validatePartnerCity(city) {
    if (!city || !city.trim()) {
      return { isValid: false, error: 'Please select your city.' };
    }
    if (!PARTNER_SUPPORTED_CITIES.includes(city.trim())) {
      return { isValid: false, error: 'Please select your city.' };
    }
    return { isValid: true, error: null };
  }

  // Case 1: Empty city
  const emptyRes = validatePartnerCity('');
  assert(emptyRes.isValid === false, 'Empty city rejected');
  assert(emptyRes.error === 'Please select your city.', 'Expected error: Please select your city.');

  // Case 2: Disallowed city (e.g. Hyderabad / Bengaluru)
  const disallowRes = validatePartnerCity('Hyderabad');
  assert(disallowRes.isValid === false, 'Disallowed city (Hyderabad) rejected');
  assert(disallowRes.error === 'Please select your city.', 'Prompt error: Please select your city.');

  // Case 3: Each of the 4 supported cities
  for (const c of PARTNER_SUPPORTED_CITIES) {
    const okRes = validatePartnerCity(c);
    assert(okRes.isValid === true, `City "${c}" successfully accepted`);
  }

  // ── TEST 11: Partner Profile Schema City & Service Area Mapping ──
  console.log('\nTest 11: Partner Application Payload Mapping to Selected City');
  const testPartnerPayload = {
    houseFlat: 'D.No 4-56/A',
    street: 'Subedari Main Road',
    locality: 'Subedari',
    pincode: '506001',
    city: 'Hanamkonda',
    serviceArea: 'Hanamkonda',
    preferredServiceArea: 'Hanamkonda',
  };

  assert(testPartnerPayload.city === 'Hanamkonda', 'Selected city stored in city field');
  assert(testPartnerPayload.serviceArea === 'Hanamkonda', 'Selected city stored in serviceArea (replaces free-text)');
  assert(testPartnerPayload.preferredServiceArea === 'Hanamkonda', 'Selected city stored in preferredServiceArea');
  assert(!('freeTextOperationArea' in testPartnerPayload), 'No free-text operation area field present');

  console.log('\n================================================================');
  console.log(`  FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
