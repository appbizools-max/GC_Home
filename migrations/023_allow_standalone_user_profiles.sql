-- Migration 023: Allow Standalone User Profiles & Sync Customer Data
-- Drop strict auth.users FK constraint on user_profiles so client app OTP users register cleanly
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Ensure both 'name' and 'full_name' columns exist for maximum compatibility
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Grant RLS permissions for public anon inserts and reads on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select user_profiles" ON public.user_profiles;
CREATE POLICY "Public select user_profiles" ON public.user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert user_profiles" ON public.user_profiles;
CREATE POLICY "Public insert user_profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update user_profiles" ON public.user_profiles;
CREATE POLICY "Public update user_profiles" ON public.user_profiles FOR UPDATE USING (true);
