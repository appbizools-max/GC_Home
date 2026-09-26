const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read Admin Supabase credentials
const envContent = fs.readFileSync('e:/Home Clean/gc_home/admin-panel/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v) env[k.trim()] = v.join('=').trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const RAW_DATA = `
Telangana   | Kazipet      | Kazipet                | 506003  | Active
Telangana   | Kazipet      | Bapujinagar            | 506003  | Active
Telangana   | Kazipet      | Bhatpally              | 506003  | Active
Telangana   | Kazipet      | Kadipikonda            | 506003  | Active
Telangana   | Kazipet      | Kondaparthy            | 506003  | Active
Telangana   | Kazipet      | Malakpalli             | 506003  | Active
Telangana   | Kazipet      | Mulkalagudem           | 506003  | Active
Telangana   | Kazipet      | Taralapalli            | 506003  | Active
Telangana   | Kazipet      | Tekulagudem            | 506003  | Active
Telangana   | Kazipet      | Venkatapur             | 506003  | Active

Telangana | Hanamkonda | Hanamkonda | 506001 | Active

Telangana | Hanamkonda | R.E. College | 506004 | Active
Telangana | Hanamkonda | Fatimanagar | 506004 | Active

Telangana | Hanamkonda | Vidyaranyapuri | 506009 | Active
Telangana | Hanamkonda | Naimnagar | 506009 | Active

Telangana | Hanamkonda | D.H. Suthoon | 506011 | Active
Telangana | Hanamkonda | Reddicolony | 506011 | Active

Telangana | Hanamkonda | K.C. Colony | 506015 | Active
Telangana | Hanamkonda | Pegadapalli | 506015 | Active
Telangana | Hanamkonda | Mucherla | 506015 | Active
Telangana | Hanamkonda | Bheemaram | 506015 | Active
Telangana | Hanamkonda | Chintagattu | 506015 | Active

Telangana | Warangal | Warangal | 506002 | Active
Telangana | Warangal | Mandi Bazar | 506002 | Active
Telangana | Warangal | Matwada | 506002 | Active
Telangana | Warangal | SVN Road | 506002 | Active

Telangana | Warangal | Rangshaipet | 506005 | Active
Telangana | Warangal | Ashalapalli | 506005 | Active
Telangana | Warangal | Bollikunta | 506005 | Active
Telangana | Warangal | Gadepalli | 506005 | Active
Telangana | Warangal | Kapulakanparthy | 506005 | Active
Telangana | Warangal | Singaram | 506005 | Active
Telangana | Warangal | Thimmapur | 506005 | Active

Telangana | Warangal | Deshaipet | 506006 | Active

Telangana | Warangal | K.M. College | 506007 | Active

Telangana | Warangal | Vidyaranyapuri | 506009 | Active
Telangana | Warangal | Naimnagar | 506009 | Active

Telangana | Warangal | D.H. Suthoon | 506011 | Active
Telangana | Warangal | Reddicolony | 506011 | Active

Telangana | Warangal | Laxmipur | 506013 | Active

Telangana | Warangal | K.C. Colony | 506015 | Active
`;

async function main() {
  console.log('=== Starting Kazipet, Hanamkonda & Warangal Service Area Ingestion ===');

  // 1. Parse raw data
  const lines = RAW_DATA.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.toLowerCase().startsWith('state') && l.includes('|'));

  const parsed = [];
  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 4) {
      const state = parts[0];
      const city = parts[1];
      const locality = parts[2];
      const pincode = parts[3];
      const status = parts[4] || 'Active';

      parsed.push({
        state: state || 'Telangana',
        city,
        locality,
        pincode,
        status: status.toLowerCase() === 'active',
      });
    }
  }

  console.log(`Total parsed entries from prompt: ${parsed.length}`);

  // 2. Fetch all existing records in service_areas
  const { data: existingRows, error: fetchErr } = await supabase
    .from('service_areas')
    .select('id, city, locality_name, zone_name, pincode, state, is_serviceable, is_active');

  if (fetchErr) {
    console.error('Error fetching existing service areas:', fetchErr);
    process.exit(1);
  }

  console.log(`Existing service_areas in database: ${existingRows.length}`);

  // Create lookup map to detect duplicates (Key: lowercase city + "|" + lowercase locality + "|" + pincode)
  const existingMap = new Map();
  existingRows.forEach(row => {
    const c = (row.city || '').trim().toLowerCase();
    const loc = (row.locality_name || row.locality || row.zone_name || '').trim().toLowerCase();
    const pin = (row.pincode ? String(row.pincode) : '').trim();
    if (c && loc && pin) {
      existingMap.set(`${c}|${loc}|${pin}`, row);
    }
  });

  const toInsert = [];
  const alreadyExisted = [];

  for (const item of parsed) {
    const key = `${item.city.trim().toLowerCase()}|${item.locality.trim().toLowerCase()}|${item.pincode.trim()}`;
    if (existingMap.has(key)) {
      const existingRecord = existingMap.get(key);
      alreadyExisted.push({ item, existingRecord });
      // If it exists but is inactive, activate it
      if (!existingRecord.is_active || !existingRecord.is_serviceable) {
        await supabase
          .from('service_areas')
          .update({
            is_active: true,
            is_serviceable: true,
            state: 'Telangana',
            city: item.city,
            locality_name: item.locality,
            zone_name: item.locality,
          })
          .eq('id', existingRecord.id);
      }
    } else {
      toInsert.push({
        city: item.city.trim(),
        state: 'Telangana',
        locality_name: item.locality.trim(),
        zone_name: item.locality.trim(),
        pincode: item.pincode.trim(),
        is_serviceable: true,
        is_active: true,
        sort_order: 0,
        timezone: 'Asia/Kolkata',
      });
      // Register in map to prevent duplicate within the new batch
      existingMap.set(key, true);
    }
  }

  console.log(`Already existing in DB (prevented duplicate insertion): ${alreadyExisted.length}`);
  console.log(`New records to insert: ${toInsert.length}`);

  if (toInsert.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from('service_areas')
      .insert(toInsert)
      .select();

    if (insertErr) {
      console.error('Error inserting records:', insertErr);
      process.exit(1);
    }
    console.log(`Successfully inserted ${inserted.length} service areas into Supabase.`);
  }

  // 3. Final verification across all cities
  const { data: finalRows, error: finalErr } = await supabase
    .from('service_areas')
    .select('id, city, locality_name, pincode, state, is_serviceable, is_active')
    .order('city');

  if (finalErr) {
    console.error('Final verification error:', finalErr);
  } else {
    console.log(`\n=== Verification Summary ===`);
    console.log(`Total service_areas in database: ${finalRows.length}`);

    const cities = {};
    finalRows.forEach(r => {
      const c = r.city || 'Unknown';
      cities[c] = (cities[c] || 0) + 1;
    });

    console.log('Breakdown by City:');
    Object.entries(cities).forEach(([city, count]) => {
      console.log(`  - ${city}: ${count} localities`);
    });

    const nonTelangana = finalRows.filter(r => r.state !== 'Telangana');
    console.log(`Non-Telangana records: ${nonTelangana.length}`);
    const nonActive = finalRows.filter(r => !r.is_active || !r.is_serviceable);
    console.log(`Non-Active records: ${nonActive.length}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
