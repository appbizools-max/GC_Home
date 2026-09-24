const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../../admin-panel/.env'), 'utf8');
let url = '', key = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
});

const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

async function checkCatalog() {
  const cRes = await fetch(`${url}/rest/v1/service_categories?select=*`, { headers });
  const categories = await cRes.json();
  console.log('=== SERVICE CATEGORIES IN SUPABASE ===');
  console.log(categories);

  const sRes = await fetch(`${url}/rest/v1/services?select=*`, { headers });
  const services = await sRes.json();
  console.log('\n=== SERVICES IN SUPABASE ===');
  console.log(services);
}

checkCatalog();
