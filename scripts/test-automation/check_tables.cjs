const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../../admin-panel/.env'), 'utf8');
let url = '', key = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
});

const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

async function checkTables() {
  const r1 = await fetch(`${url}/rest/v1/service_addons?select=*&limit=1`, { headers });
  const data1 = await r1.json();
  console.log('service_addons columns:', Object.keys((data1 && data1[0]) || {}));
}

checkTables();
