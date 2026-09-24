const { createClient } = require('../../admin-panel/node_modules/@supabase/supabase-js');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runPartnerRegistrationFlowTest() {
  console.log('====================================================');
  console.log('GC HOME+ PARTNER REGISTRATION & ADMIN WORKFLOW E2E TEST');
  console.log('====================================================\n');

  const testPartnerId = '00000000-0000-0000-0000-999988887777';
  const partnerCode = `GC-PARTNER-TEST-${Date.now()}`;

  try {
    // 1. Submit Partner Application
    console.log('[STEP 1] Submitting Partner Application with multi-services...');
    const registrationPayload = {
      id: testPartnerId,
      maid_code: partnerCode,
      full_name: 'Saroja Devi (Automated Test)',
      phone: '+91 99887 76655',
      email: 'saroja.test@gchome.com',
      date_of_birth: '1996-08-20',
      gender: 'Female',
      emergency_contact: 'Ramesh Devi (+91 98765 43210)',
      address: 'Flat 302, Sunrise Apts, HSR Layout, Bengaluru 560102',
      city: 'Bengaluru',
      service_area: 'HSR Layout & Surrounding 10km',
      service_radius_km: 10,
      working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      skills: [
        JSON.stringify({ serviceName: 'Deep Cleaning', experienceYears: 4, experienceMonths: 2, description: 'Specialized kitchen & bath deep sanitation' }),
        JSON.stringify({ serviceName: 'Sofa Shampooing', experienceYears: 2, experienceMonths: 6, description: 'Fabric & leather couch cleaning' }),
      ],
      languages: ['Telugu', 'Hindi', 'English', 'Kannada'],
      kyc_documents: {
        aadhaarFrontUrl: 'https://example.com/aadhaar_front.jpg',
        aadhaarBackUrl: 'https://example.com/aadhaar_back.jpg',
        panDocUrl: 'https://example.com/pan.jpg',
        addressProofUrl: 'https://example.com/address_proof.jpg',
        upiId: 'saroja@upi',
        termsAccepted: true,
        privacyAccepted: true,
        accuracyConfirmed: true,
      },
      bank_account_name: 'Saroja Devi',
      bank_account_number: '987654321098',
      bank_ifsc: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      status: 'pending',
      applied_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await client
      .from('maid_profiles')
      .upsert(registrationPayload)
      .select();

    if (insertError) throw insertError;
    console.log(' [PASS] Application submitted successfully. Registered ID:', inserted[0].id, 'Maid Code:', inserted[0].maid_code);

    // 2. Admin Fetch & Verification
    console.log('\n[STEP 2] Simulating Admin Review in Maid Management...');
    const { data: fetchedList, error: fetchError } = await client
      .from('maid_profiles')
      .select('*')
      .eq('id', testPartnerId);

    if (fetchError || !fetchedList || fetchedList.length === 0) throw new Error('Failed to fetch submitted partner in Admin Review');
    const fetched = fetchedList[0];

    if (fetched.full_name !== 'Saroja Devi (Automated Test)') throw new Error('Name mismatch in Admin review');
    if (!Array.isArray(fetched.skills) || fetched.skills.length !== 2) throw new Error('Multi-service count mismatch');
    console.log(' [PASS] Admin successfully loaded partner profile with 2 multi-services in skills array!');

    // 3. Admin Request Correction Test
    console.log('\n[STEP 3] Simulating Admin Requesting Correction...');
    const { error: correctionError } = await client
      .from('maid_profiles')
      .update({
        status: 'pending',
        kyc_status: 'incomplete',
        admin_notes: 'Correction requested: Please upload clearer PAN Card photo',
        updated_at: new Date().toISOString(),
      })
      .eq('id', testPartnerId);

    if (correctionError) throw correctionError;

    const { data: correctionFetch } = await client.from('maid_profiles').select('*').eq('id', testPartnerId);
    if (correctionFetch[0].kyc_status !== 'incomplete') throw new Error('Status failed to update to incomplete');
    console.log(' [PASS] Correction request registered! Status:', correctionFetch[0].status, '| KYC Status:', correctionFetch[0].kyc_status, '| Admin Note:', correctionFetch[0].admin_notes);

    // 4. Admin Final Approval Test
    console.log('\n[STEP 4] Simulating Admin Final Approval & Partner Activation...');
    const { error: approveError } = await client
      .from('maid_profiles')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', testPartnerId);

    if (approveError) throw approveError;

    const { data: approvedFetch } = await client.from('maid_profiles').select('*').eq('id', testPartnerId);
    if (approvedFetch[0].status !== 'approved') throw new Error('Status failed to update to approved');
    console.log(' [PASS] Partner application approved & activated! Status:', approvedFetch[0].status);

    // Cleanup
    await client.from('maid_profiles').delete().eq('id', testPartnerId);
    console.log('\n====================================================');
    console.log('PARTNER REGISTRATION E2E TEST: ALL STEPS PASSED!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n[FAIL] Test Error:', err.message);
    process.exit(1);
  }
}

runPartnerRegistrationFlowTest();
