const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function fetchRest(endpoint, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (res.status === 204) return [];
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const NEW_CATEGORIES = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'Water Tank Cleaning', route_category: 'water-tank-cleaning', icon_name: 'Droplets', bg_color: '#E0F2FE', icon_color: '#0284C7', display_order: 1, is_active: true },
  { id: '11111111-0000-0000-0000-000000000002', name: 'Electrician', route_category: 'electrician', icon_name: 'Zap', bg_color: '#FEF3C7', icon_color: '#D97706', display_order: 2, is_active: true },
  { id: '11111111-0000-0000-0000-000000000003', name: 'Plumbing', route_category: 'plumbing', icon_name: 'Wrench', bg_color: '#E0E7FF', icon_color: '#4F46E5', display_order: 3, is_active: true },
  { id: '11111111-0000-0000-0000-000000000004', name: 'Carpentry', route_category: 'carpentry', icon_name: 'Hammer', bg_color: '#FEF2F2', icon_color: '#DC2626', display_order: 4, is_active: true },
  { id: '11111111-0000-0000-0000-000000000005', name: 'AC Repair & Service', route_category: 'ac-repair-service', icon_name: 'Wind', bg_color: '#ECFDF5', icon_color: '#059669', display_order: 5, is_active: true },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Geyser Repair', route_category: 'geyser-repair', icon_name: 'Flame', bg_color: '#FFF7ED', icon_color: '#EA580C', display_order: 6, is_active: true },
  { id: '11111111-0000-0000-0000-000000000007', name: 'Painting', route_category: 'painting', icon_name: 'Palette', bg_color: '#F3E8FF', icon_color: '#9333EA', display_order: 7, is_active: true },
  { id: '11111111-0000-0000-0000-000000000008', name: 'Pest Control', route_category: 'pest-control', icon_name: 'Bug', bg_color: '#F0FDF4', icon_color: '#16A34A', display_order: 8, is_active: true },
  { id: '11111111-0000-0000-0000-000000000009', name: 'Salon for Women', route_category: 'salon-for-women', icon_name: 'Scissors', bg_color: '#FCE7F3', icon_color: '#DB2777', display_order: 9, is_active: true },
  { id: '11111111-0000-0000-0000-000000000010', name: 'Salon for Men', route_category: 'salon-for-men', icon_name: 'UserCheck', bg_color: '#F1F5F9', icon_color: '#334155', display_order: 10, is_active: true },
  { id: '11111111-0000-0000-0000-000000000011', name: 'Makeup Artist', route_category: 'makeup-artist', icon_name: 'Sparkles', bg_color: '#FFF1F2', icon_color: '#E11D48', display_order: 11, is_active: true },
];

