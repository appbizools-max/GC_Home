const { createClient } = require('../admin-panel/node_modules/@supabase/supabase-js');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUyODM5MywiZXhwIjoyMTA1MTA0MzkzfQ.kWKEJS7DyKzL4Qg4NWFYu-4fJBuKqhi_-UoY-fYdWrY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const rawData = `
Telangana | Karimnagar | Karimnagar | 505001 | Active
Telangana | Karimnagar | Collectorate Complex | 505001 | Active
Telangana | Karimnagar | Dist. Court Building | 505001 | Active
Telangana | Karimnagar | Jublikaman | 505001 | Active
Telangana | Karimnagar | Jawaharnagar | 505001 | Active
Telangana | Karimnagar | Ramnagar | 505001 | Active

Telangana | Karimnagar | Bommakal | 505002 | Active
Telangana | Karimnagar | Durshed | 505002 | Active
Telangana | Karimnagar | Kamanpur | 505002 | Active
Telangana | Karimnagar | Arepalli | 505002 | Active
Telangana | Karimnagar | Chinthakunta | 505002 | Active
Telangana | Karimnagar | Vidyaranyapuri | 505002 | Active
Telangana | Karimnagar | Satavahana University Campus | 505002 | Active
Telangana | Karimnagar | Chegurthi | 505002 | Active
Telangana | Karimnagar | Mukharampura | 505002 | Active

Telangana | Karimnagar | Kandgal | 505101 | Active
Telangana | Karimnagar | Dharmarajpalli | 505101 | Active

Telangana | Karimnagar | Madipalli | 505122 | Active
Telangana | Karimnagar | Dharmaram | 505122 | Active
Telangana | Karimnagar | Kanagarthi | 505122 | Active
Telangana | Karimnagar | Shayampet | 505122 | Active
Telangana | Karimnagar | Chelpur | 505122 | Active
Telangana | Karimnagar | Sarsaid | 505122 | Active
Telangana | Karimnagar | Illanthakunta | 505122 | Active
Telangana | Karimnagar | Mallial | 505122 | Active
Telangana | Karimnagar | Jammikunta | 505122 | Active

Telangana | Karimnagar | Kanaparthi | 505129 | Active
Telangana | Karimnagar | Valbhapur | 505129 | Active
Telangana | Karimnagar | Korepalli | 505129 | Active
Telangana | Karimnagar | Machanpalli | 505129 | Active
Telangana | Karimnagar | Bedgal | 505129 | Active
Telangana | Karimnagar | Pothireddipalli | 505129 | Active
Telangana | Karimnagar | Khadeemabadi | 505129 | Active

Telangana | Karimnagar | Ithrajpalle | 505186 | Active
Telangana | Karimnagar | Mukdampur | 505186 | Active
Telangana | Karimnagar | Chamanpalli | 505186 | Active
Telangana | Karimnagar | Gollapalli | 505186 | Active
Telangana | Karimnagar | Cherlabuthkur | 505186 | Active
Telangana | Karimnagar | Garrepalli | 505186 | Active
Telangana | Karimnagar | Bonthakuntapalli | 505186 | Active
Telangana | Karimnagar | Dubbapalli | 505186 | Active

Telangana | Karimnagar | Asifnagar | 505401 | Active
Telangana | Karimnagar | Elgandal | 505401 | Active
Telangana | Karimnagar | Nagulamallial | 505401 | Active

Telangana | Karimnagar | Kolimikunta | 505415 | Active
Telangana | Karimnagar | Chityalapalli | 505415 | Active
Telangana | Karimnagar | Vedurugatta | 505415 | Active
Telangana | Karimnagar | Ragumpet | 505415 | Active
Telangana | Karimnagar | Rukmapur | 505415 | Active
Telangana | Karimnagar | Choppadandi | 505415 | Active
Telangana | Karimnagar | Nagunur | 505415 | Active
Telangana | Karimnagar | Revelli | 505415 | Active
Telangana | Karimnagar | Bhupalapatnam | 505415 | Active
Telangana | Karimnagar | Arnakonda | 505415 | Active
Telangana | Karimnagar | Chakunta | 505415 | Active

Telangana | Karimnagar | Achampalli | 505445 | Active
Telangana | Karimnagar | Nagireddipur | 505445 | Active
Telangana | Karimnagar | Kurikyal | 505445 | Active
Telangana | Karimnagar | Upper Mallial | 505445 | Active
Telangana | Karimnagar | Mallapur | 505445 | Active
Telangana | Karimnagar | Narayanpur | 505445 | Active
Telangana | Karimnagar | Venkataipalli | 505445 | Active
Telangana | Karimnagar | Garshakurthy | 505445 | Active
Telangana | Karimnagar | Gangadhara | 505445 | Active
Telangana | Karimnagar | Gattubhuthkur | 505445 | Active

Telangana | Karimnagar | Vedira | 505451 | Active
Telangana | Karimnagar | Velchal | 505451 | Active
Telangana | Karimnagar | Deshrajpalli | 505451 | Active
Telangana | Karimnagar | Vannaram | 505451 | Active
Telangana | Karimnagar | Malkapur | 505451 | Active
Telangana | Karimnagar | Kothapalli | 505451 | Active

Telangana | Karimnagar | Nawabpet | 505467 | Active
Telangana | Karimnagar | Sunderagiri | 505467 | Active
Telangana | Karimnagar | Chigurumamidi | 505467 | Active

Telangana | Karimnagar | Huzurabad | 505468 | Active

Telangana | Karimnagar | Polampalli | 505469 | Active
Telangana | Karimnagar | Parlapalli | 505469 | Active
Telangana | Karimnagar | Manakondur | 505469 | Active
Telangana | Karimnagar | Gattududdenapalli | 505469 | Active
Telangana | Karimnagar | Annaram | 505469 | Active
Telangana | Karimnagar | Veldhi | 505469 | Active
Telangana | Karimnagar | Mannempalli | 505469 | Active
Telangana | Karimnagar | Porandla | 505469 | Active
Telangana | Karimnagar | Mallapur | 505469 | Active
Telangana | Karimnagar | Lingapur | 505469 | Active
Telangana | Karimnagar | Munjampalli | 505469 | Active
Telangana | Karimnagar | Chengerla | 505469 | Active

Telangana | Karimnagar | Muttaram | 505470 | Active
Telangana | Karimnagar | Molangur | 505470 | Active
Telangana | Karimnagar | Rajapur | 505470 | Active
Telangana | Karimnagar | Kachapur | 505470 | Active
Telangana | Karimnagar | Metpalli | 505470 | Active
Telangana | Karimnagar | Amudalapalli | 505470 | Active
Telangana | Karimnagar | Gaddapak | 505470 | Active
Telangana | Karimnagar | Kannapur | 505470 | Active

Telangana | Karimnagar | Aknoor | 505472 | Active
Telangana | Karimnagar | Saidapur | 505472 | Active
Telangana | Karimnagar | Bommanapalli | 505472 | Active
Telangana | Karimnagar | Ullampalli | 505472 | Active
Telangana | Karimnagar | Duddenapalli | 505472 | Active
Telangana | Karimnagar | Shivarampalli | 505472 | Active
Telangana | Karimnagar | Ramachandrapuram | 505472 | Active
Telangana | Karimnagar | Ghanpur | 505472 | Active

Telangana | Karimnagar | Mogalipalam | 505474 | Active
Telangana | Karimnagar | Ambalpur | 505474 | Active
Telangana | Karimnagar | Rekonda | 505474 | Active
Telangana | Karimnagar | Gangipalli | 505474 | Active
Telangana | Karimnagar | Yaradpalli | 505474 | Active
Telangana | Karimnagar | Tadikal | 505474 | Active

Telangana | Karimnagar | Kondapalkala | 505475 | Active
Telangana | Karimnagar | Bijnur | 505475 | Active
Telangana | Karimnagar | Vilasagar | 505475 | Active
Telangana | Karimnagar | Vanthadupula | 505475 | Active
Telangana | Karimnagar | Thanugula | 505475 | Active
Telangana | Karimnagar | Vavilala | 505475 | Active
Telangana | Karimnagar | Bijgirsharif | 505475 | Active
Telangana | Karimnagar | Tekurthi | 505475 | Active
Telangana | Karimnagar | Rachapalli | 505475 | Active

Telangana | Karimnagar | Katrapalli | 505480 | Active
Telangana | Karimnagar | Amangurthi | 505480 | Active
Telangana | Karimnagar | Raikal | 505480 | Active

Telangana | Karimnagar | Nallagonda | 505481 | Active
Telangana | Karimnagar | Ramancha | 505481 | Active
Telangana | Karimnagar | Mudimanikyam | 505481 | Active
Telangana | Karimnagar | Mulkanur | 505481 | Active
Telangana | Karimnagar | Indurthi | 505481 | Active
Telangana | Karimnagar | Kothapalli | 505481 | Active
Telangana | Karimnagar | Nustulapur | 505481 | Active

Telangana | Karimnagar | Kothaghat | 505490 | Active
Telangana | Karimnagar | Keshavapatnam | 505490 | Active
Telangana | Karimnagar | Erukulagudem | 505490 | Active
Telangana | Karimnagar | Singapur | 505490 | Active
Telangana | Karimnagar | Thumenapalli | 505490 | Active
Telangana | Karimnagar | Eklaspur | 505490 | Active
Telangana | Karimnagar | Vennampalli | 505490 | Active

Telangana | Karimnagar | Kanikulagidda | 505498 | Active
Telangana | Karimnagar | Godashal | 505498 | Active
Telangana | Karimnagar | Papaiahpalli | 505498 | Active
Telangana | Karimnagar | Yellabotharam | 505498 | Active
Telangana | Karimnagar | Kakatiya Canal Campus | 505498 | Active
Telangana | Karimnagar | Jupaka | 505498 | Active
Telangana | Karimnagar | Sirsapalli | 505498 | Active
Telangana | Karimnagar | Pothireddipet | 505498 | Active
Telangana | Karimnagar | Bornapalli | 505498 | Active
Telangana | Karimnagar | Rampur | 505498 | Active

Telangana | Karimnagar | Deshaipalli | 505502 | Active
Telangana | Karimnagar | Ghanmukla | 505502 | Active
Telangana | Karimnagar | Kondapaka | 505502 | Active
Telangana | Karimnagar | Narsingapur | 505502 | Active
Telangana | Karimnagar | Yelbak | 505502 | Active
Telangana | Karimnagar | Veenavanka | 505502 | Active
Telangana | Karimnagar | Koorkal | 505502 | Active
Telangana | Karimnagar | Reddipalli | 505502 | Active

Telangana | Karimnagar | Vegurpalli | 505505 | Active
Telangana | Karimnagar | Devampalli | 505505 | Active
Telangana | Karimnagar | Pachnur | 505505 | Active
Telangana | Karimnagar | Challur | 505505 | Active
Telangana | Karimnagar | Mamidalapalli | 505505 | Active
Telangana | Karimnagar | Kalleda | 505505 | Active
Telangana | Karimnagar | Laxmipuram | 505505 | Active
Telangana | Karimnagar | Ootur | 505505 | Active

Telangana | Karimnagar | Vardhavelli | 505524 | Active

Telangana | Karimnagar | Algunur | 505527 | Active
Telangana | Karimnagar | Lower Manair Dam Colony | 505527 | Active
Telangana | Karimnagar | Thimmapur | 505527 | Active

Telangana | Karimnagar | Jangapalli | 505530 | Active
Telangana | Karimnagar | Mylaram | 505530 | Active
Telangana | Karimnagar | Gunukula Kondapur | 505530 | Active
Telangana | Karimnagar | Nedunur | 505530 | Active
Telangana | Karimnagar | Renikunta | 505530 | Active
Telangana | Karimnagar | Gannervaram | 505530 | Active
Telangana | Karimnagar | Vachunur | 505530 | Active

Telangana | Karimnagar | Katnapalli | 505531 | Active
Telangana | Karimnagar | Ramadugu | 505531 | Active
Telangana | Karimnagar | Ryalapalli | 505531 | Active
Telangana | Karimnagar | Sarvareddypalli | 505531 | Active
Telangana | Karimnagar | Gundi | 505531 | Active
Telangana | Karimnagar | Laxmipur | 505531 | Active
Telangana | Karimnagar | Gumlapur | 505531 | Active
Telangana | Karimnagar | Mothe | 505531 | Active
Telangana | Karimnagar | Rudraram | 505531 | Active
Telangana | Karimnagar | Thirumalapur | 505531 | Active
Telangana | Karimnagar | Gopalraopet | 505531 | Active
Telangana | Karimnagar | Shanagar | 505531 | Active
`;

