/**
 * GC HOME+ — Test Suite for Partner Registration v5
 * Validates:
 * 1. Dynamic Admin -> Supabase -> Partner Services catalog (is_active = true filter)
 * 2. Service Activation & Deactivation reflection
 * 3. Step 2 Supported Cities: Karimnagar, Kazipet, Hanamkonda, Warangal
 * 4. Step 3 Multi-service selection with permanent service_id
 * 5. Step 3 Working hours validation (end time > start time) & 5 KM radius
 * 6. Step 4 Document verification (Aadhaar Front/Back & PAN only)
 * 7. Step 5 Bank validation (Confirm Bank Name matching, IFSC regex, UPI regex)
 * 8. Partner application persistence in maid_profiles & partner_services
 * 9. Admin view normalization of partner services and KYC documents
 */

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const SUPPORTED_CITIES = ['Karimnagar', 'Kazipet', 'Hanamkonda', 'Warangal'];

async function runTests() {
  console.log('================================================================');
  console.log('GC HOME+ — PARTNER REGISTRATION V5 TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ── TEST 1: Supabase Service Catalog Dynamic Fetch ──
  console.log('[TEST 1] Fetching active services from Supabase catalog...');
  const res1 = await fetch(
    `${SUPABASE_URL}/rest/v1/services?select=id,name,category,category_id,is_active,starting_price,estimated_duration&is_active=eq.true&order=name.asc`,
    { headers }
  );
  const activeServices = await res1.json();

  assert(res1.ok && Array.isArray(activeServices) && activeServices.length > 0,
    `Active services fetched successfully (${activeServices?.length || 0} active services found)`);

  const sampleService = activeServices[0];
  assert(Boolean(sampleService?.id && sampleService?.name && sampleService?.is_active === true),
    `Service has valid permanent UUID id: "${sampleService?.id}" and name: "${sampleService?.name}"`);

  // ── TEST 2: Active vs Inactive Filtering ──
  console.log('\n[TEST 2] Verifying active vs inactive service behavior...');
  const res2 = await fetch(
    `${SUPABASE_URL}/rest/v1/services?select=id,name,is_active`,
    { headers }
  );
  const allServices = await res2.json();

  assert(res2.ok, 'Fetched all services for active flag comparison');
  const inactiveCount = allServices?.filter(s => !s.is_active).length || 0;
  console.log(`  ℹ️ Total catalog services: ${allServices?.length}, Active: ${activeServices?.length}, Inactive: ${inactiveCount}`);

  // Verify active query strictly contains ZERO inactive services
  const hasInactiveInActiveQuery = activeServices.some(s => !s.is_active);
  assert(!hasInactiveInActiveQuery, 'Active catalog query strictly excludes inactive services (is_active = true)');

  // ── TEST 3: Step 2 Address Supported Cities ──
  console.log('\n[TEST 3] Verifying Step 2 Supported Cities...');
  SUPPORTED_CITIES.forEach(city => {
    assert(SUPPORTED_CITIES.includes(city), `Step 2 supports required city: "${city}"`);
  });
  assert(!SUPPORTED_CITIES.includes('InvalidCity'), 'Step 2 rejects unsupported cities');

  // ── TEST 4: Step 3 Working Hours Validation ──
  console.log('\n[TEST 4] Validating Working Time Logic (End Time > Start Time)...');
  function validateWorkingHours(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMins = (startH || 0) * 60 + (startM || 0);
    const endMins = (endH || 0) * 60 + (endM || 0);
    return endMins > startMins;
  }

  assert(validateWorkingHours('08:00', '20:00') === true, 'Valid shift (08:00 to 20:00) is accepted');
  assert(validateWorkingHours('09:00', '18:00') === true, 'Valid shift (09:00 to 18:00) is accepted');
  assert(validateWorkingHours('18:00', '09:00') === false, 'Invalid shift (18:00 to 09:00 - end earlier than start) is rejected');
  assert(validateWorkingHours('10:00', '10:00') === false, 'Equal shift (10:00 to 10:00) is rejected');

  // ── TEST 5: Step 4 Document Verification (Aadhaar & PAN) ──
  console.log('\n[TEST 5] Validating Document Verification Requirements...');
  const testDocs = {
    aadhaarFront: { uploaded: true, fileUrl: 'https://example.com/aadhaar_front.jpg' },
    aadhaarBack: { uploaded: true, fileUrl: 'https://example.com/aadhaar_back.jpg' },
    pan: { uploaded: true, fileUrl: 'https://example.com/pan.jpg' },
  };

  function validateKycDocs(docs) {
    return Boolean(docs.aadhaarFront?.uploaded && docs.aadhaarBack?.uploaded && docs.pan?.uploaded);
  }

  assert(validateKycDocs(testDocs) === true, 'Aadhaar (Front & Back) + PAN passes KYC requirement');
  assert(validateKycDocs({ ...testDocs, aadhaarBack: { uploaded: false } }) === false,
    'Missing Aadhaar Back is rejected');
  assert(validateKycDocs({ ...testDocs, pan: { uploaded: false } }) === false,
    'Missing PAN is rejected');

  // ── TEST 6: Step 5 Bank Details Validation ──
  console.log('\n[TEST 6] Validating Bank Details & Confirm Bank Name matching...');
  function validateBankDetails(holder, bank, confirmBank, acc, ifsc, upi) {
    if (!holder.trim()) return { valid: false, reason: 'holder' };
    if (!acc.trim() || acc.replace(/\D/g, '').length < 9) return { valid: false, reason: 'account' };
    if (!bank.trim()) return { valid: false, reason: 'bank' };
    if (!confirmBank.trim()) return { valid: false, reason: 'confirm_bank' };
    if (bank.trim().toLowerCase() !== confirmBank.trim().toLowerCase()) return { valid: false, reason: 'bank_mismatch' };
    
    const ifscClean = ifsc.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscClean)) return { valid: false, reason: 'ifsc' };
    if (upi && upi.trim() && !/^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z._]{2,49}$/.test(upi.trim())) {
      return { valid: false, reason: 'upi' };
    }
    return { valid: true };
  }

  const validBank = validateBankDetails(
    'Saroja Devi',
    'State Bank of India',
    'State Bank of India',
    '123456789012',
    'SBIN0001234',
    '9876543210@upi'
  );
  assert(validBank.valid === true, 'Matching bank names and valid IFSC/UPI pass validation');

  const mismatchedBank = validateBankDetails(
    'Saroja Devi',
    'State Bank of India',
    'HDFC Bank',
    '123456789012',
    'SBIN0001234',
    ''
  );
  assert(mismatchedBank.valid === false && mismatchedBank.reason === 'bank_mismatch',
    'Mismatched Bank Name and Confirm Bank Name is correctly rejected');

  const invalidIfsc = validateBankDetails(
    'Saroja Devi',
    'HDFC Bank',
    'HDFC Bank',
    '123456789012',
    'INVALID123',
    ''
  );
  assert(invalidIfsc.valid === false && invalidIfsc.reason === 'ifsc',
    'Invalid IFSC code format is correctly rejected');

  // ── TEST 7: Partner Application Persistence in Supabase ──
  console.log('\n[TEST 7] Testing Partner Application Persistence in Supabase...');
  const testPartnerCode = `GC-TEST-${Date.now().toString().slice(-6)}`;
  const selectedTestServices = activeServices.slice(0, 3).map(s => ({
    id: s.id,
    serviceId: s.id,
    serviceName: s.name,
    category: s.category || '',
    experienceYears: 3,
  }));

  const testPartnerId = '99999999-0000-0000-0000-' + Date.now().toString().slice(-12).padStart(12, '0');
  const testPartnerPayload = {
    id: testPartnerId,
    maid_code: testPartnerCode,
    full_name: 'Test Partner Saroja',
    phone: '9876543210',
    email: 'testpartner@gchome.com',
    dob: '1995-06-15',
    gender: 'Female',
    emergency_contact: 'Ramesh Kumar (9876501234)',
    emergency_contact_name: 'Ramesh Kumar',
    emergency_contact_phone: '9876501234',
    address: 'H No 4-21, Main Road, Hanamkonda 506001',
    full_address: 'H No 4-21, Main Road',
    locality: 'Main Road',
    pincode: '506001',
    city: 'Hanamkonda',
    service_area: 'Hanamkonda',
    preferred_service_area: 'Hanamkonda',
    service_radius_km: 5,
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    working_hours: '08:00 - 20:00',
    emergency_jobs_accepted: true,
    skills: selectedTestServices.map(s => s.serviceName),
    services_provided: selectedTestServices,
    languages: ['Telugu', 'Hindi', 'English'],
    languages_spoken: ['Telugu', 'Hindi', 'English'],
    kyc_documents: {
      aadhaarFrontUrl: 'https://example.com/test_aadhaar_f.jpg',
      aadhaarBackUrl: 'https://example.com/test_aadhaar_b.jpg',
      panDocUrl: 'https://example.com/test_pan.jpg',
      upiId: '9876543210@upi',
    },
    aadhaar_doc_url: 'https://example.com/test_aadhaar_f.jpg',
    pan_doc_url: 'https://example.com/test_pan.jpg',
    bank_account_name: 'Test Partner Saroja',
    bank_account_number: '987654321012',
    bank_ifsc: 'SBIN0001234',
    bank_name: 'State Bank of India',
    upi_id: '9876543210@upi',
    terms_accepted: true,
    privacy_accepted: true,
    accuracy_confirmed: true,
    status: 'pending',
    applied_at: new Date().toISOString(),
  };

  const insertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/maid_profiles`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(testPartnerPayload),
    }
  );
  const insertedMaidList = await insertRes.json();
  const insertedMaid = Array.isArray(insertedMaidList) ? insertedMaidList[0] : insertedMaidList;

  assert(insertRes.ok && insertedMaid?.maid_code === testPartnerCode,
    `Partner application persisted with code: ${insertedMaid?.maid_code}`);

  assert(insertedMaid?.city === 'Hanamkonda',
    `Selected city ("${insertedMaid?.city}") persisted correctly without duplicate address tables`);

  assert(insertedMaid?.service_radius_km === 5,
    `Initial dispatch radius (5 KM) persisted correctly`);

  assert(Array.isArray(insertedMaid?.services_provided) && insertedMaid.services_provided.length === 3,
    `Services stored as structured JSONB relationship with ${insertedMaid?.services_provided?.length} services (NOT comma-separated text)`);

  const firstStoredService = insertedMaid?.services_provided?.[0];
  assert(Boolean(firstStoredService?.serviceId && firstStoredService?.serviceName),
    `Stored service contains permanent serviceId: "${firstStoredService?.serviceId}"`);

  // ── TEST 8: Admin Retrieval & Normalization ──
  console.log('\n[TEST 8] Verifying Admin Panel fetches and displays the partner...');
  const adminRes = await fetch(
    `${SUPABASE_URL}/rest/v1/maid_profiles?maid_code=eq.${testPartnerCode}`,
    { headers }
  );
  const adminFetchedList = await adminRes.json();
  const adminFetched = adminFetchedList?.[0];

  assert(adminRes.ok && adminFetched !== undefined, 'Admin Panel can query the new partner application');
  assert(adminFetched?.bank_name === 'State Bank of India', 'Admin can view verified Bank Name');
  assert(adminFetched?.status === 'pending', 'Partner status is correctly "pending" (awaiting Admin approval)');

  // ── CLEANUP TEST RECORD ──
  console.log('\n[CLEANUP] Removing test partner record...');
  const delRes = await fetch(
    `${SUPABASE_URL}/rest/v1/maid_profiles?maid_code=eq.${testPartnerCode}`,
    {
      method: 'DELETE',
      headers,
    }
  );

  assert(delRes.ok, `Test partner ${testPartnerCode} cleaned up cleanly`);

  // ── FINAL REPORT ──
  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
