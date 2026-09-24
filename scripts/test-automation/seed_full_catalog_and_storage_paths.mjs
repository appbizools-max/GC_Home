import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { CATALOG_DATA } from './generate_local_catalog_images.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const { createClient } = require(path.resolve(__dirname, '../../admin-panel/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORY_META = {
  'full-home-cleaning': { icon_name: 'home', bg_color: '#E8F5E9', icon_color: '#10B981', emoji: '🏡' },
  'kitchen-cleaning': { icon_name: 'utensils', bg_color: '#FFF7ED', icon_color: '#EA580C', emoji: '🍳' },
  'bathroom-cleaning': { icon_name: 'bath', bg_color: '#E0F2FE', icon_color: '#0284C7', emoji: '🚿' },
  'living-room-cleaning': { icon_name: 'couch', bg_color: '#F3E8FF', icon_color: '#9333EA', emoji: '🛋️' },
  'bedroom-cleaning': { icon_name: 'bed', bg_color: '#FCE7F3', icon_color: '#DB2777', emoji: '🛏️' },
  'sofa-cleaning': { icon_name: 'armchair', bg_color: '#FEF3C7', icon_color: '#D97706', emoji: '🛋️' },
  'mattress-cleaning': { icon_name: 'sparkles', bg_color: '#ECFDF5', icon_color: '#059669', emoji: '✨' },
  'floor-cleaning': { icon_name: 'layers', bg_color: '#F1F5F9', icon_color: '#475569', emoji: '🧹' },
  'window-glass-cleaning': { icon_name: 'maximize', bg_color: '#E0F2FE', icon_color: '#0369A1', emoji: '🪟' },
  'regular-cleaning': { icon_name: 'clock', bg_color: '#EFF6FF', icon_color: '#2563EB', emoji: '⏰' },
  'deep-cleaning': { icon_name: 'shield-check', bg_color: '#FEF2F2', icon_color: '#DC2626', emoji: '🧼' },
  'sanitization': { icon_name: 'activity', bg_color: '#ECFDF5', icon_color: '#047857', emoji: '🧴' },
  'pest-control': { icon_name: 'alert-triangle', bg_color: '#FFFBEB', icon_color: '#B45309', emoji: '🐜' },
  'car-cleaning': { icon_name: 'truck', bg_color: '#F0FDFA', icon_color: '#0D9488', emoji: '🚗' },
  'office-cleaning': { icon_name: 'briefcase', bg_color: '#EEF2FF', icon_color: '#4F46E5', emoji: '🏢' },
  'post-construction-cleaning': { icon_name: 'tool', bg_color: '#F5F5F4', icon_color: '#57534E', emoji: '🔨' },
  'move-in-cleaning': { icon_name: 'package', bg_color: '#FDF2F8', icon_color: '#BE185D', emoji: '📦' },
  'move-out-cleaning': { icon_name: 'key', bg_color: '#F0FDF4', icon_color: '#15803D', emoji: '🔑' },
};

