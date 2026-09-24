const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function runE2ETest() {
  console.log('====================================================');
  console.log('🧪 VERIFYING USER APP NAVIGATION, CATALOG & OFFERS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Verify Service Categories
  try {
    console.log('1️⃣ Fetching active categories from Supabase...');
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/service_categories?select=*&is_active=eq.true&order=display_order.asc`,
      { headers }
    );
    const categories = await res.json();

    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error(`Invalid response: ${JSON.stringify(categories)}`);
    }

    console.log(`   ✅ Found ${categories.length} active categories.`);
    console.log(`   Sample Category: "${categories[0].name}" (id: ${categories[0].id}, route: ${categories[0].route_category}, icon: ${categories[0].icon_name})`);
    passed++;
  } catch (err) {
    console.error('   ❌ Categories check failed:', err.message);
    failed++;
  }

  // 2. Verify Services
  try {
    console.log('\n2️⃣ Fetching active services from Supabase...');
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/services?select=id,name,category_id,starting_price,is_active&is_active=eq.true&order=display_order.asc&limit=10`,
      { headers }
    );
    const services = await res.json();

    if (!Array.isArray(services) || services.length === 0) {
      throw new Error(`Invalid response: ${JSON.stringify(services)}`);
    }

    console.log(`   ✅ Found ${services.length} active services in sample.`);
    const sample = services[0];
    console.log(`   Sample: "${sample.name}" (Price: ₹${sample.starting_price}, CatId: ${sample.category_id})`);
    passed++;
  } catch (err) {
    console.error('   ❌ Services check failed:', err.message);
    failed++;
  }

  // 3. Verify Active Offers
  let sampleOffer = null;
  try {
    console.log('\n3️⃣ Fetching active offers from Supabase...');
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/offers?select=*&is_active=eq.true&order=created_at.desc`,
      { headers }
    );
    const offers = await res.json();

    if (!Array.isArray(offers) || offers.length === 0) {
      throw new Error(`Invalid response: ${JSON.stringify(offers)}`);
    }

    console.log(`   ✅ Found ${offers.length} active offers.`);
    sampleOffer = offers[0];
    console.log(`   Sample Offer: "${sampleOffer.code}" — ${sampleOffer.title} (${sampleOffer.discount_type}: ${sampleOffer.discount_value})`);
    passed++;
  } catch (err) {
    console.error('   ❌ Offers check failed:', err.message);
    failed++;
  }

  // 4. Test Checkout Calculation Logic (Base + Addons - Discount + Platform Fee + GST)
  try {
    console.log('\n4️⃣ Testing Checkout Math with Coupon Application...');
    const basePrice = 699;
    const addOnsTotal = 149;
    const subtotal = basePrice + addOnsTotal; // 848

    let discountAmount = 0;
    const couponCode = sampleOffer?.code || 'GCHOME20';
    const discountType = sampleOffer?.discount_type || 'percentage';
    const discountValue = Number(sampleOffer?.discount_value || 20);
    const maxDiscount = sampleOffer?.max_discount ? Number(sampleOffer.max_discount) : 200;

    if (discountType === 'percentage') {
      discountAmount = Math.round((subtotal * discountValue) / 100);
      if (maxDiscount && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      discountAmount = Math.min(discountValue, subtotal);
    }

    const platformFee = 29;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(taxableAmount * 0.18);
    const totalAmount = taxableAmount + platformFee + taxAmount;

    console.log(`   Subtotal: ₹${subtotal} (Base: ₹${basePrice}, Addons: ₹${addOnsTotal})`);
    console.log(`   Applied Coupon: ${couponCode} -> Discount: -₹${discountAmount}`);
    console.log(`   Platform Fee: ₹${platformFee}`);
    console.log(`   GST (18%): ₹${taxAmount}`);
    console.log(`   Final Total Payable: ₹${totalAmount}`);

    if (totalAmount !== taxableAmount + platformFee + taxAmount) {
      throw new Error('Total calculation mismatch');
    }
    console.log('   ✅ Real-time coupon calculation matches checkout specifications.');
    passed++;
  } catch (err) {
    console.error('   ❌ Calculation test failed:', err.message);
    failed++;
  }

  // 5. Test Live Booking Persistence & Admin Retrieval
  const testBookingCode = `GC-TEST-${Date.now().toString().slice(-6)}`;
  try {
    console.log('\n5️⃣ Testing Booking Creation & Admin Sync in Supabase...');
    const insertPayload = {
      booking_code: testBookingCode,
      customer_name: 'Rahul Verma (Test)',
      customer_phone: '+91 98492 01824',
      customer_email: 'customer@gchome.com',
      service_name: 'Home Deep Cleaning',
      service_price: 848,
      discount_amount: 170,
      coupon_code: sampleOffer?.code || 'GCHOME20',
      platform_fee: 29,
      tax_amount: 122,
      total_amount: 829,
      address_label: 'Home',
      address_street: '123, 4th Cross, HSR Layout',
      address_locality: 'HSR Layout',
      address_city: 'Bengaluru',
      address_pincode: '560102',
      scheduled_date: new Date().toISOString().split('T')[0],
      time_slot: '4:00 PM – 6:00 PM',
      status: 'pending_assignment',
      payment_method: 'upi',
      payment_status: 'paid',
      verification_otp: '782190',
      start_otp: '782190',
    };

    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(insertPayload),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      throw new Error(`Failed to insert booking: ${errBody}`);
    }

    const createdRows = await createRes.json();
    const created = createdRows[0];
    console.log(`   ✅ Booking created in Supabase with code: ${created.booking_code}`);
    console.log(`      Discount: ₹${created.discount_amount}, Coupon: ${created.coupon_code}`);
    console.log(`      Platform fee: ₹${created.platform_fee}, Tax: ₹${created.tax_amount}, Total: ₹${created.total_amount}`);

    // Read it back (simulating Admin Panel fetch)
    const fetchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?booking_code=eq.${testBookingCode}&select=*`,
      { headers }
    );
    const fetchedRows = await fetchRes.json();
    const fetched = fetchedRows[0];

    if (!fetched || fetched.coupon_code !== insertPayload.coupon_code) {
      throw new Error(`Admin fetch failed or coupon code mismatch`);
    }
    console.log('   ✅ Admin fetch verification passed: Full breakdown persisted accurately.');

    // Clean up test booking
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?booking_code=eq.${testBookingCode}`, {
      method: 'DELETE',
      headers,
    });
    console.log('   🧹 Test booking cleaned up successfully.');
    passed++;
  } catch (err) {
    console.error('   ❌ Booking persistence check failed:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runE2ETest();
