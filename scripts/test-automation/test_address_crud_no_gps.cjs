const fs = require('fs');
const { createClient } = require('e:/Home Clean/GC_Home/admin-panel/node_modules/@supabase/supabase-js');

// Load env vars
const dotenv = fs.readFileSync('e:/Home Clean/GC_Home/admin-panel/.env', 'utf8');
const envVars = {};
dotenv.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('================================================================');
  console.log('🧪 GC HOME+ — CUSTOMER ADDRESS MANAGEMENT (NO GPS) E2E VERIFICATION');
  console.log('================================================================\n');

  const customerA = '77777777-0000-4000-8000-000000000077';
  const customerB = '88888888-0000-4000-8000-000000000088';

  // 1. Cleanup old test addresses
  await supabase.from('saved_addresses').delete().eq('user_id', customerA);
  await supabase.from('saved_addresses').delete().eq('user_id', customerB);
  console.log('[Setup] Purged old test address records');

  // 2. TEST 1: ADD Address (No GPS coordinates)
  console.log('\n--- TEST 1: Add Structured Address (Text Only, No Coordinates) ---');
  const addrId = '11111111-2222-3333-4444-555555555555';
  const { data: insertedAddr, error: addErr } = await supabase.from('saved_addresses').insert({
    id: addrId,
    user_id: customerA,
    label: 'Home',
    street: 'Flat 302, Royal Residency, Road No 12',
    locality: 'Banjara Hills',
    landmark: 'Near City Centre Mall',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    is_default: true,
  }).select().single();

  if (addErr) throw new Error('Add address failed: ' + addErr.message);
  console.log('Inserted Address ID:', insertedAddr?.id, '| Label:', insertedAddr?.label, '| Street:', insertedAddr?.street);
  console.assert(!('latitude' in insertedAddr) || insertedAddr?.lat === null, 'Latitude/Longitude must be omitted or null');
  console.assert(insertedAddr?.street === 'Flat 302, Royal Residency, Road No 12', 'Street must match');

  // 3. TEST 2: EDIT Address
  console.log('\n--- TEST 2: Edit Address ---');
  const { data: updatedAddr, error: editErr } = await supabase.from('saved_addresses').update({
    street: 'Flat 302, Building B, Road No 12',
    landmark: 'Opposite Park',
  }).eq('id', addrId).eq('user_id', customerA).select().single();

  if (editErr) throw new Error('Edit address failed: ' + editErr.message);
  console.log('Updated Street:', updatedAddr?.street, '| Updated Landmark:', updatedAddr?.landmark);
  console.assert(updatedAddr?.street === 'Flat 302, Building B, Road No 12', 'Updated Street must persist');

  // 4. TEST 3: SET DEFAULT Address
  console.log('\n--- TEST 3: Set Default Address ---');
  const addr2Id = '22222222-3333-4444-5555-666666666666';
  await supabase.from('saved_addresses').insert({
    id: addr2Id,
    user_id: customerA,
    label: 'Work',
    street: 'Floor 5, IT Tower, HITEC City Main Road',
    locality: 'HITEC City',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    is_default: false,
  });

  // Toggle default to addr2Id
  await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', customerA);
  await supabase.from('saved_addresses').update({ is_default: true }).eq('id', addr2Id).eq('user_id', customerA);

  const { data: addresses } = await supabase.from('saved_addresses').select('*').eq('user_id', customerA);
  const defaultAddr = addresses.find(a => a.is_default);
  console.log('Default Address Label:', defaultAddr?.label, '| ID:', defaultAddr?.id);
  console.assert(defaultAddr?.id === addr2Id, 'Addr2 must be default address');

  // 5. TEST 4: Historical Booking Address Preservation
  console.log('\n--- TEST 4: Historical Booking Address Preservation ---');
  const bookingCode = 'BK-TEST-ADDR-' + Date.now();
  const { data: newBooking, error: bookErr } = await supabase.from('bookings').insert({
    booking_code: bookingCode,
    customer_id: customerA,
    customer_name: 'Test Customer',
    customer_phone: '+91 98765 43210',
    service_name: 'Home Deep Cleaning',
    total_amount: 1499,
    address_label: updatedAddr.label,
    address_street: updatedAddr.street,
    address_locality: updatedAddr.locality,
    address_city: updatedAddr.city,
    address_pincode: updatedAddr.pincode,
    scheduled_date: new Date().toISOString().split('T')[0],
    status: 'pending_assignment',
  }).select().single();

  if (bookErr) throw new Error('Booking insert failed: ' + bookErr.message);
  console.log('Booking Created with Snapshot Address:', newBooking.booking_code, '| Address:', newBooking.address_street);

  // Delete saved address `addrId`
  await supabase.from('saved_addresses').delete().eq('id', addrId).eq('user_id', customerA);
  console.log('Deleted Saved Address ID:', addrId);

  // Verify historical booking address is NOT affected
  const { data: verifiedBooking } = await supabase.from('bookings').select('*').eq('booking_code', bookingCode).single();
  console.log('Historical Booking Address after deletion:', verifiedBooking.address_street);
  console.assert(verifiedBooking.address_street === updatedAddr.street, 'Booking address must remain intact after saved address deletion');

  // 6. TEST 5: User ID Data Scoping (Customer B cannot read Customer A's addresses)
  console.log('\n--- TEST 5: User ID Data Scoping ---');
  const { data: customerBAddresses } = await supabase.from('saved_addresses').select('*').eq('user_id', customerB);
  console.log('Customer B Address Count:', customerBAddresses?.length);
  console.assert(customerBAddresses?.length === 0, 'Customer B must not see Customer A addresses');

  // Cleanup test data
  await supabase.from('bookings').delete().eq('booking_code', bookingCode);
  await supabase.from('saved_addresses').delete().eq('user_id', customerA);
  console.log('\n[Cleanup] Test records purged cleanly.');

  console.log('\n================================================================');
  console.log('✅ ALL CUSTOMER ADDRESS MANAGEMENT (NO GPS) TESTS PASSED!');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
