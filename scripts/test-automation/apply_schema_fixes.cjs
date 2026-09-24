const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyFixes() {
  console.log('Applying schema compatibility checks...');
  
  // Test upsert into user_profiles
  const testId = '550e8400-e29b-41d4-a716-446655440000';
  const { data: pData, error: pErr } = await supabase
    .from('user_profiles')
    .upsert({
      id: testId,
      name: 'Test Customer',
      full_name: 'Test Customer',
      phone: '+919988776655',
      email: 'test@example.com',
      role: 'customer',
      city: 'Hyderabad',
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select();

  if (pErr) {
    console.error('user_profiles insert notice:', pErr);
  } else {
    console.log('user_profiles insert success:', pData?.[0]?.id);
  }

  // Test insert into bookings
  const testCode = 'GC-TEST-' + Date.now();
  const { data: bData, error: bErr } = await supabase
    .from('bookings')
    .insert({
      booking_code: testCode,
      customer_id: testId,
      customer_name: 'Test Customer',
      customer_phone: '+919988776655',
      service_name: 'Test Service',
      total_amount: 500,
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'pending_assignment',
      admin_approval_status: 'pending',
      assignment_status: 'unassigned'
    })
    .select();

  if (bErr) {
    console.error('bookings insert notice:', bErr);
  } else {
    console.log('bookings insert success:', bData?.[0]?.id || bData?.[0]?.booking_code);
  }

  // Cleanup test rows
  await supabase.from('bookings').delete().eq('booking_code', testCode);
  await supabase.from('user_profiles').delete().eq('id', testId);
}

applyFixes();