const NEW_SERVICES = [
  // 1. Water Tank Cleaning
  { id: '22222222-0001-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000001', category: 'Water Tank Cleaning', name: 'Overhead Tank Cleaning – 500L', starting_price: 499, estimated_duration: '45 mins', description: 'Deep mechanical scrubbing, high-pressure washing, and UV disinfection for 500L overhead tanks.', image_url: 'categories/water_tank.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0001-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000001', category: 'Water Tank Cleaning', name: 'Overhead Tank Cleaning – 1000L', starting_price: 799, estimated_duration: '60 mins', description: 'Complete sludge removal, anti-bacterial spray, and 5-stage cleaning for 1000L overhead tanks.', image_url: 'categories/water_tank.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0001-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000001', category: 'Water Tank Cleaning', name: 'Overhead Tank Cleaning – 2000L', starting_price: 1299, estimated_duration: '90 mins', description: 'Heavy-duty sludge extraction and chemical-free sanitization for 2000L overhead tanks.', image_url: 'categories/water_tank.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0001-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000001', category: 'Water Tank Cleaning', name: 'Overhead Tank Cleaning – 5000L+', starting_price: 2499, estimated_duration: '150 mins', description: 'Commercial grade high-capacity tank cleaning with bio-sanitization for 5000L+ overhead tanks.', image_url: 'categories/water_tank.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0001-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000001', category: 'Water Tank Cleaning', name: 'Underground Tank Cleaning', starting_price: 1499, estimated_duration: '120 mins', description: 'Underground sump cleaning, silt removal, vacuum cleaning, and anti-bacterial treatment.', image_url: 'categories/water_tank.jpg', is_active: true, display_order: 5 },

  // 2. Electrician
  { id: '22222222-0002-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000002', category: 'Electrician', name: 'Fan Installation', starting_price: 199, estimated_duration: '30 mins', description: 'Ceiling or wall fan installation, hook mounting, and wiring check.', image_url: 'services/electrician.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0002-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000002', category: 'Electrician', name: 'Fan Repair', starting_price: 149, estimated_duration: '30 mins', description: 'Capacitor replacement, noise repair, regulator replacement, and speed adjustment.', image_url: 'services/electrician.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0002-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000002', category: 'Electrician', name: 'Light Installation', starting_price: 99, estimated_duration: '20 mins', description: 'Tubelight, LED panel, chandelier, or spot light fitting & wiring.', image_url: 'services/electrician.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0002-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000002', category: 'Electrician', name: 'Switch & Socket Repair', starting_price: 79, estimated_duration: '20 mins', description: 'Modular switch replacement, socket fitting, fuse check, and MCB testing.', image_url: 'services/electrician.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0002-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000002', category: 'Electrician', name: 'Electrical Wiring Repair', starting_price: 299, estimated_duration: '45 mins', description: 'Short circuit troubleshooting, open wiring insulation, and main line repair.', image_url: 'services/electrician.jpg', is_active: true, display_order: 5 },
  { id: '22222222-0002-0000-0000-000000000006', category_id: '11111111-0000-0000-0000-000000000002', category: 'Electrician', name: 'Appliance Electrical Repair', starting_price: 249, estimated_duration: '40 mins', description: 'Electrical defect diagnosis and cord/plug repair for home appliances.', image_url: 'services/electrician.jpg', is_active: true, display_order: 6 },

  // 3. Plumbing
  { id: '22222222-0003-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000003', category: 'Plumbing', name: 'Tap/Faucet Repair', starting_price: 129, estimated_duration: '25 mins', description: 'Leaking tap repair, washer replacement, or new mixer tap fitting.', image_url: 'services/plumbing.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0003-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000003', category: 'Plumbing', name: 'Wash Basin Repair', starting_price: 199, estimated_duration: '35 mins', description: 'Basin waste pipe unblocking, bottle trap replacement, and sealing.', image_url: 'services/plumbing.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0003-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000003', category: 'Plumbing', name: 'Pipe Leakage Repair', starting_price: 249, estimated_duration: '45 mins', description: 'Concealed or open pipe leak detection, joint sealing, and pipe section replacement.', image_url: 'services/plumbing.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0003-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000003', category: 'Plumbing', name: 'Toilet Repair', starting_price: 299, estimated_duration: '45 mins', description: 'Flush tank valve repair, commode jet spray fix, and seat cover replacement.', image_url: 'services/plumbing.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0003-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000003', category: 'Plumbing', name: 'Water Tank/Pipe Connection', starting_price: 399, estimated_duration: '60 mins', description: 'Main line pipe connection, float valve installation, and bypass fitting.', image_url: 'services/plumbing.jpg', is_active: true, display_order: 5 },
  { id: '22222222-0003-0000-0000-000000000006', category_id: '11111111-0000-0000-0000-000000000003', category: 'Plumbing', name: 'Drain Blockage', starting_price: 299, estimated_duration: '40 mins', description: 'Bathroom or kitchen drain clog removal using pressure drain augers.', image_url: 'services/plumbing.jpg', is_active: true, display_order: 6 },

  // 4. Carpentry
  { id: '22222222-0004-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000004', category: 'Carpentry', name: 'Furniture Repair', starting_price: 199, estimated_duration: '45 mins', description: 'Chair leg alignment, table repair, sofa joint tightening, and wood touch-up.', image_url: 'services/carpentry.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0004-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000004', category: 'Carpentry', name: 'Door Repair', starting_price: 249, estimated_duration: '40 mins', description: 'Door alignment, hinge replacement, latch fixing, and wood trimming.', image_url: 'services/carpentry.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0004-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000004', category: 'Carpentry', name: 'Door Installation', starting_price: 499, estimated_duration: '90 mins', description: 'New wooden/PVC door fitting, frame installation, lock and handle mounting.', image_url: 'services/carpentry.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0004-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000004', category: 'Carpentry', name: 'Cabinet Repair', starting_price: 299, estimated_duration: '45 mins', description: 'Kitchen/wardrobe hydraulic hinge repair, drawer channel replacement, and handle fix.', image_url: 'services/carpentry.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0004-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000004', category: 'Carpentry', name: 'Curtain/Rod Installation', starting_price: 149, estimated_duration: '30 mins', description: 'Curtain rod bracket drilling, wall anchoring, and rod alignment.', image_url: 'services/carpentry.jpg', is_active: true, display_order: 5 },
  { id: '22222222-0004-0000-0000-000000000006', category_id: '11111111-0000-0000-0000-000000000004', category: 'Carpentry', name: 'Furniture Assembly', starting_price: 399, estimated_duration: '60 mins', description: 'Flat-pack IKEA/Pepperfry bed, table, or wardrobe assembly.', image_url: 'services/carpentry.jpg', is_active: true, display_order: 6 },

  // 5. AC Repair & Service
  { id: '22222222-0005-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000005', category: 'AC Repair & Service', name: 'AC General Service', starting_price: 399, estimated_duration: '45 mins', description: 'Filter cleaning, cooling coil foam wash, drain tray flushing, and performance check.', image_url: 'services/ac_service.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0005-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000005', category: 'AC Repair & Service', name: 'AC Deep Cleaning', starting_price: 699, estimated_duration: '75 mins', description: 'High-pressure jet jacket wash for indoor and outdoor units, anti-fungal spray treatment.', image_url: 'services/ac_service.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0005-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000005', category: 'AC Repair & Service', name: 'AC Gas Check/Refill', starting_price: 1499, estimated_duration: '60 mins', description: 'Refrigerant R32/R410a pressure test, leak identification, and full gas charging.', image_url: 'services/ac_service.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0005-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000005', category: 'AC Repair & Service', name: 'AC Installation', starting_price: 799, estimated_duration: '120 mins', description: 'Split or window AC indoor/outdoor unit mounting, wall drilling, and piping check.', image_url: 'services/ac_service.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0005-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000005', category: 'AC Repair & Service', name: 'AC Uninstallation', starting_price: 499, estimated_duration: '60 mins', description: 'Safe refrigerant pump-down, bracket dismantling, and indoor/outdoor unit packing.', image_url: 'services/ac_service.jpg', is_active: true, display_order: 5 },
  { id: '22222222-0005-0000-0000-000000000006', category_id: '11111111-0000-0000-0000-000000000005', category: 'AC Repair & Service', name: 'AC Repair', starting_price: 299, estimated_duration: '60 mins', description: 'Compressor, PCB circuit board, fan motor, or sensor fault diagnosis and repair.', image_url: 'services/ac_service.jpg', is_active: true, display_order: 6 },

  // 6. Geyser Repair
  { id: '22222222-0006-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000006', category: 'Geyser Repair', name: 'Geyser Inspection', starting_price: 149, estimated_duration: '30 mins', description: 'Heating element check, thermostat test, electrical earth leak inspection.', image_url: 'services/geyser.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0006-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000006', category: 'Geyser Repair', name: 'Geyser Repair', starting_price: 299, estimated_duration: '45 mins', description: 'Thermostat replacement, heating element repair, safety valve fix, or wiring repair.', image_url: 'services/geyser.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0006-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000006', category: 'Geyser Repair', name: 'Geyser Installation', starting_price: 399, estimated_duration: '60 mins', description: 'Wall bracket drilling, inlet/outlet pipe connection, and electrical connection.', image_url: 'services/geyser.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0006-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000006', category: 'Geyser Repair', name: 'Geyser Cleaning', starting_price: 349, estimated_duration: '60 mins', description: 'Internal tank descaling, hard water sediment flushing, and anode rod check.', image_url: 'services/geyser.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0006-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000006', category: 'Geyser Repair', name: 'Geyser Uninstallation', starting_price: 249, estimated_duration: '35 mins', description: 'Water draining, electrical disconnect, and unit wall dismounting.', image_url: 'services/geyser.jpg', is_active: true, display_order: 5 },

  // 7. Painting
  { id: '22222222-0007-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000007', category: 'Painting', name: 'Single Room Painting', starting_price: 1999, estimated_duration: '1 day', description: 'Walls putty repair, 2 coats premium emulsion paint for 1 room.', image_url: 'services/painting.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0007-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000007', category: 'Painting', name: 'Full Home Painting', starting_price: 7999, estimated_duration: '3-4 days', description: 'Complete interior home painting including masking, wall preparation, primer, and double coat finish.', image_url: 'services/painting.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0007-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000007', category: 'Painting', name: 'Interior Painting', starting_price: 3499, estimated_duration: '2 days', description: 'Custom interior wall painting with color consultation and floor protection.', image_url: 'services/painting.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0007-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000007', category: 'Painting', name: 'Exterior Painting', starting_price: 8999, estimated_duration: '4 days', description: 'Weatherproof anti-fungal exterior wall coating with pressure washing.', image_url: 'services/painting.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0007-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000007', category: 'Painting', name: 'Wall Touch-Up', starting_price: 599, estimated_duration: '60 mins', description: 'Crack sealing, dampness patch treatment, and spot paint matching.', image_url: 'services/painting.jpg', is_active: true, display_order: 5 },
  { id: '22222222-0007-0000-0000-000000000006', category_id: '11111111-0000-0000-0000-000000000007', category: 'Painting', name: 'Texture Painting', starting_price: 2499, estimated_duration: '1 day', description: 'Accent wall designer texture painting with metallic/velvet stencil finishes.', image_url: 'services/painting.jpg', is_active: true, display_order: 6 },

  // 8. Pest Control
  { id: '22222222-0008-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000008', category: 'Pest Control', name: 'General Pest Control', starting_price: 699, estimated_duration: '45 mins', description: 'Odorless spray treatment targeting crawling insects across all rooms.', image_url: 'services/pest_control.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0008-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000008', category: 'Pest Control', name: 'Cockroach Control', starting_price: 599, estimated_duration: '40 mins', description: 'Herbal gel baiting in kitchen cabinets and drain spot spraying.', image_url: 'services/pest_control.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0008-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000008', category: 'Pest Control', name: 'Ant Control', starting_price: 499, estimated_duration: '30 mins', description: 'Red and black ant colony elimination using eco-friendly spray.', image_url: 'services/pest_control.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0008-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000008', category: 'Pest Control', name: 'Mosquito Control', starting_price: 799, estimated_duration: '45 mins', description: 'Thermal fogging and indoor cold mist spray for adult mosquitoes and larvicide.', image_url: 'services/pest_control.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0008-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000008', category: 'Pest Control', name: 'Termite Control', starting_price: 1999, estimated_duration: '120 mins', description: 'Drill-fill-seal barrier treatment into woodwork and flooring perimeters.', image_url: 'services/pest_control.jpg', is_active: true, display_order: 5 },
  { id: '22222222-0008-0000-0000-000000000006', category_id: '11111111-0000-0000-0000-000000000008', category: 'Pest Control', name: 'Bed Bug Control', starting_price: 1299, estimated_duration: '90 mins', description: '2-visit chemical spray treatment targeting mattress seams and bed frames.', image_url: 'services/pest_control.jpg', is_active: true, display_order: 6 },

  // 9. Salon for Women
  { id: '22222222-0009-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000009', category: 'Salon for Women', name: "Women's Haircut", starting_price: 399, estimated_duration: '45 mins', description: 'Layer, U-cut, feather cut, or bob cut with hair wash and blow dry styling.', image_url: 'services/salon_women.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0009-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000009', category: 'Salon for Women', name: 'Hair Spa', starting_price: 899, estimated_duration: '60 mins', description: 'Nourishing cream massage, hair steam, wash, and serum application.', image_url: 'services/salon_women.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0009-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000009', category: 'Salon for Women', name: 'Facial', starting_price: 799, estimated_duration: '60 mins', description: 'Deep cleansing, face scrub, steam, blackhead removal, fruit/gold glow mask.', image_url: 'services/salon_women.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0009-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000009', category: 'Salon for Women', name: 'Waxing', starting_price: 499, estimated_duration: '45 mins', description: 'Full arms, full legs, and underarms Rica or honey wax.', image_url: 'services/salon_women.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0009-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000009', category: 'Salon for Women', name: 'Manicure', starting_price: 449, estimated_duration: '40 mins', description: 'Nail shaping, cuticle soak, hand massage, and polish application.', image_url: 'services/salon_women.jpg', is_active: true, display_order: 5 },
  { id: '22222222-0009-0000-0000-000000000006', category_id: '11111111-0000-0000-0000-000000000009', category: 'Salon for Women', name: 'Pedicure', starting_price: 549, estimated_duration: '45 mins', description: 'Foot scrub, heel scrubbing, relaxing foot massage, and nail paint.', image_url: 'services/salon_women.jpg', is_active: true, display_order: 6 },
  { id: '22222222-0009-0000-0000-000000000007', category_id: '11111111-0000-0000-0000-000000000009', category: 'Salon for Women', name: 'Threading', starting_price: 79, estimated_duration: '15 mins', description: 'Eyebrow shaping, upper lip, chin, and forehead threading.', image_url: 'services/salon_women.jpg', is_active: true, display_order: 7 },

  // 10. Salon for Men
  { id: '22222222-0010-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000010', category: 'Salon for Men', name: "Men's Haircut", starting_price: 199, estimated_duration: '30 mins', description: 'Professional haircut, neck trim, hair wash, and hair styling.', image_url: 'services/salon_men.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0010-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000010', category: 'Salon for Men', name: 'Beard Styling', starting_price: 149, estimated_duration: '20 mins', description: 'Beard trim, razor line shaping, mustache groom, and beard oil massage.', image_url: 'services/salon_men.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0010-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000010', category: 'Salon for Men', name: 'Hair Spa', starting_price: 499, estimated_duration: '40 mins', description: 'Scalp massage cream, hair wash, anti-dandruff steam, and conditioning.', image_url: 'services/salon_men.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0010-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000010', category: 'Salon for Men', name: 'Facial', starting_price: 599, estimated_duration: '45 mins', description: 'De-tan facial glow mask, face massage, scrub, and skin hydration.', image_url: 'services/salon_men.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0010-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000010', category: 'Salon for Men', name: 'Manicure', starting_price: 349, estimated_duration: '30 mins', description: 'Hand scrub, nail clipping, cuticle care, and palm massage.', image_url: 'services/salon_men.jpg', is_active: true, display_order: 5 },
  { id: '22222222-0010-0000-0000-000000000006', category_id: '11111111-0000-0000-0000-000000000010', category: 'Salon for Men', name: 'Pedicure', starting_price: 449, estimated_duration: '35 mins', description: 'Warm water foot soak, dead skin scrubbing, and relaxing foot massage.', image_url: 'services/salon_men.jpg', is_active: true, display_order: 6 },
  { id: '22222222-0010-0000-0000-000000000007', category_id: '11111111-0000-0000-0000-000000000010', category: 'Salon for Men', name: 'Hair Colour', starting_price: 399, estimated_duration: '45 mins', description: 'Ammonia-free hair coloring, root touch-up, and scalp conditioning.', image_url: 'services/salon_men.jpg', is_active: true, display_order: 7 },

  // 11. Makeup Artist
  { id: '22222222-0011-0000-0000-000000000001', category_id: '11111111-0000-0000-0000-000000000011', category: 'Makeup Artist', name: 'Party Makeup', starting_price: 1999, estimated_duration: '90 mins', description: 'Glam party makeup look with contouring, eye makeup, and lip shade.', image_url: 'services/makeup.jpg', is_active: true, display_order: 1 },
  { id: '22222222-0011-0000-0000-000000000002', category_id: '11111111-0000-0000-0000-000000000011', category: 'Makeup Artist', name: 'Bridal Makeup', starting_price: 7999, estimated_duration: '180 mins', description: 'Complete premium HD/Airbrush bridal makeup, hair styling, saree/lehenga draping.', image_url: 'services/makeup.jpg', is_active: true, display_order: 2 },
  { id: '22222222-0011-0000-0000-000000000003', category_id: '11111111-0000-0000-0000-000000000011', category: 'Makeup Artist', name: 'Engagement Makeup', starting_price: 3999, estimated_duration: '120 mins', description: 'Soft glam engagement makeup look, hair do, and lashes application.', image_url: 'services/makeup.jpg', is_active: true, display_order: 3 },
  { id: '22222222-0011-0000-0000-000000000004', category_id: '11111111-0000-0000-0000-000000000011', category: 'Makeup Artist', name: 'Reception Makeup', starting_price: 4999, estimated_duration: '150 mins', description: 'High-definition reception makeup with hair styling and jewelry setting.', image_url: 'services/makeup.jpg', is_active: true, display_order: 4 },
  { id: '22222222-0011-0000-0000-000000000005', category_id: '11111111-0000-0000-0000-000000000011', category: 'Makeup Artist', name: 'Basic Makeup', starting_price: 1299, estimated_duration: '60 mins', description: 'Natural glow day makeup with light foundation and nude lips.', image_url: 'services/makeup.jpg', is_active: true, display_order: 5 },
  { id: '22222222-0011-0000-0000-000000000006', category_id: '11111111-0000-0000-0000-000000000011', category: 'Makeup Artist', name: 'HD Makeup', starting_price: 3499, estimated_duration: '90 mins', description: 'High-definition camera-ready flawless base makeup for photoshoots.', image_url: 'services/makeup.jpg', is_active: true, display_order: 6 },
  { id: '22222222-0011-0000-0000-000000000007', category_id: '11111111-0000-0000-0000-000000000011', category: 'Makeup Artist', name: 'Event Makeup', starting_price: 2499, estimated_duration: '90 mins', description: 'Stage or corporate event makeup with long-lasting setting spray finish.', image_url: 'services/makeup.jpg', is_active: true, display_order: 7 },
];

