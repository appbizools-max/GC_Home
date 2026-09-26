const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('====================================================');
  console.log('     COMPLETE SUPABASE DATABASE AUDIT REPORT        ');
  console.log('====================================================\n');

  const tables = [
    { name: 'maid_profiles', type: 'Operational / Partner data' },
    { name: 'user_profiles', type: 'Operational / Customer data' },
    { name: 'bookings', type: 'Operational / Orders data' },
    { name: 'booking_items', type: 'Operational / Order items data' },
    { name: 'partner_assignments', type: 'Operational / Assignments data' },
    { name: 'ratings_reviews', type: 'Operational / Reviews data' },
    { name: 'saved_addresses', type: 'Operational / Address data' },
    { name: 'notifications', type: 'Operational / Notifications' },
    { name: 'admin_users', type: 'System / Admin access' },
    { name: 'services', type: 'Catalog / Core service catalog' },
    { name: 'service_categories', type: 'Catalog / Categories' },
    { name: 'coupons', type: 'Catalog / Promo offers' }
  ];

  for (const t of tables) {
    try {
      const { data, count, error } = await supabase
        .from(t.name)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`[-] Table [${t.name}]: Error (${error.message})`);
      } else {
        const rowCount = count !== null && count !== undefined ? count : (data ? data.length : 0);
        console.log(`[+] Table [${t.name}] (${t.type}): ${rowCount} rows`);
        if (rowCount > 0 && t.name !== 'services' && t.name !== 'service_categories') {
          console.log(`    Sample rows in ${t.name}:`, JSON.stringify(data.slice(0, 2), null, 2));
        }
      }
    } catch (e) {
      console.log(`[!] Table [${t.name}]: Exception (${e.message})`);
    }
  }

  console.log('\n====================================================');
}

checkDatabase();
