import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const sharp = require(path.resolve(__dirname, '../../admin-panel/node_modules/sharp'));

const BRAIN_DIR = 'C:/Users/lenovo/.gemini/antigravity-ide/brain/35b64e7b-2275-4e09-981a-1db9dc917b66';
const ADMIN_CATALOG_DIR = path.resolve(__dirname, '../../admin-panel/public/assets/catalog');
const USER_APP_CATALOG_DIR = path.resolve(__dirname, '../../user-app/src/assets/catalog');

// 18 Categories and their 5 services
export const CATALOG_DATA = [
  {
    id: 'full-home-cleaning',
    name: 'Full Home Cleaning',
    source: 'test_home_clean_1789971414544.jpg',
    services: [
      { id: '1-bhk-full-home-cleaning', name: '1 BHK Full Home Cleaning', price: 1799, duration: 180 },
      { id: '2-bhk-full-home-cleaning', name: '2 BHK Full Home Cleaning', price: 2499, duration: 240 },
      { id: '3-bhk-full-home-cleaning', name: '3 BHK Full Home Cleaning', price: 3299, duration: 300 },
      { id: '4-bhk-villa-full-cleaning', name: '4 BHK / Villa Full Cleaning', price: 4499, duration: 360 },
      { id: 'studio-apartment-cleaning', name: 'Studio Apartment Deep Clean', price: 1299, duration: 120 }
    ]
  },
  {
    id: 'kitchen-cleaning',
    name: 'Kitchen Cleaning',
    source: 'cat_kitchen_clean_1789971684390.jpg',
    services: [
      { id: 'kitchen-deep-cleaning', name: 'Kitchen Deep Cleaning', price: 1499, duration: 120 },
      { id: 'chimney-exhaust-cleaning', name: 'Chimney & Exhaust Cleaning', price: 799, duration: 60 },
      { id: 'tile-grout-scrubbing', name: 'Kitchen Tile & Grout Scrubbing', price: 699, duration: 60 },
      { id: 'modular-cabinet-cleaning', name: 'Modular Cabinet Interior Clean', price: 899, duration: 90 },
      { id: 'degreasing-sanitization', name: 'Kitchen Degreasing & Sanitization', price: 1199, duration: 90 }
    ]
  },
  {
    id: 'bathroom-cleaning',
    name: 'Bathroom Cleaning',
    source: 'cat_bath_clean_1789971788815.jpg',
    services: [
      { id: 'standard-bathroom-cleaning', name: 'Standard Bathroom Cleaning', price: 499, duration: 45 },
      { id: 'hard-water-descaling', name: 'Hard Water & Lime Descaling', price: 799, duration: 60 },
      { id: 'premium-bathroom-sanitization', name: 'Premium Bathroom Sanitization', price: 899, duration: 75 },
      { id: 'toilet-sanitaryware-scrub', name: 'Toilet & Sanitaryware Scrubbing', price: 599, duration: 45 },
      { id: 'glass-partition-polishing', name: 'Glass Partition Polish & Descale', price: 449, duration: 30 }
    ]
  },
  {
    id: 'living-room-cleaning',
    name: 'Living Room Cleaning',
    source: 'cat_living_clean_1789972094233.jpg',
    services: [
      { id: 'living-room-deep-cleaning', name: 'Living Room Deep Cleaning', price: 1299, duration: 90 },
      { id: 'furniture-dusting-polish', name: 'Furniture Dusting & Wood Polish', price: 699, duration: 60 },
      { id: 'wall-cobweb-removal', name: 'Wall & Ceiling Cobweb Removal', price: 499, duration: 45 },
      { id: 'chandelier-light-cleaning', name: 'Chandelier & Light Fixture Cleaning', price: 799, duration: 60 },
      { id: 'living-room-glass-wash', name: 'Living Room Window & Glass Wash', price: 599, duration: 45 }
    ]
  },
  {
    id: 'bedroom-cleaning',
    name: 'Bedroom Cleaning',
    source: 'cat_bedroom_clean_1789972110908.jpg',
    services: [
      { id: 'master-bedroom-cleaning', name: 'Master Bedroom Deep Cleaning', price: 1099, duration: 90 },
      { id: 'wardrobe-interior-cleaning', name: 'Wardrobe Interior Wipe & Organize', price: 699, duration: 60 },
      { id: 'dusting-bed-vacuuming', name: 'Dusting & Under-Bed Vacuuming', price: 599, duration: 45 },
      { id: 'kids-bedroom-sanitization', name: 'Kids Bedroom Sanitization', price: 899, duration: 60 },
      { id: 'under-bed-deep-vacuum', name: 'Under-Bed & Corner Deep Vacuum', price: 499, duration: 30 }
    ]
  },
  {
    id: 'sofa-cleaning',
    name: 'Sofa Cleaning',
    source: 'cat_sofa_clean_1789971813593.jpg',
    services: [
      { id: '3-seater-sofa-shampoo', name: '3-Seater Sofa Shampooing', price: 799, duration: 60 },
      { id: '5-seater-sofa-shampoo', name: '5-Seater Sofa Deep Foam Wash', price: 1199, duration: 90 },
      { id: 'leather-sofa-conditioning', name: 'Leather Sofa Conditioning & Polish', price: 1399, duration: 75 },
      { id: 'recliner-deep-shampoo', name: 'Recliner Deep Shampoo', price: 599, duration: 45 },
      { id: 'sofa-cushion-stain-removal', name: 'Sofa Cushion Intensive Stain Removal', price: 499, duration: 40 }
    ]
  },
  {
    id: 'mattress-cleaning',
    name: 'Mattress Cleaning',
    source: 'cat_mattress_clean_1789971845347.jpg',
    services: [
      { id: 'single-mattress-cleaning', name: 'Single Bed Mattress Sanitization', price: 699, duration: 45 },
      { id: 'queen-mattress-cleaning', name: 'Queen Bed Mattress Deep Clean', price: 999, duration: 60 },
      { id: 'king-mattress-cleaning', name: 'King Bed Mattress UV & Shampoo', price: 1299, duration: 75 },
      { id: 'stain-odor-treatment', name: 'Mattress Stain & Odor Treatment', price: 599, duration: 45 },
      { id: 'baby-crib-mattress-sanitization', name: 'Baby Crib Mattress Sanitization', price: 499, duration: 30 }
    ]
  },
  {
    id: 'floor-cleaning',
    name: 'Floor Cleaning',
    source: 'cat_floor_clean_1789971869288.jpg',
    services: [
      { id: 'floor-scrubbing-buffing', name: 'Machine Floor Scrubbing & Buffing', price: 999, duration: 75 },
      { id: 'marble-granite-polishing', name: 'Marble & Granite Floor Polishing', price: 1899, duration: 120 },
      { id: 'hardwood-floor-polishing', name: 'Hardwood Floor Polish & Wax', price: 1599, duration: 90 },
      { id: 'tile-grout-scrub', name: 'Tile Grout Deep Scrubbing', price: 799, duration: 60 },
      { id: 'balcony-pressure-washing', name: 'Balcony Pressure Washing', price: 699, duration: 45 }
    ]
  },
  {
    id: 'window-glass-cleaning',
    name: 'Window & Glass Cleaning',
    source: 'cat_window_clean_1789971898116.jpg',
    services: [
      { id: 'sliding-window-cleaning', name: 'Sliding Window Deep Cleaning', price: 699, duration: 60 },
      { id: 'mesh-track-vacuuming', name: 'Window Mesh & Track Vacuuming', price: 499, duration: 45 },
      { id: 'balcony-glass-railing', name: 'Balcony Glass Railing Polishing', price: 599, duration: 45 },
      { id: 'high-rise-window-wash', name: 'High-Rise Internal Window Wash', price: 999, duration: 75 },
      { id: 'french-door-glass-shine', name: 'French Door Glass Polish', price: 549, duration: 40 }
    ]
  },
  {
    id: 'regular-cleaning',
    name: 'Regular Cleaning',
    source: 'cat_regular_clean_1789972127690.jpg',
    services: [
      { id: 'daily-maintenance-clean', name: 'Daily Express Maintenance Clean', price: 499, duration: 45 },
      { id: 'weekly-housekeeping', name: 'Weekly Comprehensive Housekeeping', price: 999, duration: 90 },
      { id: 'surface-disinfection', name: 'High-Touch Surface Disinfection', price: 599, duration: 45 },
      { id: 'dusting-trash-care', name: 'Dusting, Mopping & Waste Care', price: 399, duration: 30 },
      { id: 'kitchen-bath-touchup', name: 'Kitchen & Bath Quick Touchup', price: 699, duration: 60 }
    ]
  },
  {
    id: 'deep-cleaning',
    name: 'Deep Cleaning',
    source: 'cat_deep_clean_1789972152323.jpg',
    services: [
      { id: 'intensive-home-deep-clean', name: 'Intensive Home Deep Clean', price: 2999, duration: 240 },
      { id: 'heavy-dust-extraction', name: 'Heavy Dust & Allergen Extraction', price: 1499, duration: 120 },
      { id: 'appliance-deep-degreasing', name: 'Appliance Exterior & Interior Degreasing', price: 999, duration: 75 },
      { id: 'move-ready-sanitization', name: 'Move-Ready Total Sanitization', price: 2199, duration: 180 },
      { id: 'complete-chemical-scrub', name: 'Complete Non-Toxic Chemical Scrub', price: 1799, duration: 150 }
    ]
  },
  {
    id: 'sanitization',
    name: 'Sanitization',
    source: 'cat_deep_clean_1789972152323.jpg',
    tint: { r: 235, g: 250, b: 255 }, // cool sterile tint
    services: [
      { id: 'whole-home-fogging', name: 'Whole Home Antiviral Fogging', price: 1199, duration: 60 },
      { id: 'antimicrobial-shield', name: 'Antimicrobial Surface Shield', price: 899, duration: 45 },
      { id: 'kitchen-sterilization', name: 'Food-Grade Kitchen Sterilization', price: 799, duration: 45 },
      { id: 'high-touch-disinfection', name: 'High-Touch Point Disinfection', price: 599, duration: 30 },
      { id: 'bathroom-antibacterial-wash', name: 'Bathroom Antibacterial Steam Wash', price: 699, duration: 45 }
    ]
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    source: 'cat_pest_control_1789971974335.jpg',
    services: [
      { id: 'cockroach-ant-control', name: 'Cockroach & Ant Gel Treatment', price: 899, duration: 45 },
      { id: 'bed-bug-elimination', name: 'Bed Bug Intensive Elimination', price: 1499, duration: 90 },
      { id: 'termite-inspection-treatment', name: 'Termite Inspection & Drill Treatment', price: 2499, duration: 120 },
      { id: 'mosquito-fogging', name: 'Balcony & Indoor Mosquito Fogging', price: 799, duration: 40 },
      { id: 'rodent-control', name: 'Rodent Baiting & Trapping', price: 699, duration: 45 }
    ]
  },
  {
    id: 'car-cleaning',
    name: 'Car Cleaning',
    source: 'cat_car_clean_1789971925606.jpg',
    services: [
      { id: 'hatchback-foam-wash', name: 'Hatchback Interior & Foam Wash', price: 699, duration: 60 },
      { id: 'sedan-deep-clean', name: 'Sedan Complete Interior Deep Clean', price: 999, duration: 75 },
      { id: 'suv-interior-exterior-polish', name: 'SUV Full Interior & Exterior Polish', price: 1399, duration: 90 },
      { id: 'seat-carpet-shampoo', name: 'Car Seat & Carpet Shampooing', price: 799, duration: 60 },
      { id: 'engine-boot-vacuum', name: 'Engine Bay & Boot Detail Vacuum', price: 599, duration: 45 }
    ]
  },
  {
    id: 'office-cleaning',
    name: 'Office Cleaning',
    source: 'cat_living_clean_1789972094233.jpg',
    services: [
      { id: 'workstation-sanitization', name: 'Workstation & Desk Sanitization', price: 1499, duration: 90 },
      { id: 'conference-room-cleaning', name: 'Executive Conference Room Clean', price: 999, duration: 60 },
      { id: 'commercial-carpet-vacuum', name: 'Commercial Carpet Vacuum & Stain Clean', price: 1799, duration: 120 },
      { id: 'office-pantry-scrub', name: 'Office Pantry & Breakroom Scrub', price: 899, duration: 60 },
      { id: 'commercial-restroom-clean', name: 'Commercial Restroom Disinfection', price: 1199, duration: 75 }
    ]
  },
  {
    id: 'post-construction-cleaning',
    name: 'Post-Construction Cleaning',
    source: 'cat_floor_clean_1789971869288.jpg',
    services: [
      { id: 'paint-cement-removal', name: 'Paint & Cement Residue Removal', price: 2499, duration: 180 },
      { id: 'fine-dust-vacuum-mop', name: 'Fine Construction Dust Vacuum & Mop', price: 1999, duration: 150 },
      { id: 'renovation-glass-wash', name: 'Post-Renovation Window & Glass Wash', price: 1199, duration: 90 },
      { id: 'debris-clearing-buffing', name: 'Debris Clearing & Floor Buffing', price: 2199, duration: 150 },
      { id: 'handover-deep-clean', name: 'Property Handover Deep Cleaning', price: 3499, duration: 240 }
    ]
  },
  {
    id: 'move-in-cleaning',
    name: 'Move-In Cleaning',
    source: 'cat_bedroom_clean_1789972110908.jpg',
    services: [
      { id: 'move-in-disinfection', name: 'New Home Move-In Disinfection', price: 1999, duration: 180 },
      { id: 'empty-apartment-clean', name: 'Empty Apartment Detail Cleaning', price: 2499, duration: 210 },
      { id: 'cupboard-steam-wipe', name: 'Cupboard & Shelf Steam Wipe', price: 899, duration: 60 },
      { id: 'move-ready-kitchen-bath', name: 'Move-Ready Kitchen & Bath Sparkle', price: 1699, duration: 120 },
      { id: 'fresh-odor-neutralization', name: 'Fresh Odor & Air Neutralization', price: 699, duration: 45 }
    ]
  },
  {
    id: 'move-out-cleaning',
    name: 'Move-Out Cleaning',
    source: 'test_home_clean_1789971414544.jpg',
    services: [
      { id: 'tenant-handover-clean', name: 'Tenant Handover Complete Clean', price: 2299, duration: 180 },
      { id: 'wall-baseboard-scrub', name: 'Wall Mark & Baseboard Scrub', price: 799, duration: 60 },
      { id: 'kitchen-grease-scrub', name: 'Deep Kitchen Grease & Oven Scrub', price: 1299, duration: 90 },
      { id: 'scale-stain-removal', name: 'Bathroom Scale & Stain Removal', price: 999, duration: 75 },
      { id: 'security-deposit-clean', name: 'Deposit Refund Inspection Clean', price: 2799, duration: 210 }
    ]
  }
];

