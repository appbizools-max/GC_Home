import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const sharp = require(path.resolve(__dirname, '../../admin-panel/node_modules/sharp'));
const { createClient } = require(path.resolve(__dirname, '../../admin-panel/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';
const BUCKET = 'gc-home-assets';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BRAIN_DIR = 'C:/Users/lenovo/.gemini/antigravity-ide/brain/35b64e7b-2275-4e09-981a-1db9dc917b66';
const ADMIN_DIR = path.resolve(__dirname, '../../admin-panel/public/assets/catalog');
const USER_DIR = path.resolve(__dirname, '../../user-app/src/assets/catalog');

const BANNERS_CONFIG = [
  {
    name: 'homepage-banner-001.webp',
    source: 'cat_living_clean_1789972094233.jpg',
    width: 1200,
    height: 520,
    extract: { left: 0, top: 120, width: 1200, height: 520 }
  },
  {
    name: 'homepage-banner-002.webp',
    source: 'test_home_clean_1789971414544.jpg',
    width: 1200,
    height: 520,
    extract: { left: 0, top: 100, width: 1200, height: 520 }
  },
  {
    name: 'homepage-banner-003.webp',
    source: 'cat_deep_clean_1789972152323.jpg',
    width: 1200,
    height: 520,
    extract: { left: 0, top: 150, width: 1200, height: 520 }
  }
];

const OFFERS_CONFIG = [
  {
    name: 'home20.webp',
    source: 'test_home_clean_1789971414544.jpg',
    width: 400,
    height: 300,
    extract: { left: 100, top: 100, width: 800, height: 600 }
  },
  {
    name: 'clean20.webp',
    source: 'cat_deep_clean_1789972152323.jpg',
    width: 400,
    height: 300,
    extract: { left: 200, top: 120, width: 800, height: 600 }
  },
  {
    name: 'first50.webp',
    source: 'cat_living_clean_1789972094233.jpg',
    width: 400,
    height: 300,
    extract: { left: 150, top: 80, width: 800, height: 600 }
  },
  {
    name: 'weekend15.webp',
    source: 'cat_sofa_clean_1789971813593.jpg',
    width: 400,
    height: 300,
    extract: { left: 100, top: 100, width: 800, height: 600 }
  }
];

async function run() {
  console.log('--- GENERATING & UPLOADING BANNERS AND OFFERS ---');

  // Ensure directories exist
  [ADMIN_DIR, USER_DIR].forEach(base => {
    fs.mkdirSync(path.join(base, 'banners'), { recursive: true });
    fs.mkdirSync(path.join(base, 'offers'), { recursive: true });
  });

  // 1. Process Banners
  for (const b of BANNERS_CONFIG) {
    const src = path.join(BRAIN_DIR, b.source);
    const adminPath = path.join(ADMIN_DIR, 'banners', b.name);
    const userPath = path.join(USER_DIR, 'banners', b.name);

    const buf = await sharp(src)
      .extract(b.extract)
      .resize(b.width, b.height)
      .webp({ quality: 85 })
      .toBuffer();

    fs.writeFileSync(adminPath, buf);
    fs.writeFileSync(userPath, buf);

    const storagePath = `banners/${b.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
      contentType: 'image/webp',
      upsert: true
    });

    if (error) {
      console.error(`Upload error for ${storagePath}:`, error.message);
    } else {
      console.log(`[Banner] Uploaded ${storagePath} to Supabase Storage!`);
    }
  }

  // 2. Process Offers
  for (const o of OFFERS_CONFIG) {
    const src = path.join(BRAIN_DIR, o.source);
    const adminPath = path.join(ADMIN_DIR, 'offers', o.name);
    const userPath = path.join(USER_DIR, 'offers', o.name);

    const buf = await sharp(src)
      .extract(o.extract)
      .resize(o.width, o.height)
      .webp({ quality: 85 })
      .toBuffer();

    fs.writeFileSync(adminPath, buf);
    fs.writeFileSync(userPath, buf);

    const storagePath = `offers/${o.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
      contentType: 'image/webp',
      upsert: true
    });

    if (error) {
      console.error(`Upload error for ${storagePath}:`, error.message);
    } else {
      console.log(`[Offer] Uploaded ${storagePath} to Supabase Storage!`);
    }
  }

  // 3. Seed/Sync Homepage Banners in Database
  console.log('\n--- Syncing Homepage Banners in DB ---');
  const { data: existingBanners } = await supabase.from('homepage_banners').select('*');
  const bannerPaths = ['banners/homepage-banner-001.webp', 'banners/homepage-banner-002.webp', 'banners/homepage-banner-003.webp'];

  for (let i = 0; i < bannerPaths.length; i++) {
    const bPath = bannerPaths[i];
    const match = existingBanners?.find(b => b.image_url === bPath);
    if (!match) {
      const { data, error } = await supabase.from('homepage_banners').insert({
        title: 'Homepage Banner',
        cta_text: 'Book Now',
        image_url: bPath,
        is_active: true,
        display_order: i + 1
      }).select();
      console.log(`Inserted banner: ${bPath}`, error?.message || 'OK');
    } else {
      console.log(`Banner already exists: ${bPath}`);
    }
  }

  // 4. Update seed offers in database
  console.log('\n--- Syncing Seed Offers in DB ---');
  const seedOffers = [
    { code: 'HOME20', title: '20% OFF Home Cleaning', badge_color: 'offers/home20.webp', discount_type: 'percentage', discount_value: 20, min_booking_amount: 999, max_discount: 300, valid_until: '2027-12-31' },
    { code: 'CLEAN20', title: '20% OFF on Deep Cleaning', badge_color: 'offers/clean20.webp', discount_type: 'percentage', discount_value: 20, min_booking_amount: 1299, max_discount: 400, valid_until: '2027-12-31' },
    { code: 'FIRST50', title: '₹50 OFF on First Booking', badge_color: 'offers/first50.webp', discount_type: 'fixed', discount_value: 50, min_booking_amount: 499, max_discount: 50, valid_until: '2027-12-31' },
    { code: 'WEEKEND15', title: 'Weekend Special - 15% OFF', badge_color: 'offers/weekend15.webp', discount_type: 'percentage', discount_value: 15, min_booking_amount: 699, max_discount: 250, valid_until: '2027-12-31' }
  ];

  for (const s of seedOffers) {
    const { data: matched } = await supabase.from('offers').select('id').eq('code', s.code).single();
    if (matched) {
      await supabase.from('offers').update({
        title: s.title,
        badge_color: s.badge_color,
        discount_type: s.discount_type,
        discount_value: s.discount_value,
        min_booking_amount: s.min_booking_amount,
        max_discount: s.max_discount,
        valid_until: s.valid_until,
        is_active: true
      }).eq('id', matched.id);
      console.log(`Updated offer: ${s.code} with image ${s.badge_color}`);
    } else {
      await supabase.from('offers').insert({
        code: s.code,
        title: s.title,
        description: `Special discount offer with code ${s.code}.`,
        badge_color: s.badge_color,
        discount_type: s.discount_type,
        discount_value: s.discount_value,
        min_booking_amount: s.min_booking_amount,
        max_discount: s.max_discount,
        valid_from: '2026-09-01',
        valid_until: s.valid_until,
        is_active: true
      });
      console.log(`Inserted offer: ${s.code} with image ${s.badge_color}`);
    }
  }

  console.log('\n--- BANNERS AND OFFERS SYNC COMPLETE ---');
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
