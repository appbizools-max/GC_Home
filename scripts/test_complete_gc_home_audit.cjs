const { createClient } = require('../user-app/node_modules/@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../admin-panel/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(https:\/\/[^\s]+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/);
const anonMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\s]+)/);

const SUPABASE_URL = urlMatch[1].trim();
const SERVICE_KEY = keyMatch[1].trim();
const ANON_KEY = anonMatch[1].trim();

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);

async function runAudit() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       GC HOME+ — FULL SYSTEM E2E AUDIT & VERIFICATION        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const issues = [];

  function report(pass, testName, detail = '') {
    if (pass) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${testName}${detail ? ' — ' + detail : ''}`);
      failed++;
      issues.push({ testName, detail });
    }
  }

  // 1. SERVICE CATALOG AUDIT
  console.log('━━━ PHASE 1: SERVICE CATALOG & ASSETS AUDIT ━━━━━━━━━━━━━━━━━');
  const { data: services, error: srvErr } = await supabase.from('services').select('*');
  report(!srvErr && services && services.length >= 60, 'Services Catalog Active', `${services?.length} services found`);

  const { data: categories, error: catErr } = await supabase.from('service_categories').select('*');
  report(!catErr && categories && categories.length >= 8, 'Service Categories Active', `${categories?.length} categories found`);

  const { data: addons, error: addErr } = await supabase.from('service_addons').select('*');
  report(!addErr && addons && addons.length >= 40, 'Service Add-ons Active', `${addons?.length} addons found`);

  const { data: banners, error: banErr } = await supabase.from('homepage_banners').select('*');
  report(!banErr && banners && banners.length > 0, 'Homepage Banners Active', `${banners?.length} banners found`);

  // 2. SERVICE AREAS & COVERAGE AUDIT
  console.log('\n━━━ PHASE 2: SERVICE AREAS & COVERAGE ━━━━━━━━━━━━━━━━━━━━━━━');
  const { data: areas, error: areaErr } = await supabase.from('service_areas').select('*');
  report(!areaErr && areas, 'Service Areas Table Accessible');
  const activeAreas = (areas || []).filter(a => a.is_active);
  console.log(`     Active serviceable areas: ${activeAreas.map(a => `${a.city} (${a.pincode})`).join(', ')}`);

  // 3. ADMIN AUTH GATE
  console.log('\n━━━ PHASE 3: ADMIN ACCESS & SECURITY ━━━━━━━━━━━━━━━━━━━━━━━━');
  const { data: admins, error: admErr } = await supabase.from('admin_users').select('*');
  report(!admErr && admins && admins.length > 0, 'Super Admin Account Configured', `Admins: ${admins?.map(a => a.email).join(', ')}`);

  // 4. SIMULATE END-TO-END FLOW: CUSTOMER -> BOOKING -> MAID -> ASSIGNMENT
  console.log('\n━━━ PHASE 4: TRANSACTIONAL WORKFLOW SIMULATION ━━━━━━━━━━━━━');
  const testPhone = '+91 99988 77766';
  const testMaidPhone = '+91 99988 55544';

  // 4a. Create Customer
  const testCustomerId = '11111111-2222-3333-4444-555555555555';
  const { data: cust, error: custErr } = await supabase.from('user_profiles').upsert({
    id: testCustomerId,
    full_name: 'Audit Customer',
    name: 'Audit Customer',
    phone: testPhone,
    role: 'customer',
    city: 'Warangal',
    state: 'Telangana',
    address: 'Hanamkonda, Warangal'
  }).select().single();
  report(!custErr && cust, 'Customer Profile Creation', custErr?.message);

  // 4b. Create Maid Partner
  const testMaidId = '22222222-3333-4444-5555-666666666666';
  const firstService = services?.[0];
  const { data: maid, error: maidErr } = await supabase.from('maid_profiles').upsert({
    id: testMaidId,
    maid_code: 'GC-AUDIT-001',
    full_name: 'Audit Cleaner Partner',
    phone: testMaidPhone,
    status: 'approved',
    application_status: 'approved',
    is_online: true,
    rating: 4.9,
    service_area: 'Hanamkonda',
    skills: [firstService?.name || 'Cleaning'],
    services_provided: [{ serviceId: firstService?.id, serviceName: firstService?.name }],
    verification_status: { step1_personal: { status: 'verified' } }
  }).select().single();
  report(!maidErr && maid, 'Maid Partner Registration & Approval', maidErr?.message);

  // 4c. Create Customer Booking
  const testBookingCode = 'GC-AUDIT-' + Math.floor(10000 + Math.random() * 90000);
  const { data: booking, error: bookErr } = await supabase.from('bookings').insert({
    booking_code: testBookingCode,
    customer_id: testCustomerId,
    customer_name: 'Audit Customer',
    customer_phone: testPhone,
    service_id: firstService?.id,
    service_name: firstService?.name || 'Deep Cleaning',
    service_price: firstService?.starting_price || 499,
    total_amount: (firstService?.starting_price || 499) + 50,
    address_label: 'Home',
    address_locality: 'Hanamkonda',
    address_city: 'Warangal',
    address_pincode: '506001',
    service_state: 'Telangana',
    scheduled_date: new Date().toISOString().split('T')[0],
    time_slot: '10:00 AM – 12:00 PM',
    status: 'pending_assignment',
    admin_approval_status: 'pending',
    assignment_status: 'unassigned',
    payment_method: 'cash',
    payment_status: 'pending'
  }).select().single();
  report(!bookErr && booking, 'Customer Service Booking Creation', bookErr?.message);

  // 4d. Booking Items Sync
  if (booking) {
    const { error: itemErr } = await supabase.from('booking_items').insert({
      booking_id: booking.id,
      service_id: firstService?.id,
      service_name: firstService?.name,
      quantity: 1,
      unit_price: firstService?.starting_price || 499,
      subtotal: firstService?.starting_price || 499
    });
    report(!itemErr, 'Booking Items Multi-Service Sync', itemErr?.message);
  }

  // 4e. Admin Approves Booking
  console.log('\n━━━ PHASE 5: ADMIN ASSIGNMENT & DISPATCH WORKFLOW ━━━━━━━━━━');
  let adminApproveOk = false;
  if (booking) {
    const { data: appRow, error: appErr } = await supabase
      .from('bookings')
      .update({ admin_approval_status: 'approved' })
      .eq('id', booking.id)
      .select();
    if (!appErr && appRow && appRow.length > 0) {
      adminApproveOk = true;
      report(true, 'Admin Booking Approval (admin_approval_status = approved)');
    } else {
      report(false, 'Admin Booking Approval (admin_approval_status = approved)', appErr?.message);
    }
  }

  // 4f. Admin Sends Assignment Request to Partner
  let assignOk = false;
  if (booking && maid) {
    // Insert into partner_assignments
    const { data: assignRec, error: assignErr } = await supabase
      .from('partner_assignments')
      .insert({
        booking_id: booking.id,
        partner_id: maid.id,
        assignment_type: 'admin',
        response_status: 'pending',
        distance_km: 2.5
      })
      .select()
      .single();
    report(!assignErr && assignRec, 'Partner Assignment Request (partner_assignments INSERT)', assignErr?.message);

    // Notify Partner
    const { error: notifErr } = await supabase
      .from('notifications')
      .insert({
        recipient_id: maid.id,
        recipient_role: 'maid',
        title: 'New Job Request',
        message: `New booking request for ${booking.service_name}`,
        related_booking_id: booking.id,
        category: 'dispatch'
      });
    report(!notifErr, 'Partner Job Dispatch Notification', notifErr?.message);

    // Update booking candidate maid
    const { error: linkErr } = await supabase
      .from('bookings')
      .update({
        assigned_maid_id: maid.id,
        assigned_maid_name: maid.full_name,
        assigned_maid_phone: maid.phone
      })
      .eq('id', booking.id);
    report(!linkErr, 'Booking Links Assigned Partner Details', linkErr?.message);

    // Partner Accepts Assignment
    const { error: acceptErr } = await supabase
      .from('partner_assignments')
      .update({
        response_status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', assignRec?.id);
    report(!acceptErr, 'Partner Accepts Job Assignment', acceptErr?.message);
  }

  // 5. CLEANUP TEST DATA
  console.log('\n━━━ PHASE 6: AUDIT TEARDOWN & CLEANUP ━━━━━━━━━━━━━━━━━━━━━━');
  if (booking) {
    await supabase.from('partner_assignments').delete().eq('booking_id', booking.id);
    await supabase.from('booking_items').delete().eq('booking_id', booking.id);
    await supabase.from('notifications').delete().eq('recipient_id', testMaidId);
    await supabase.from('bookings').delete().eq('id', booking.id);
  }
  await supabase.from('maid_profiles').delete().eq('id', testMaidId);
  await supabase.from('user_profiles').delete().eq('id', testCustomerId);
  console.log('  🧹 Temporary audit simulation records removed cleanly.');

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║ AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (issues.length > 0) {
    console.log('Detected Issues:');
    issues.forEach(i => console.log(`  ❌ ${i.testName}: ${i.detail}`));
  }
}

runAudit().catch(console.error);
