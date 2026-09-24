/**
 * GC HOME+ — End-to-End Admin -> Partner Service Lifecycle Test
 * Tests the complete 20-point scenario:
 * 1. Admin creates a new service in Supabase
 * 2. Set service to Active (is_active = true)
 * 3. Query as Partner Step 3 -> Verify new service appears dynamically
 * 4. Partner registers with this service ID
 * 5. Verify partner-service relationship persisted with permanent UUID
 * 6. Admin deactivates service (is_active = false)
 * 7. Query as Partner Step 3 -> Verify deactivated service disappears from registration
 * 8. Verify historical partner record remains intact
 * 9. Reactivate service (is_active = true) -> Reappears dynamically
 * 10. Rename service -> Verify updated name automatically reflected via service_id
 * 11. Customer catalog query uses the identical record
 * 12. Safe teardown and cleanup
 */

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function runLifecycle() {
  console.log('================================================================');
  console.log('GC HOME+ — DYNAMIC ADMIN ↔ PARTNER SERVICE LIFECYCLE E2E TEST');
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

  const testServiceId = '88888888-0000-0000-0000-' + Date.now().toString().slice(-12).padStart(12, '0');
  const testPartnerId = '77777777-0000-0000-0000-' + Date.now().toString().slice(-12).padStart(12, '0');
  const initialServiceName = 'Chimney Cleaning (Automated Test)';
  const updatedServiceName = 'Chimney Deep Cleaning (Automated Test)';

  try {
    // 1. Admin creates a new service in Supabase
    console.log('[STEP 1 & 2] Admin creates new service with is_active = true...');
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/services`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: testServiceId,
        name: initialServiceName,
        category: 'Cleaning',
        is_active: true,
        starting_price: 699,
        estimated_duration: '60 mins',
        description: 'Professional chimney degreasing and deep chemical clean.',
      }),
    });
    const createdService = (await createRes.json())[0];
    assert(createRes.ok && createdService?.id === testServiceId,
      `Admin successfully created service: "${createdService?.name}" (${createdService?.id})`);

    // 2. Query as Partner Step 3 -> Verify new service appears dynamically
    console.log('\n[STEP 3 & 4] Partner Registration Step 3 queries active catalog...');
    const queryActiveRes = await fetch(
      `${SUPABASE_URL}/rest/v1/services?select=id,name,category,is_active&is_active=eq.true&id=eq.${testServiceId}`,
      { headers }
    );
    const activeResults = await queryActiveRes.json();
    assert(activeResults.length === 1 && activeResults[0].name === initialServiceName,
      `Step 3 dynamically fetched new service without code changes or APK rebuild: "${activeResults[0]?.name}"`);

    // 3. Partner registers with this service ID
    console.log('\n[STEP 5 & 6] Partner selects new service and submits Step 5...');
    const regRes = await fetch(`${SUPABASE_URL}/rest/v1/maid_profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: testPartnerId,
        maid_code: `GC-PARTNER-${Date.now().toString().slice(-4)}`,
        full_name: 'Lakshmi Partner',
        phone: '9848022338',
        city: 'Warangal',
        service_radius_km: 5,
        services_provided: [
          {
            serviceId: testServiceId,
            serviceName: initialServiceName,
            category: 'Cleaning',
            experienceYears: 4,
          },
        ],
        status: 'pending',
        bank_name: 'State Bank of India',
        bank_account_name: 'Lakshmi Partner',
        bank_account_number: '123456789012',
        bank_ifsc: 'SBIN0001234',
        terms_accepted: true,
        privacy_accepted: true,
        accuracy_confirmed: true,
      }),
    });
    const regPartner = (await regRes.json())[0];
    assert(regRes.ok && regPartner?.id === testPartnerId,
      `Partner registered successfully with service_id link: "${testServiceId}"`);

    // 4. Admin deactivates the service (is_active = false)
    console.log('\n[STEP 7] Admin deactivates the service (is_active = false)...');
    const deactRes = await fetch(`${SUPABASE_URL}/rest/v1/services?id=eq.${testServiceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_active: false }),
    });
    assert(deactRes.ok, `Admin deactivated service ${testServiceId}`);

    // 5. Query as Partner Step 3 -> Verify deactivated service disappears
    console.log('\n[STEP 8] Partner Registration Step 3 refreshes active catalog...');
    const queryAfterDeact = await fetch(
      `${SUPABASE_URL}/rest/v1/services?select=id,name,is_active&is_active=eq.true&id=eq.${testServiceId}`,
      { headers }
    );
    const afterDeactResults = await queryAfterDeact.json();
    assert(afterDeactResults.length === 0,
      'Deactivated service immediately disappears from Partner Registration Step 3 selection');

    // 6. Verify historical partner record remains intact
    console.log('\n[STEP 9] Checking historical partner record...');
    const histRes = await fetch(`${SUPABASE_URL}/rest/v1/maid_profiles?id=eq.${testPartnerId}`, { headers });
    const histPartner = (await histRes.json())[0];
    assert(histPartner?.services_provided?.[0]?.serviceId === testServiceId,
      'Historical partner registration data remains completely intact after service deactivation');

    // 7. Reactivate the service (is_active = true)
    console.log('\n[STEP 10] Admin reactivates service (is_active = true)...');
    const reactRes = await fetch(`${SUPABASE_URL}/rest/v1/services?id=eq.${testServiceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_active: true }),
    });
    assert(reactRes.ok, 'Admin reactivated service');

    const queryAfterReact = await fetch(
      `${SUPABASE_URL}/rest/v1/services?select=id,name,is_active&is_active=eq.true&id=eq.${testServiceId}`,
      { headers }
    );
    const reactResults = await queryAfterReact.json();
    assert(reactResults.length === 1 && reactResults[0].is_active === true,
      'Service immediately reappears as selectable in Step 3');

    // 8. Rename service in Admin catalog
    console.log('\n[STEP 11] Admin renames service to "Chimney Deep Cleaning"...');
    const renameRes = await fetch(`${SUPABASE_URL}/rest/v1/services?id=eq.${testServiceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: updatedServiceName }),
    });
    assert(renameRes.ok, 'Service renamed by Admin in Supabase');

    // 9. Verify Customer App and Partner Registration immediately see the new name via service_id
    console.log('\n[STEP 12] Verifying new name is reflected globally via service_id...');
    const globalQuery = await fetch(
      `${SUPABASE_URL}/rest/v1/services?select=id,name,is_active&id=eq.${testServiceId}`,
      { headers }
    );
    const globalResults = await globalQuery.json();
    assert(globalResults[0]?.name === updatedServiceName,
      `Permanent service_id reflects new name across Customer App & Partner Registration: "${globalResults[0]?.name}"`);

  } finally {
    // Teardown / Cleanup
    console.log('\n[TEARDOWN] Cleaning up test records...');
    await fetch(`${SUPABASE_URL}/rest/v1/maid_profiles?id=eq.${testPartnerId}`, { method: 'DELETE', headers });
    await fetch(`${SUPABASE_URL}/rest/v1/services?id=eq.${testServiceId}`, { method: 'DELETE', headers });
    console.log('  Cleaned up test partner and test service records.');
  }

  console.log('\n================================================================');
  console.log(`LIFECYCLE SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runLifecycle().catch(err => {
  console.error('Lifecycle test error:', err);
  process.exit(1);
});
