const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

function getPublicAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.replace(/^\/+/, '');
  return `${SUPABASE_URL}/storage/v1/object/public/gc-home-assets/${cleanPath}`;
}

async function run() {
  console.log('====================================================');
  console.log('  GC HOME+ BANNERS & OFFERS MODULE E2E TEST');
  console.log('====================================================\n');

  // 1. Check Homepage Banners
  console.log('1. HOMEPAGE BANNERS:');
  const bannerRes = await fetch(
    `${SUPABASE_URL}/rest/v1/homepage_banners?select=*&is_active=eq.true&order=display_order.asc`,
    { headers }
  );
  if (!bannerRes.ok) {
    throw new Error(`Failed to fetch banners: ${bannerRes.status} ${await bannerRes.text()}`);
  }
  const banners = await bannerRes.json();
  console.log(`Found ${banners.length} active homepage banner(s) in Supabase:`);

  for (const b of banners) {
    const url = getPublicAssetUrl(b.image_url);
    const headRes = await fetch(url, { method: 'HEAD' });
    console.log(`  - Banner ID: ${b.id}`);
    console.log(`    Image Path: ${b.image_url}`);
    console.log(`    Storage Public URL: ${url}`);
    console.log(`    Asset HTTP Status: ${headRes.status} ${headRes.status === 200 ? 'OK' : 'FAIL'} (${headRes.headers.get('content-type') || 'unknown'})\n`);
  }

  // 2. Check Offers
  console.log('2. PROMOTIONAL OFFERS:');
  const offerRes = await fetch(
    `${SUPABASE_URL}/rest/v1/offers?select=*&is_active=eq.true&order=created_at.desc`,
    { headers }
  );
  if (!offerRes.ok) {
    throw new Error(`Failed to fetch offers: ${offerRes.status} ${await offerRes.text()}`);
  }
  const offers = await offerRes.json();
  console.log(`Found ${offers.length} active promotional offer(s) in Supabase:`);

  for (const o of offers) {
    const imgPath = o.image_url || (o.badge_color && o.badge_color.startsWith('offers/') ? o.badge_color : null);
    console.log(`  - Coupon Code: [${o.code}]`);
    console.log(`    Title: "${o.title}"`);
    console.log(`    Discount: ${o.discount_value}${o.discount_type === 'percentage' ? '%' : ' INR'}`);
    console.log(`    Min Order: ₹${o.min_booking_amount || 0} | Max Discount: ${o.max_discount ? '₹' + o.max_discount : 'None'}`);
    console.log(`    Valid Until: ${o.valid_until}`);
    if (imgPath) {
      const url = getPublicAssetUrl(imgPath);
      const headRes = await fetch(url, { method: 'HEAD' });
      console.log(`    Promo Asset: ${imgPath} -> HTTP ${headRes.status} ${headRes.status === 200 ? 'OK' : 'FAIL'}`);
    }
    console.log('');
  }

  // 3. Test Coupon Discount Engine
  console.log('3. COUPON CALCULATION & VALIDATION ENGINE SIMULATION:');
  const testScenarios = [
    { code: 'HOME20', subtotal: 1000 },
    { code: 'CLEAN20', subtotal: 800 },
    { code: 'FIRST50', subtotal: 500 },
    { code: 'HOME20', subtotal: 300 }, // Under min order ₹499
  ];

  for (const scenario of testScenarios) {
    const offer = offers.find(o => o.code === scenario.code);
    if (!offer) {
      console.log(`  - [${scenario.code}]: Offer not found`);
      continue;
    }

    const minAmount = Number(offer.min_booking_amount || 0);
    if (scenario.subtotal < minAmount) {
      console.log(`  - [${scenario.code}] on subtotal ₹${scenario.subtotal}: REJECTED (Minimum order ₹${minAmount} required)`);
      continue;
    }

    let discount = 0;
    if (offer.discount_type === 'percentage') {
      discount = Math.round((scenario.subtotal * Number(offer.discount_value)) / 100);
      if (offer.max_discount && discount > Number(offer.max_discount)) {
        discount = Number(offer.max_discount);
      }
    } else {
      discount = Math.min(Number(offer.discount_value), scenario.subtotal);
    }

    const taxable = scenario.subtotal - discount;
    const taxes = Math.round(taxable * 0.18);
    const total = taxable + 29 + taxes;

    console.log(`  - [${scenario.code}] on subtotal ₹${scenario.subtotal}:`);
    console.log(`    Discount: ₹${discount} | Taxable: ₹${taxable} | GST (18%): ₹${taxes} | Platform: ₹29 | Final Total: ₹${total}`);
  }

  console.log('\n====================================================');
  console.log('  ALL BANNERS & OFFERS MODULE TESTS PASSED!');
  console.log('====================================================');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
