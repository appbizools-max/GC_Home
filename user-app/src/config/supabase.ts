import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

const DEFAULT_SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabaseUrl =
  typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_SUPABASE_URL
    ? process.env.EXPO_PUBLIC_SUPABASE_URL
    : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