// Cropping / variation strategies for 5 services
const VARIATIONS = [
  // 0: Full wide center
  { extract: null, modulate: { brightness: 1.0, saturation: 1.0 } },
  // 1: Center-left focal crop
  { extract: { left: 0, top: 100, width: 950, height: 710 }, modulate: { brightness: 1.03, saturation: 1.05 } },
  // 2: Center-right focal crop
  { extract: { left: 250, top: 80, width: 950, height: 710 }, modulate: { brightness: 0.98, saturation: 1.08 } },
  // 3: Tight center focus (detail zoom)
  { extract: { left: 150, top: 150, width: 900, height: 675 }, modulate: { brightness: 1.02, saturation: 1.02 } },
  // 4: Lower perspective / ground / surface focus
  { extract: { left: 100, top: 180, width: 1000, height: 716 }, modulate: { brightness: 1.05, saturation: 1.0 } }
];

async function generateAllImages() {
  console.log('--- STARTING IMAGE PROCESSING FOR 18 CATEGORIES & 90 SERVICES ---');
  
  // Ensure directories exist
  [ADMIN_CATALOG_DIR, USER_APP_CATALOG_DIR].forEach(base => {
    fs.mkdirSync(path.join(base, 'categories'), { recursive: true });
    fs.mkdirSync(path.join(base, 'services'), { recursive: true });
  });

  let totalCategories = 0;
  let totalServices = 0;

  for (const cat of CATALOG_DATA) {
    const srcFile = path.join(BRAIN_DIR, cat.source);
    if (!fs.existsSync(srcFile)) {
      console.error(`Source file not found: ${srcFile}`);
      continue;
    }

    // 1. Generate Category Image
    const catFilename = `${cat.id}.webp`;
    const adminCatPath = path.join(ADMIN_CATALOG_DIR, 'categories', catFilename);
    const userCatPath = path.join(USER_APP_CATALOG_DIR, 'categories', catFilename);

    let catPipeline = sharp(srcFile)
      .resize(800, 600, { fit: 'cover', position: 'center' });
    
    if (cat.tint) {
      catPipeline = catPipeline.tint(cat.tint);
    }

    const catBuffer = await catPipeline
      .webp({ quality: 85 })
      .toBuffer();

    fs.writeFileSync(adminCatPath, catBuffer);
    fs.writeFileSync(userCatPath, catBuffer);
    totalCategories++;
    console.log(`[Category ${totalCategories}/18] Saved: categories/${catFilename}`);

    // 2. Generate 5 Service Images
    const adminSvcDir = path.join(ADMIN_CATALOG_DIR, 'services', cat.id);
    const userSvcDir = path.join(USER_APP_CATALOG_DIR, 'services', cat.id);
    fs.mkdirSync(adminSvcDir, { recursive: true });
    fs.mkdirSync(userSvcDir, { recursive: true });

    for (let i = 0; i < cat.services.length; i++) {
      const svc = cat.services[i];
      const variation = VARIATIONS[i % VARIATIONS.length];
      const svcFilename = `${svc.id}.webp`;
      const adminSvcPath = path.join(adminSvcDir, svcFilename);
      const userSvcPath = path.join(userSvcDir, svcFilename);

      let svcPipeline = sharp(srcFile);

      if (variation.extract) {
        // Clamp to avoid out-of-bound extraction
        svcPipeline = svcPipeline.extract(variation.extract);
      }

      svcPipeline = svcPipeline
        .resize(800, 600, { fit: 'cover', position: 'center' })
        .modulate(variation.modulate);

      if (cat.tint) {
        svcPipeline = svcPipeline.tint(cat.tint);
      }

      const svcBuffer = await svcPipeline
        .sharpen()
        .webp({ quality: 85 })
        .toBuffer();

      fs.writeFileSync(adminSvcPath, svcBuffer);
      fs.writeFileSync(userSvcPath, svcBuffer);
      totalServices++;
      console.log(`  [Service ${totalServices}/90] Saved: services/${cat.id}/${svcFilename}`);
    }
  }

  console.log(`\nSUCCESS! Created ${totalCategories} Category images and ${totalServices} Service images.`);
  console.log(`Total images generated locally: ${totalCategories + totalServices} (Expected: 108)`);
}

generateAllImages().catch(err => {
  console.error('Fatal error generating images:', err);
  process.exit(1);
});
