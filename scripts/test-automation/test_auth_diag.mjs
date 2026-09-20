import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAuthDiag() {
  console.log('--- TEST 1: Attempt signInWithPassword ---');
  const res1 = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'Admin@123456'
  });
  console.log('SignIn result:', res1);

  console.log('\n--- TEST 2: Attempt signUp new test user ---');
  const testEmail = `test_admin_${Date.now()}@example.com`;
  const res2 = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!'
  });
  console.log('SignUp result:', res2);

  console.log('\n--- TEST 3: Attempt resetPasswordForEmail ---');
  const res3 = await supabase.auth.resetPasswordForEmail('admin@example.com');
  console.log('ResetPassword result:', res3);
}

runAuthDiag();