async function importServiceAreas() {
  console.log('--- Starting Karimnagar Service Areas Import ---');

  // 1. Parse raw data lines
  const lines = rawData.trim().split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('State |'));

  console.log(`Parsed total lines from input: ${lines.length}`);

  const parsedItems = [];
  const seenKeyInInput = new Set();

  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 4) {
      const state = parts[0] || 'Telangana';
      const city = parts[1] || 'Karimnagar';
      const locality = parts[2];
      const pincode = parts[3];
      const status = (parts[4] || 'Active').toLowerCase();
      const isActive = status === 'active';

      const uniqueKey = `${city.toLowerCase()}|${locality.toLowerCase()}|${pincode}`;
      if (seenKeyInInput.has(uniqueKey)) {
        console.log(`[Input Duplicate Skipped]: ${city} - ${locality} (${pincode})`);
        continue;
      }
      seenKeyInInput.add(uniqueKey);

      parsedItems.push({
        state,
        city,
        locality_name: locality,
        zone_name: locality,
        pincode,
        timezone: 'Asia/Kolkata',
        is_serviceable: isActive,
        is_active: isActive,
        sort_order: 0,
      });
    }
  }

  console.log(`Unique items to process: ${parsedItems.length}`);

  // 2. Fetch all existing records in service_areas from Supabase
  const { data: existingRows, error: fetchErr } = await supabase
    .from('service_areas')
    .select('id, city, locality_name, pincode');

  if (fetchErr) {
    console.error('Error fetching existing service areas:', fetchErr);
    process.exit(1);
  }

  console.log(`Existing rows in DB: ${existingRows.length}`);
  const existingSet = new Set(
    (existingRows || []).map(r => `${(r.city || '').toLowerCase()}|${(r.locality_name || '').toLowerCase()}|${String(r.pincode || '').trim()}`)
  );

  const itemsToInsert = [];
  const itemsToUpdate = [];

  for (const item of parsedItems) {
    const key = `${item.city.toLowerCase()}|${item.locality_name.toLowerCase()}|${item.pincode}`;
    if (existingSet.has(key)) {
      // Find matching row id and update
      const existingMatch = existingRows.find(
        r => `${(r.city || '').toLowerCase()}|${(r.locality_name || '').toLowerCase()}|${String(r.pincode || '').trim()}` === key
      );
      if (existingMatch) {
        itemsToUpdate.push({ id: existingMatch.id, ...item });
      }
    } else {
      itemsToInsert.push(item);
    }
  }

  console.log(`Items to insert (brand new): ${itemsToInsert.length}`);
  console.log(`Items already existing (updating to ensure Active): ${itemsToUpdate.length}`);

  // 3. Batch insert new items
  if (itemsToInsert.length > 0) {
    // Insert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
      const chunk = itemsToInsert.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('service_areas')
        .insert(chunk)
        .select();

      if (error) {
        console.error(`Error inserting chunk starting at ${i}:`, error);
      } else {
        console.log(`Inserted chunk of ${chunk.length} items (rows ${i + 1} to ${i + chunk.length})`);
      }
    }
  }

  // 4. Update any existing items to Active
  for (const item of itemsToUpdate) {
    const { error } = await supabase
      .from('service_areas')
      .update({
        is_active: true,
        is_serviceable: true,
        state: item.state,
      })
      .eq('id', item.id);

    if (error) {
      console.error(`Error updating item ${item.id}:`, error);
    }
  }

  // 5. Verification
  const { data: finalRows, count } = await supabase
    .from('service_areas')
    .select('*', { count: 'exact' });

  const karimnagarCount = (finalRows || []).filter(r => r.city === 'Karimnagar').length;
  console.log(`\n======================================================`);
  console.log(`Total service_areas in database: ${count || finalRows.length}`);
  console.log(`Karimnagar active records: ${karimnagarCount}`);
  console.log(`Distinct cities:`, Array.from(new Set(finalRows.map(r => r.city))));
  console.log(`======================================================`);
}

importServiceAreas().catch(err => console.error(err));
