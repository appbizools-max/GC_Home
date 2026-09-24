/**
 * GC HOME+ — Seed Service Add-ons
 * Seeds meaningful add-ons for key services across all categories.
 * Add-ons are scoped to the most popular/logical services.
 */

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

// Resolved service IDs from live Supabase
const SERVICE_IDS = {
  // Full Home Cleaning
  bhk1: '3dc8e0ae-1604-4520-b5d3-bf9c66c423a1',           // 1 BHK Full Home Cleaning
  bhk2: '0dee897b-0b95-468f-b380-a1b42acd68fd',           // 2 BHK Full Home Cleaning
  bhk3: '2201e476-ed02-4100-9a06-41588d21802d',           // 3 BHK Full Home Cleaning
  bhk4: 'a6ecd36c-aef6-4d32-9aba-5c74aeac0a92',           // 4 BHK / Villa Full Cleaning
  intensiveDeep: 'fdb544da-6254-47f7-a316-9d782e3519ab',  // Intensive Home Deep Clean

  // Kitchen Cleaning
  kitchenDeep: '5590aaca-e3a7-4709-bd12-1451ea6d7144',    // Kitchen Deep Cleaning
  chimney: '47fe8d06-aa46-4f4e-9262-c485d8cffac6',        // Chimney & Exhaust Cleaning
  kitchenGrease: '37a7c6dc-3c52-4a26-9521-b0a666a8d7c2',  // Deep Kitchen Grease & Oven Scrub
  kitchenDegrease: 'a18eb20d-bae6-4f87-b234-aef2b4279816', // Kitchen Degreasing & Sanitization

  // Bathroom Cleaning
  standardBath: 'ab11b608-042a-484f-a542-59d3ff11c915',   // Standard Bathroom Cleaning
  premiumBath: 'e846ba6a-1d5a-4d98-96aa-eedea38a0930',    // Premium Bathroom Sanitization

  // Living Room Cleaning
  livingRoom: '774ed6b5-13fc-4fd3-86b4-6feb12da0957',     // Living Room Deep Cleaning

  // Bedroom Cleaning
  masterBedroom: 'fdcffe2a-7f34-450d-bef4-4e8769740f58',  // Master Bedroom Deep Cleaning

  // Sofa & Fabric Care
  sofa3: '68651170-a1fb-4538-ab42-301b90b8c602',          // 3-Seater Sofa Shampooing
  sofa5: '9072709d-5f21-4b99-952d-e5d4480608c7',          // 5-Seater Sofa Deep Foam Wash
  leather: '5eb2c0eb-1783-45e1-b127-cfcdd415a2c8',        // Leather Sofa Conditioning & Polish

  // Mattress Cleaning
  singleMattress: 'eac28ca5-a3e3-4332-9c91-29d7a861c9a9', // Single Bed Mattress Sanitization
  queenMattress: '09fea008-d0f1-4922-bd43-cd85193561d9',  // Queen Bed Mattress Deep Clean
  kingMattress: 'cce0c065-3065-4144-844b-fef6fcda63b8',   // King Bed Mattress UV & Shampoo

  // Car Cleaning
  hatchback: '2a75ff53-74e8-4f75-9b4c-d8048d41d533',      // Hatchback Interior & Foam Wash
  sedan: '86918bf0-44fc-4169-8ebf-62c173a3cee7',          // Sedan Complete Interior Deep Clean
  suv: 'd7ea28f9-cd4f-4a03-8ac4-85caced0caa5',            // SUV Full Interior & Exterior Polish

  // Floor Cleaning
  marblePolish: 'a597d33c-8695-48a3-a2e4-a7ad398e6344',   // Marble & Granite Floor Polishing
  hardwood: '549bc28c-1eed-4f11-9ee9-8df52f1138a6',       // Hardwood Floor Polish & Wax

  // Move-In/Out Cleaning
  tenantHandover: 'f1509694-50a2-4170-a34d-804479bb7603', // Tenant Handover Complete Clean
  moveIn: '8abfd9c5-0982-42a7-a70b-32c75dd65b7c',         // New Home Move-In Disinfection

  // Pest Control
  cockroach: 'cc9e207d-e768-4a10-ac50-8d0d1771540c',      // Cockroach & Ant Gel Treatment
};

