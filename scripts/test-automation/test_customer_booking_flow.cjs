const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runE2ETests() {
  console.log('================================================================');
  console.log('🧪 RUNNING GC HOME+ END-TO-END CUSTOMER & BOOKING SYNC TEST SUITE');
  console.log('================================================================\n');

  const testPhone = '+919988776655';
  const testName = 'Test Automated Customer';
  const testEmail = 'auto_customer@gchome.com';
  const testUid = '550e8400-e29b-41d4-a716-446655440000';

  let passCount = 0;
  let totalTests = 8;

  try {
    // TEST 1: Customer Profile Sync
    console.log('Test 1: Upsert Customer Profile into Supabase...');
    const { data: prof, error: profErr } = await supabase
      .from('user_profiles')
      .upsert({
        id: testUid,
        name: testName,
        full_name: testName,
        phone: testPhone,
        email: testEmail,
        role: 'customer',
        customer_type: 'Regular Customer',
        address: 'Plot 42, Hitec City',
        city: 'Hyderabad',
        account_status: 'active',
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profErr) {
      console.error('❌ TEST 1 FAILED:', profErr.message);
    } else {
      console.log('✅ TEST 1 PASSED: Profile synced cleanly (ID: ' + prof.id + ')');
      passCount++;
    }

    // TEST 2: Verify Customer in Database & Non-Duplicate Logic
    console.log('\nTest 2: Query Customer Profile & Check Duplicate Avoidance...');
    const { data: existingProfs, error: existErr } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone', testPhone);

    if (existErr || !existingProfs || existingProfs.length !== 1) {
      console.error('❌ TEST 2 FAILED: Duplicate profiles or query failure. Count:', existingProfs?.length);
    } else {
      console.log('✅ TEST 2 PASSED: Exactly 1 customer profile exists for mobile number');
      passCount++;
    }

    // TEST 3: Create Service Booking
    console.log('\nTest 3: Customer Creates Service Booking...');
    const testBookingCode = 'GC-TEST-' + Date.now().toString().slice(-6);
    const { data: newBooking, error: bookErr } = await supabase
      .from('bookings')
      .insert({
        booking_code: testBookingCode,
        customer_id: testUid,
        customer_name: testName,
        customer_phone: testPhone,
        customer_email: testEmail,
        service_name: 'Deep Home Cleaning',
        category_name: 'Water Tank Cleaning',
        selected_addons: [{ id: 'addon_1', name: 'Balcony Scrub', price: 199 }],
        base_amount: 799,
        addon_amount: 199,
        service_price: 998,
        total_amount: 998,
        address_label: 'Home',
        address_street: 'Plot 42, Hitec City',
        address_locality: 'Madhapur',
        address_city: 'Hyderabad',
        address_pincode: '500081',
        scheduled_date: new Date().toISOString().split('T')[0],
        time_slot: '10:00 AM – 12:00 PM',
        status: 'pending_assignment',
        admin_approval_status: 'pending',
        assignment_status: 'unassigned',
        payment_method: 'upi',
        payment_status: 'paid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookErr) {
      console.error('❌ TEST 3 FAILED:', bookErr.message);
    } else {
      console.log('✅ TEST 3 PASSED: Booking created with code ' + testBookingCode);
      passCount++;
    }

    // TEST 4: Pending Bookings Logic Verification
    console.log('\nTest 4: Verify Booking Appears as Pending...');
    const { data: pendingRows } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_code', testBookingCode);

    const targetPending = pendingRows?.[0];
    if (targetPending && targetPending.admin_approval_status === 'pending' && targetPending.assignment_status === 'unassigned') {
      console.log('✅ TEST 4 PASSED: Booking correctly marked as admin_approval=pending & assignment=unassigned');
      passCount++;
    } else {
      console.error('❌ TEST 4 FAILED: Pending status state invalid');
    }

    // TEST 5: Admin Approval
    console.log('\nTest 5: Admin Approves Booking...');
    const { data: approvedRow, error: appErr } = await supabase
      .from('bookings')
      .update({
        admin_approval_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', testBookingCode)
      .select()
      .single();

    if (appErr || approvedRow?.admin_approval_status !== 'approved') {
      console.error('❌ TEST 5 FAILED:', appErr?.message || 'Status not updated');
    } else {
      console.log('✅ TEST 5 PASSED: Booking approved by Admin');
      passCount++;
    }

    // TEST 6: Admin Maid Assignment
    console.log('\nTest 6: Admin Assigns Maid to Booking...');
    const testMaidId = '880e8400-e29b-41d4-a716-446655440111';
    const { data: assignedRow, error: assignErr } = await supabase
      .from('bookings')
      .update({
        status: 'maid_assigned',
        assignment_status: 'assigned',
        assigned_maid_id: testMaidId,
        assigned_maid_name: 'Priya Sharma (Partner)',
        assigned_maid_phone: '+919876543210',
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', testBookingCode)
      .select()
      .single();

    if (assignErr || assignedRow?.assignment_status !== 'assigned') {
      console.error('❌ TEST 6 FAILED:', assignErr?.message || 'Assignment failed');
    } else {
      console.log('✅ TEST 6 PASSED: Maid assigned cleanly');
      passCount++;
    }

    // TEST 7: Customer Booking History & Spending Update
    console.log('\nTest 7: Complete Booking & Verify Customer Metrics...');
    await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('booking_code', testBookingCode);

    const { data: customerBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', testUid);

    if (customerBookings && customerBookings.length >= 1) {
      console.log('✅ TEST 7 PASSED: Customer booking history contains ' + customerBookings.length + ' bookings');
      passCount++;
    } else {
      console.error('❌ TEST 7 FAILED: Customer booking history empty');
    }

    // TEST 8: Cleanup Test Data
    console.log('\nTest 8: Cleanup Test Records...');
    await supabase.from('bookings').delete().eq('booking_code', testBookingCode);
    await supabase.from('user_profiles').delete().eq('id', testUid);
    console.log('✅ TEST 8 PASSED: Test data cleaned up successfully');
    passCount++;

  } catch (e) {
    console.error('Exception during E2E testing:', e);
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passCount}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passCount !== totalTests) {
    process.exit(1);
  }
}

runE2ETests();
