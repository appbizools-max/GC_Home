import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const rawServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Verify service role key is valid JWT and not a placeholder
const isValidServiceRoleKey =
  rawServiceRoleKey &&
  typeof rawServiceRoleKey === 'string' &&
  rawServiceRoleKey.startsWith('ey') &&
  !rawServiceRoleKey.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = isValidServiceRoleKey
  ? createClient(supabaseUrl, rawServiceRoleKey)
  : supabase;

// Safe connection diagnostics (never prints secret keys)
if (import.meta.env.DEV) {
  try {
    const parsedUrl = new URL(supabaseUrl);
    console.log('[Supabase Diagnostic]', {
      urlConfigured: Boolean(supabaseUrl),
      publicKeyConfigured: Boolean(supabaseAnonKey),
      projectHost: parsedUrl.host,
      keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
      usingDedicatedAdminClient: isValidServiceRoleKey,
    });
  } catch {
    console.log('[Supabase Diagnostic] Invalid URL format');
  }
}
