import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBookingInsertAndRead() {
  const generatedCode = 'GC-TEST-' + Date.now();
  console.log('Testing insert with code:', generatedCode);

  const { data: insertData, error: insertError } = await supabase.from('bookings').insert([
    {
      booking_code: generatedCode,
      customer_id: null,
      customer_name: 'Audit Automated Test Customer',
      customer_phone: '+91 99999 11111',
      service_id: null,
      service_name: 'Deep Cleaning Test',
      service_price: 1499,
      total_amount: 1499,
      address_label: 'Home',
      address_street: 'Flat 402, Green Valley',
      address_locality: 'Madhapur',
      address_city: 'Hyderabad',
      address_pincode: '500081',
      scheduled_date: '2026-09-25',
      time_slot: '10:00 AM - 12:00 PM',
      status: 'pending_assignment',
      payment_method: 'online',
      payment_status: 'paid',
      start_otp: '4567',
    }
  ]).select();

  console.log('Insert Result:', insertData, insertError);

  if (insertData && insertData.length > 0) {
    const id = insertData[0].id;
    console.log('Reading back booking by ID:', id);
    const { data: readData, error: readError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id);
    console.log('Read Result:', readData, readError);

    // Clean up test booking
    console.log('Cleaning up test booking...');
    const { error: delError } = await supabase.from('bookings').delete().eq('id', id);
    console.log('Delete Result:', delError ? delError.message : 'Deleted cleanly');
  }
}

testBookingInsertAndRead();