async function seedCatalog() {
  console.log('--- SEEDING 18 CATEGORIES AND 90 SERVICES INTO SUPABASE ---');

  // Fetch current categories
  const { data: existingCats, error: catFetchErr } = await supabase.from('service_categories').select('*');
  if (catFetchErr) {
    console.error('Failed to fetch categories:', catFetchErr);
    process.exit(1);
  }

  const categoryIdMap = new Map(); // slug -> uuid

  for (let i = 0; i < CATALOG_DATA.length; i++) {
    const cat = CATALOG_DATA[i];
    const meta = CATEGORY_META[cat.id] || { icon_name: 'sparkles', bg_color: '#F3F4F6', icon_color: '#374151', emoji: '✨' };
    const storagePath = `categories/${cat.id}.webp`;

    // Check if category already exists by route_category or name
    let matched = existingCats.find(c => c.route_category === cat.id || c.route_category === cat.id.replace(/-/g, '_'));
    if (!matched) {
      matched = existingCats.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
    }

    if (matched) {
      // Update existing record
      const { data, error } = await supabase
        .from('service_categories')
        .update({
          name: cat.name,
          route_category: cat.id,
          image_url: storagePath,
          display_order: i + 1,
          icon_name: meta.icon_name,
          bg_color: meta.bg_color,
          icon_color: meta.icon_color,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', matched.id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating category ${cat.name}:`, error.message);
      } else {
        console.log(`[Category ${i+1}/18] Updated: ${cat.name} (${data.id}) -> ${storagePath}`);
        categoryIdMap.set(cat.id, data.id);
      }
    } else {
      // Insert new category
      const { data, error } = await supabase
        .from('service_categories')
        .insert({
          name: cat.name,
          route_category: cat.id,
          image_url: storagePath,
          display_order: i + 1,
          icon_name: meta.icon_name,
          bg_color: meta.bg_color,
          icon_color: meta.icon_color,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error(`Error inserting category ${cat.name}:`, error.message);
      } else {
        console.log(`[Category ${i+1}/18] Created: ${cat.name} (${data.id}) -> ${storagePath}`);
        categoryIdMap.set(cat.id, data.id);
      }
    }
  }

  // Fetch current services
  const { data: existingSvcs } = await supabase.from('services').select('*');
  let serviceCount = 0;

  for (const cat of CATALOG_DATA) {
    const catUuid = categoryIdMap.get(cat.id);
    if (!catUuid) {
      console.warn(`Skipping services for ${cat.name}: no category UUID`);
      continue;
    }
    const meta = CATEGORY_META[cat.id];

    for (let j = 0; j < cat.services.length; j++) {
      const svc = cat.services[j];
      const storagePath = `services/${cat.id}/${svc.id}.webp`;
      const hours = Math.floor(svc.duration / 60);
      const mins = svc.duration % 60;
      const durationStr = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours} hrs`) : `${mins} mins`;

      const matchedSvc = existingSvcs?.find(s => s.name.toLowerCase() === svc.name.toLowerCase() || (s.category_id === catUuid && s.name.toLowerCase() === svc.name.toLowerCase()));

      const svcPayload = {
        name: svc.name,
        category: cat.name,
        category_id: catUuid,
        description: `Professional ${svc.name.toLowerCase()} delivered by certified, background-verified GC HOME+ specialists with eco-friendly cleaning agents.`,
        base_price: svc.price,
        starting_price: svc.price,
        price_per_bhk: cat.id === 'full-home-cleaning' ? 500 : 0,
        price_per_room: 0,
        duration_min: svc.duration,
        estimated_duration: durationStr,
        icon_emoji: meta.emoji,
        image_url: storagePath,
        is_active: true,
        display_order: j + 1,
        sort_order: j + 1,
        features: [
          'Eco-Friendly Grade Chemicals',
          'Professional Heavy-Duty Equipment',
          'Trained & Background-Checked Cleaners',
          '100% Satisfaction Guarantee'
        ],
        is_bestseller: j === 0 || j === 1,
        rating: 4.8 + (j % 3) * 0.05,
        review_count: 150 + (j * 37) % 180
      };

      if (matchedSvc) {
        const { error } = await supabase
          .from('services')
          .update({
            ...svcPayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', matchedSvc.id);

        if (error) {
          console.error(`Error updating service ${svc.name}:`, error.message);
        } else {
          serviceCount++;
          console.log(`  [Service ${serviceCount}/90] Updated: ${svc.name} -> ${storagePath}`);
        }
      } else {
        const { error } = await supabase
          .from('services')
          .insert(svcPayload);

        if (error) {
          console.error(`Error inserting service ${svc.name}:`, error.message);
        } else {
          serviceCount++;
          console.log(`  [Service ${serviceCount}/90] Inserted: ${svc.name} -> ${storagePath}`);
        }
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`CATALOG SEED COMPLETED!`);
  console.log(`Categories mapped: ${categoryIdMap.size}/18`);
  console.log(`Services populated: ${serviceCount}/90`);
  console.log(`========================================`);
}

seedCatalog().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