// Add-ons definition: { service_id, name, description, price, duration_min, display_order }
const ADDONS = [
  // ─── Full Home Cleaning Add-ons ───────────────────────────────────────────
  {
    service_id: SERVICE_IDS.bhk1,
    name: 'Balcony Deep Clean',
    description: 'Railing scrub, floor pressure wash, and pigeon-net wipe',
    price: 199, duration_min: 30, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.bhk1,
    name: 'Refrigerator Interior Clean',
    description: 'Shelf-by-shelf wipe, freezer defrost, and deodorizing treatment',
    price: 149, duration_min: 25, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.bhk1,
    name: 'Microwave Interior Cleaning',
    description: 'Grease burn-off, turntable sanitize, and interior polish',
    price: 99, duration_min: 15, display_order: 3,
  },
  {
    service_id: SERVICE_IDS.bhk2,
    name: 'Balcony Deep Clean',
    description: 'Railing scrub, floor pressure wash, and pigeon-net wipe',
    price: 199, duration_min: 30, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.bhk2,
    name: 'Inside Wardrobe Wipe',
    description: 'Shelf dusting, drawer sanitize, and odor freshener spray',
    price: 249, duration_min: 40, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.bhk2,
    name: 'Window Glass & Track Deep Clean',
    description: 'Glass descaling, sliding track vacuum, mesh wash',
    price: 299, duration_min: 45, display_order: 3,
  },
  {
    service_id: SERVICE_IDS.bhk3,
    name: 'Extra Bathroom Deep Clean',
    description: 'Tile descaling, fixture polish, and disinfection wash for 1 additional bathroom',
    price: 349, duration_min: 45, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.bhk3,
    name: 'Ceiling Fan & Light Fixture Wipe',
    description: 'All fans deep-wiped, light fixtures cleaned and restored',
    price: 199, duration_min: 30, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.bhk3,
    name: 'Balcony Deep Clean',
    description: 'Railing scrub, floor pressure wash, and pigeon-net wipe',
    price: 199, duration_min: 30, display_order: 3,
  },
  {
    service_id: SERVICE_IDS.bhk4,
    name: 'Swimming Pool Area Rinse',
    description: 'Pool deck scrub, steps clean, and surrounding area rinse',
    price: 499, duration_min: 60, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.bhk4,
    name: 'Garden & Outdoor Patio Clean',
    description: 'Patio sweep, garden furniture wipe, and walkway wash',
    price: 349, duration_min: 45, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.intensiveDeep,
    name: 'Carpet Shampoo & Steam',
    description: 'Deep foam shampoo, hot steam extraction, and odor neutralizer',
    price: 399, duration_min: 60, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.intensiveDeep,
    name: 'Modular Kitchen Full Degreasing',
    description: 'Cabinet exteriors, chimney hood, appliance surfaces degreased',
    price: 449, duration_min: 60, display_order: 2,
  },

  // ─── Kitchen Cleaning Add-ons ─────────────────────────────────────────────
  {
    service_id: SERVICE_IDS.kitchenDeep,
    name: 'Refrigerator Interior Deep Clean',
    description: 'Shelf-by-shelf wipe, freezer defrost, and deodorizing treatment',
    price: 199, duration_min: 30, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.kitchenDeep,
    name: 'Microwave Deep Clean',
    description: 'Grease burn-off, turntable sanitize, interior polish',
    price: 99, duration_min: 15, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.kitchenDeep,
    name: 'Dishwasher Interior Flush',
    description: 'Filter clean, interior descale, drain flush, and deodorize',
    price: 149, duration_min: 20, display_order: 3,
  },
  {
    service_id: SERVICE_IDS.chimney,
    name: 'Hob & Burner Degreasing',
    description: 'Burner jet clean, drip tray wash, and hob surface polish',
    price: 149, duration_min: 20, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.chimney,
    name: 'Kitchen Backsplash Tile Scrub',
    description: 'Grease and oil stain removal from backsplash tiles and grout',
    price: 199, duration_min: 30, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.kitchenGrease,
    name: 'Microwave & OTG Deep Clean',
    description: 'Full interior degreasing, turntable clean, and odor treatment',
    price: 149, duration_min: 25, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.kitchenDegrease,
    name: 'Refrigerator Interior Deep Clean',
    description: 'Shelf-by-shelf wipe, freezer defrost, and deodorizing',
    price: 199, duration_min: 30, display_order: 1,
  },

  // ─── Bathroom Cleaning Add-ons ────────────────────────────────────────────
  {
    service_id: SERVICE_IDS.standardBath,
    name: 'Hard Water Stain Descaling',
    description: 'Acid-based descaling of taps, showerhead, and tiles',
    price: 149, duration_min: 20, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.standardBath,
    name: 'Grout Deep Scrubbing',
    description: 'Tile grout pressure-brush clean and whitening treatment',
    price: 199, duration_min: 30, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.premiumBath,
    name: 'Exhaust Fan Deep Clean',
    description: 'Fan blade clean, duct rinse, and cover wash',
    price: 99, duration_min: 15, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.premiumBath,
    name: 'Antibacterial Fogger Treatment',
    description: 'Full bathroom fogging with hospital-grade antibacterial agent',
    price: 249, duration_min: 15, display_order: 2,
  },

  // ─── Living Room Add-ons ──────────────────────────────────────────────────
  {
    service_id: SERVICE_IDS.livingRoom,
    name: 'Carpet Spot Stain Removal',
    description: 'Targeted stain extraction from carpets and rugs',
    price: 199, duration_min: 30, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.livingRoom,
    name: 'Chandelier & Light Fixture Wipe',
    description: 'Chandelier disassembly wipe, pendant and ceiling light clean',
    price: 249, duration_min: 30, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.livingRoom,
    name: 'TV Unit & Entertainment Cabinet Dust',
    description: 'Electronics-safe dusting, cable organization, shelving clean',
    price: 149, duration_min: 20, display_order: 3,
  },

  // ─── Bedroom Add-ons ──────────────────────────────────────────────────────
  {
    service_id: SERVICE_IDS.masterBedroom,
    name: 'Mattress Steam Sanitization',
    description: 'High-temp steam kill of dust mites and allergens on mattress',
    price: 299, duration_min: 40, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.masterBedroom,
    name: 'Wardrobe Interior Wipe & Organize',
    description: 'Shelf dust wipe, drawer vacuum, and odor freshener application',
    price: 249, duration_min: 35, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.masterBedroom,
    name: 'Under-Bed Vacuum & Sanitize',
    description: 'Under-bed deep vacuum and allergen spray treatment',
    price: 149, duration_min: 20, display_order: 3,
  },

  // ─── Sofa & Fabric Care Add-ons ───────────────────────────────────────────
  {
    service_id: SERVICE_IDS.sofa3,
    name: 'Cushion Cover Stain Treatment',
    description: 'Spot stain removal and antibacterial treatment on cushion covers',
    price: 149, duration_min: 20, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.sofa3,
    name: 'Sofa Odor Neutralizer Spray',
    description: 'Premium fabric deodorizer spray for fresh scent',
    price: 99, duration_min: 10, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.sofa5,
    name: 'Cushion Cover Stain Treatment',
    description: 'Spot stain removal and antibacterial treatment on cushion covers',
    price: 199, duration_min: 25, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.sofa5,
    name: 'Fabric Protector Spray',
    description: 'Professional-grade fabric guard spray to prevent future stains',
    price: 299, duration_min: 15, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.leather,
    name: 'Leather Scratch Repair Pen',
    description: 'Minor scratch colour-fill and surface blend treatment',
    price: 199, duration_min: 20, display_order: 1,
  },

  // ─── Mattress Cleaning Add-ons ────────────────────────────────────────────
  {
    service_id: SERVICE_IDS.singleMattress,
    name: 'Mattress Stain Spot Treatment',
    description: 'Targeted stain extraction using enzyme-based cleaner',
    price: 149, duration_min: 20, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.singleMattress,
    name: 'Anti-Allergen Spray',
    description: 'Hypoallergenic spray to neutralize dust mites and allergens',
    price: 99, duration_min: 10, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.queenMattress,
    name: 'Pillow Sanitization',
    description: 'UV and steam sanitization for 2 pillows',
    price: 149, duration_min: 20, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.queenMattress,
    name: 'Mattress Protector Fitting',
    description: 'Waterproof protector fitting service (customer provides protector)',
    price: 99, duration_min: 10, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.kingMattress,
    name: 'Pillow Sanitization (4 pcs)',
    description: 'UV and steam sanitization for 4 pillows',
    price: 249, duration_min: 30, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.kingMattress,
    name: 'Bed Frame & Headboard Wipe',
    description: 'Detailed dusting and sanitization of bed frame and headboard',
    price: 199, duration_min: 25, display_order: 2,
  },

  // ─── Car Cleaning Add-ons ─────────────────────────────────────────────────
  {
    service_id: SERVICE_IDS.hatchback,
    name: 'Car Seat Shampoo',
    description: 'Deep foam shampoo and stain extraction for all seats',
    price: 299, duration_min: 40, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.hatchback,
    name: 'Dashboard & Console Polish',
    description: 'Dashboard UV protectant and console detail polish',
    price: 149, duration_min: 20, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.sedan,
    name: 'Leather Interior Conditioning',
    description: 'Premium leather conditioner for seats, steering, and door panels',
    price: 349, duration_min: 45, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.sedan,
    name: 'Engine Bay Light Clean',
    description: 'Dry dust removal and degreasing of engine bay surfaces',
    price: 249, duration_min: 30, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.suv,
    name: 'Roof Lining Stain Clean',
    description: 'Targeted stain treatment for headliner and roof lining',
    price: 299, duration_min: 35, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.suv,
    name: 'Third Row Seat Deep Shampoo',
    description: 'Dedicated deep shampoo for the third-row seating',
    price: 199, duration_min: 25, display_order: 2,
  },

  // ─── Floor Cleaning Add-ons ───────────────────────────────────────────────
  {
    service_id: SERVICE_IDS.marblePolish,
    name: 'Anti-Slip Coating Application',
    description: 'Professional anti-slip treatment applied after polishing',
    price: 399, duration_min: 30, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.marblePolish,
    name: 'Grout Line Sealing',
    description: 'Tile grout deep-clean and protective sealant application',
    price: 299, duration_min: 40, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.hardwood,
    name: 'Hardwood Scratch Filler',
    description: 'Minor scratch fill and blend using colour-matched wax filler',
    price: 299, duration_min: 30, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.hardwood,
    name: 'Anti-Termite Wood Treatment',
    description: 'Surface-level anti-termite treatment spray on hardwood floors',
    price: 349, duration_min: 30, display_order: 2,
  },

  // ─── Move-In/Out Cleaning Add-ons ─────────────────────────────────────────
  {
    service_id: SERVICE_IDS.tenantHandover,
    name: 'Exterior Window Wash',
    description: 'External glass and frame wash including ledge wipe',
    price: 349, duration_min: 45, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.tenantHandover,
    name: 'Painting Residue Removal',
    description: 'Removal of paint splatters from tiles, floors, and fixtures',
    price: 299, duration_min: 40, display_order: 2,
  },
  {
    service_id: SERVICE_IDS.moveIn,
    name: 'Plumbing Check & Flush',
    description: 'Flush all taps, check drains, and clear any blockage debris',
    price: 199, duration_min: 30, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.moveIn,
    name: 'Geyser & Water Heater Wipe',
    description: 'Exterior clean, descaling, and fixture wipe for geysers',
    price: 149, duration_min: 20, display_order: 2,
  },

  // ─── Pest Control Add-ons ─────────────────────────────────────────────────
  {
    service_id: SERVICE_IDS.cockroach,
    name: 'Mosquito Spray Treatment',
    description: 'Indoor mosquito repellent spray for all rooms and corners',
    price: 199, duration_min: 20, display_order: 1,
  },
  {
    service_id: SERVICE_IDS.cockroach,
    name: 'Bed Bug Inspection',
    description: 'Full mattress, headboard, and furniture inspection for bed bugs',
    price: 249, duration_min: 30, display_order: 2,
  },
];

