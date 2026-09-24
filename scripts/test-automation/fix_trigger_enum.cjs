const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixTriggerEnum() {
  console.log('Testing booking status update with existing columns...');

  const code = 'GC-TEST-' + Date.now();
  const { data: bData, error: bErr } = await supabase
    .from('bookings')
    .insert({
      booking_code: code,
      customer_name: 'Test Customer',
      customer_phone: '+919988776655',
      service_name: 'Water Tank Cleaning',
      total_amount: 500,
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'pending_assignment',
      admin_approval_status: 'pending',
      assignment_status: 'unassigned'
    })
    .select()
    .single();

  console.log('Insert result:', bData ? bData.booking_code : bErr);

  if (bData && bData.id) {
    const { data: uData, error: uErr } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        admin_approval_status: 'approved',
        assignment_status: 'assigned',
        completed_at: new Date().toISOString()
      })
      .eq('id', bData.id)
      .select();

    console.log('Update result:', uData ? uData[0]?.status : uErr);
    await supabase.from('bookings').delete().eq('id', bData.id);
  }
}

fixTriggerEnum();