// Service-Specific Add-ons linked strictly to parent service_id
const SERVICE_ADDONS = [
  // Water Tank Cleaning Add-ons
  { service_id: '22222222-0001-0000-0000-000000000001', name: 'Tank Disinfection', price: 199, is_active: true },
  { service_id: '22222222-0001-0000-0000-000000000001', name: 'Extra Tank', price: 299, is_active: true },

  { service_id: '22222222-0001-0000-0000-000000000002', name: 'Tank Disinfection', price: 249, is_active: true },
  { service_id: '22222222-0001-0000-0000-000000000002', name: 'Extra Tank', price: 399, is_active: true },
  { service_id: '22222222-0001-0000-0000-000000000002', name: 'Heavy Sludge Removal', price: 299, is_active: true },

  { service_id: '22222222-0001-0000-0000-000000000003', name: 'Tank Disinfection', price: 349, is_active: true },
  { service_id: '22222222-0001-0000-0000-000000000003', name: 'Extra Tank', price: 599, is_active: true },
  { service_id: '22222222-0001-0000-0000-000000000003', name: 'Heavy Sludge Removal', price: 399, is_active: true },

  { service_id: '22222222-0001-0000-0000-000000000004', name: 'Tank Disinfection', price: 499, is_active: true },
  { service_id: '22222222-0001-0000-0000-000000000004', name: 'Heavy Sludge Removal', price: 599, is_active: true },

  { service_id: '22222222-0001-0000-0000-000000000005', name: 'Tank Disinfection', price: 399, is_active: true },
  { service_id: '22222222-0001-0000-0000-000000000005', name: 'Heavy Sludge Removal', price: 499, is_active: true },
  { service_id: '22222222-0001-0000-0000-000000000005', name: 'Extra Tank', price: 699, is_active: true },

  // Electrician Add-ons
  { service_id: '22222222-0002-0000-0000-000000000001', name: 'Extra Fan Installation', price: 149, is_active: true },
  { service_id: '22222222-0002-0000-0000-000000000002', name: 'Capacitor Replacement', price: 99, is_active: true },
  { service_id: '22222222-0002-0000-0000-000000000002', name: 'Extra Fan', price: 119, is_active: true },
  { service_id: '22222222-0002-0000-0000-000000000003', name: 'Extra Light Installation', price: 79, is_active: true },
  { service_id: '22222222-0002-0000-0000-000000000004', name: 'Extra Switch/Socket', price: 59, is_active: true },
  { service_id: '22222222-0002-0000-0000-000000000005', name: 'Additional Wiring', price: 199, is_active: true },
  { service_id: '22222222-0002-0000-0000-000000000006', name: 'Appliance Inspection', price: 99, is_active: true },
  { service_id: '22222222-0002-0000-0000-000000000006', name: 'Spare Parts Replacement', price: 149, is_active: true },

  // Plumbing Add-ons
  { service_id: '22222222-0003-0000-0000-000000000001', name: 'Tap Replacement', price: 199, is_active: true },
  { service_id: '22222222-0003-0000-0000-000000000001', name: 'Additional Tap', price: 99, is_active: true },
  { service_id: '22222222-0003-0000-0000-000000000002', name: 'Basin Installation', price: 349, is_active: true },
  { service_id: '22222222-0003-0000-0000-000000000002', name: 'Drain Cleaning', price: 149, is_active: true },
  { service_id: '22222222-0003-0000-0000-000000000003', name: 'Extra Leakage Point', price: 149, is_active: true },
  { service_id: '22222222-0003-0000-0000-000000000003', name: 'Pipe Replacement', price: 299, is_active: true },
  { service_id: '22222222-0003-0000-0000-000000000004', name: 'Toilet Installation', price: 799, is_active: true },
  { service_id: '22222222-0003-0000-0000-000000000004', name: 'Flush Repair', price: 199, is_active: true },

  // AC Repair & Service Add-ons
  { service_id: '22222222-0005-0000-0000-000000000001', name: 'Filter Cleaning', price: 99, is_active: true },
  { service_id: '22222222-0005-0000-0000-000000000001', name: 'Extra AC', price: 299, is_active: true },
  { service_id: '22222222-0005-0000-0000-000000000002', name: 'Filter Cleaning', price: 99, is_active: true },
  { service_id: '22222222-0005-0000-0000-000000000002', name: 'Extra AC', price: 499, is_active: true },
  { service_id: '22222222-0005-0000-0000-000000000003', name: 'Gas Leakage Inspection', price: 299, is_active: true },
  { service_id: '22222222-0005-0000-0000-000000000003', name: 'Extra AC', price: 1299, is_active: true },

  // Salon for Women Add-ons
  { service_id: '22222222-0009-0000-0000-000000000001', name: 'Hair Wash', price: 149, is_active: true },
  { service_id: '22222222-0009-0000-0000-000000000001', name: 'Hair Styling', price: 199, is_active: true },
  { service_id: '22222222-0009-0000-0000-000000000003', name: 'Face Cleanup', price: 299, is_active: true },
  { service_id: '22222222-0009-0000-0000-000000000003', name: 'Face Massage', price: 199, is_active: true },

  // Salon for Men Add-ons
  { service_id: '22222222-0010-0000-0000-000000000001', name: 'Hair Wash', price: 49, is_active: true },
  { service_id: '22222222-0010-0000-0000-000000000001', name: 'Hair Styling', price: 79, is_active: true },
  { service_id: '22222222-0010-0000-0000-000000000002', name: 'Beard Trim', price: 79, is_active: true },
  { service_id: '22222222-0010-0000-0000-000000000002', name: 'Beard Colour', price: 149, is_active: true },

  // Makeup Artist Add-ons
  { service_id: '22222222-0011-0000-0000-000000000001', name: 'Hair Styling', price: 499, is_active: true },
  { service_id: '22222222-0011-0000-0000-000000000001', name: 'Eyelash Application', price: 299, is_active: true },
  { service_id: '22222222-0011-0000-0000-000000000002', name: 'Hair Styling', price: 999, is_active: true },
  { service_id: '22222222-0011-0000-0000-000000000002', name: 'Saree Draping', price: 499, is_active: true },
  { service_id: '22222222-0011-0000-0000-000000000002', name: 'Eyelash Application', price: 399, is_active: true },
];