async function seedAddons() {
  console.log('================================================================');
  console.log('🌱 GC HOME+ — SEEDING SERVICE ADD-ONS');
  console.log('================================================================\n');

  // Check current count
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/service_addons?select=id`, { headers });
  const existing = await checkRes.json();
  console.log(`ℹ️  Current add-ons in database: ${existing.length}`);

  if (existing.length > 0) {
    console.log('✅ Add-ons already seeded. Skipping.');
    return;
  }

  // Verify all service IDs exist
  const svcsRes = await fetch(`${SUPABASE_URL}/rest/v1/services?select=id&limit=100`, { headers });
  const existingSvcs = await svcsRes.json();
  const existingIds = new Set(existingSvcs.map(s => s.id));

  const validAddons = ADDONS.filter(a => {
    if (!existingIds.has(a.service_id)) {
      console.warn(`⚠️  Skipping add-on "${a.name}" — service_id ${a.service_id} not found`);
      return false;
    }
    return true;
  });

  console.log(`📦 Inserting ${validAddons.length} add-ons...\n`);

  // Insert in batches of 20
  const BATCH_SIZE = 20;
  let inserted = 0;
  for (let i = 0; i < validAddons.length; i += BATCH_SIZE) {
    const batch = validAddons.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/service_addons`, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err);
      continue;
    }

    const created = await res.json();
    inserted += created.length;
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: Inserted ${created.length} add-ons ✅`);
  }

  console.log(`\n✅ Total add-ons seeded: ${inserted}`);

  // Verify
  const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/service_addons?select=id,name,price`, { headers });
  const final = await verifyRes.json();
  console.log(`\n📊 Final add-on count in Supabase: ${final.length}`);
  console.log('\nSample add-ons:');
  final.slice(0, 5).forEach(a => console.log(`  • ${a.name} — ₹${a.price}`));
  console.log('\n================================================================');
  console.log('✅ ADD-ONS SEED COMPLETE');
  console.log('================================================================');
}

seedAddons().catch(console.error);
