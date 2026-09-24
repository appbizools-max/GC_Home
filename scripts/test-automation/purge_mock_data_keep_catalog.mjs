const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

async function purgeTable(tableName) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id`, { headers });
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`   ${tableName}: 0 rows to delete.`);
    return;
  }
  console.log(`   Deleting ${rows.length} rows from ${tableName}...`);
  for (const row of rows) {
    const dRes = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${row.id}`, {
      method: 'DELETE',
      headers,
    });
    if (dRes.status !== 204 && dRes.status !== 200) {
      console.warn(`     Failed to delete ${tableName} id=${row.id}: HTTP ${dRes.status}`);
    }
  }
  console.log(`   ${tableName}: Purge completed.`);
}

async function purgeMockData() {
  console.log('================================================================');
  console.log('🧹 GC HOME+ PURGING ALL MOCK RUNTIME DATA (ORDERED DELETION)');
  console.log('================================================================\n');

  // Ordered deletion to satisfy foreign keys
  await purgeTable('ratings');
  await purgeTable('chat_messages');
  await purgeTable('notifications');
  await purgeTable('bookings');
  await purgeTable('maid_profiles');

  console.log('\n📊 Verifying Final Counts...');
  const verifyTables = [
    'bookings',
    'maid_profiles',
    'notifications',
    'ratings',
    'chat_messages',
    'service_categories',
    'services',
    'service_addons',
    'homepage_banners',
    'offers'
  ];

  const finalCounts = {};
  for (const t of verifyTables) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=id`, { headers });
    const rows = await res.json();
    finalCounts[t] = Array.isArray(rows) ? rows.length : -1;
    console.log(`   ${t}: ${finalCounts[t]} rows`);
  }

  console.log('\n================================================================');
  if (
    finalCounts.bookings === 0 &&
    finalCounts.maid_profiles === 0 &&
    finalCounts.notifications === 0 &&
    finalCounts.ratings === 0 &&
    finalCounts.chat_messages === 0 &&
    finalCounts.service_categories === 18 &&
    finalCounts.services === 90 &&
    finalCounts.service_addons === 57 &&
    finalCounts.homepage_banners === 3 &&
    finalCounts.offers === 4
  ) {
    console.log('✅ SUCCESS: 0 mock runtime records remain! 100% of Catalog Preserved!');
  } else {
    console.log('⚠️ CHECK COUNTS: Some records remain or catalog count differs.');
  }
  console.log('================================================================');
}

purgeMockData().catch(console.error);
