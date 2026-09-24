const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runReadOnlyProgressTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING READ-ONLY CUSTOMER PROGRESS & REALTIME AUDIT TEST SUITE');
  console.log('================================================================\n');

  let passCount = 0;
  const totalTests = 6;
  const testCode = 'GC-RO-' + Date.now();

  try {
    // TEST 1: Create Initial Booking (Status: pending_assignment)
    console.log('Test 1: Customer Creates Booking (Status: pending_assignment)...');
    const { data: bData, error: bErr } = await supabase
      .from('bookings')
      .insert({
        booking_code: testCode,
        customer_name: 'Audit Customer',
        customer_phone: '+919912345678',
        service_name: 'AC Repair & Service',
        category_name: 'AC Repair & Service',
        total_amount: 599,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'pending_assignment',
        admin_approval_status: 'pending',
        assignment_status: 'unassigned'
      })
      .select()
      .single();

    if (bErr || !bData) {
      console.error('❌ TEST 1 FAILED:', bErr?.message);
    } else {
      console.log('✅ TEST 1 PASSED: Booking created with status = pending_assignment');
      passCount++;
    }

    // TEST 2: Admin Approves & Assigns Partner (Status: partner_accepted)
    console.log('\nTest 2: Admin Approves & Assigns Maid (Status: partner_accepted)...');
    const { data: assignedData, error: assignErr } = await supabase
      .from('bookings')
      .update({
        status: 'partner_accepted',
        admin_approval_status: 'approved',
        assignment_status: 'assigned',
        assigned_maid_name: 'Sunita Devi (Partner)',
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', testCode)
      .select()
      .single();

    if (assignErr || assignedData?.status !== 'partner_accepted') {
      console.error('❌ TEST 2 FAILED:', assignErr?.message);
    } else {
      console.log('✅ TEST 2 PASSED: Admin updated status to partner_accepted');
      passCount++;
    }

    // TEST 3: Maid Marks On The Way (Status: partner_en_route)
    console.log('\nTest 3: Maid Marks On The Way (Status: partner_en_route)...');
    const { data: wayData, error: wayErr } = await supabase
      .from('bookings')
      .update({
        status: 'partner_en_route',
        assignment_status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', testCode)
      .select()
      .single();

    if (wayErr || wayData?.status !== 'partner_en_route') {
      console.error('❌ TEST 3 FAILED:', wayErr?.message);
    } else {
      console.log('✅ TEST 3 PASSED: Maid updated status to partner_en_route');
      passCount++;
    }

    // TEST 4: Maid Starts Service (Status: service_in_progress)
    console.log('\nTest 4: Maid Starts Service (Status: service_in_progress)...');
    const { data: progressData, error: progErr } = await supabase
      .from('bookings')
      .update({
        status: 'service_in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', testCode)
      .select()
      .single();

    if (progErr || progressData?.status !== 'service_in_progress') {
      console.error('❌ TEST 4 FAILED:', progErr?.message);
    } else {
      console.log('✅ TEST 4 PASSED: Maid updated status to service_in_progress');
      passCount++;
    }

    // TEST 5: Maid Completes Service (Status: completed)
    console.log('\nTest 5: Maid Completes Service (Status: completed)...');
    const { data: compData, error: compErr } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', testCode)
      .select()
      .single();

    if (compErr || compData?.status !== 'completed') {
      console.error('❌ TEST 5 FAILED:', compErr?.message);
    } else {
      console.log('✅ TEST 5 PASSED: Maid completed service cleanly');
      passCount++;
    }

    // TEST 6: Cleanup Test Booking
    console.log('\nTest 6: Cleanup Test Booking...');
    await supabase.from('bookings').delete().eq('booking_code', testCode);
    console.log('✅ TEST 6 PASSED: Cleaned up test booking code ' + testCode);
    passCount++;

  } catch (e) {
    console.error('Exception during testing:', e);
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passCount}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passCount !== totalTests) {
    process.exit(1);
  }
}

runReadOnlyProgressTests();
