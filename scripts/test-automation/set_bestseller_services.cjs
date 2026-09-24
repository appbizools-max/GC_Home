const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../../admin-panel/.env'), 'utf8');
let url = '', key = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
});

const headers = {
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function setBestsellers() {
  console.log('Updating top active services to is_bestseller = true in Supabase...');
  const res = await fetch(`${url}/rest/v1/services?display_order=lte.6`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_bestseller: true })
  });
  console.log('Response Status:', res.status);
  const data = await res.json();
  console.log('Updated Best Services:', data.map(d => ({ id: d.id, name: d.name, is_bestseller: d.is_bestseller })));
}

setBestsellers();
