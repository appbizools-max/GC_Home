import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const { createClient } = require(path.resolve(__dirname, '../../admin-panel/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';
const BUCKET = 'gc-home-assets';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CATALOG_DIR = path.resolve(__dirname, '../../admin-panel/public/assets/catalog');

async function uploadAllImages() {
  console.log('--- STARTING SUPABASE STORAGE UPLOAD FOR 108 CATALOG IMAGES ---');
  let successCount = 0;
  let failCount = 0;

  // 1. Upload Categories
  const catDir = path.join(CATALOG_DIR, 'categories');
  const catFiles = fs.readdirSync(catDir).filter(f => f.endsWith('.webp'));
  console.log(`Found ${catFiles.length} category files to upload...`);

  for (const f of catFiles) {
    const filePath = path.join(catDir, f);
    const storagePath = `categories/${f}`;
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.error(`FAILED to upload ${storagePath}:`, error.message);
      failCount++;
    } else {
      successCount++;
      console.log(`[${successCount}/108] Uploaded: ${storagePath}`);
    }
  }

  // 2. Upload Services
  const servicesBaseDir = path.join(CATALOG_DIR, 'services');
  const catSubdirs = fs.readdirSync(servicesBaseDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`Found ${catSubdirs.length} service category folders...`);

  for (const sub of catSubdirs) {
    const svcDir = path.join(servicesBaseDir, sub);
    const svcFiles = fs.readdirSync(svcDir).filter(f => f.endsWith('.webp'));

    for (const f of svcFiles) {
      const filePath = path.join(svcDir, f);
      const storagePath = `services/${sub}/${f}`;
      const fileBuffer = fs.readFileSync(filePath);

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (error) {
        console.error(`FAILED to upload ${storagePath}:`, error.message);
        failCount++;
      } else {
        successCount++;
        console.log(`[${successCount}/108] Uploaded: ${storagePath}`);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`UPLOAD COMPLETE!`);
  console.log(`Successfully uploaded: ${successCount}/108`);
  console.log(`Failed: ${failCount}`);
  console.log(`========================================`);

  if (failCount > 0) {
    process.exit(1);
  }
}

uploadAllImages().catch(err => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});
