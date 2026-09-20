import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsertAndQuery() {
  console.log('--- Testing Services Query ---');
  const { data: services, error: sErr } = await supabase.from('services').select('*').limit(3);
  console.log('Services:', services?.length, sErr);

  console.log('--- Testing Settings Query ---');
  const { data: settings, error: setErr } = await supabase.from('platform_settings').select('*');
  console.log('Settings:', settings?.length, setErr);

  console.log('--- Testing Booking Insert (Anon) ---');
  const testBooking = {
    booking_code: 'GC-TEST-' + Math.floor(Math.random() * 10000),
    service_id: null,
    customer_id: null,
    customer_name: 'Test Audit User',
    customer_phone: '+919999988888',
    service_name: services?.[0]?.name || 'Deep Cleaning',
    address_street: 'Test Street, Madhapur',
    address_locality: 'Madhapur',
    address_city: 'Hyderabad',
    address_pincode: '500081',
    scheduled_date: '2026-09-25',
    time_slot: '10:00 AM - 12:00 PM',
    status: 'pending_assignment',
    payment_status: 'paid',
    payment_method: 'online',
    total_amount: 999.00
  };

  const { data: bData, error: bErr } = await supabase.from('bookings').insert(testBooking).select();
  console.log('Booking Insert Result:', bData ? `Success (Code: ${bData[0]?.booking_code})` : null, bErr);

  if (bData && bData.length > 0) {
    await supabase.from('bookings').delete().eq('id', bData[0].id);
    console.log('Cleaned up test booking row.');
  }

  console.log('--- Testing Maid Profiles Query ---');
  const { data: maids, error: mErr } = await supabase.from('maid_profiles').select('*');
  console.log('Maids:', maids?.length, mErr);
}

testInsertAndQuery();