async function seedNewCatalog() {
  console.log('====================================================');
  console.log('GC HOME+ — RESET & SEED NEW 11-CATEGORY CATALOG');
  console.log('====================================================\n');

  // 1. Deactivate existing services that are not in the new catalog
  console.log('[1/4] Archiving legacy services...');
  const newSrvIds = NEW_SERVICES.map(s => s.id);
  await fetchRest('services?id=not.in.(' + newSrvIds.join(',') + ')', {
    method: 'PATCH',
    body: JSON.stringify({ is_active: false })
  });

  // Deactivate legacy categories
  const newCatIds = NEW_CATEGORIES.map(c => c.id);
  await fetchRest('service_categories?id=not.in.(' + newCatIds.join(',') + ')', {
    method: 'PATCH',
    body: JSON.stringify({ is_active: false })
  });

  // 2. Insert/Upsert 11 New Categories
  console.log('[2/4] Upserting 11 New Categories...');
  for (const cat of NEW_CATEGORIES) {
    await fetchRest('service_categories', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(cat),
    });
    console.log(`  ✓ Category: ${cat.name}`);
  }

  // 3. Upsert 67 New Services
  console.log('[3/4] Upserting 67 New Services...');
  for (const srv of NEW_SERVICES) {
    await fetchRest('services', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(srv),
    });
  }
  console.log(`  ✓ ${NEW_SERVICES.length} Services Seeded Successfully.`);

  // 4. Purge & Upsert Service-Specific Add-ons
  console.log('[4/4] Upserting Service-Specific Add-ons...');
  await fetchRest('service_addons?id=neq.00000000-0000-0000-0000-000000000000', { method: 'DELETE' });

  for (const addon of SERVICE_ADDONS) {
    await fetchRest('service_addons', {
      method: 'POST',
      body: JSON.stringify(addon),
    });
  }
  console.log(`  ✓ ${SERVICE_ADDONS.length} Service-Specific Add-ons Seeded.`);

  console.log('\n====================================================');
  console.log('🎉 CATALOG RESET & SEEDING COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

seedNewCatalog();
