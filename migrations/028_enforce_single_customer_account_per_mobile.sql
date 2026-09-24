-- 1. Drop foreign key constraint on user_profiles.id if present to allow standalone app customer profiles
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS fk_user_profiles_id;

-- 2. Ensure lookup index on phone number in user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone);

-- 2. Ensure name, full_name, and phone are present and aligned
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz DEFAULT now();
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';

-- 3. Idempotent Function: get_or_create_customer_profile
CREATE OR REPLACE FUNCTION public.get_or_create_customer_profile(
  p_phone text,
  p_full_name text DEFAULT NULL,
  p_city text DEFAULT 'Hyderabad',
  p_address text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  full_name text,
  phone text,
  email text,
  role text,
  city text,
  address text,
  is_existing boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id uuid;
  v_existing_name text;
  v_existing_email text;
  v_existing_role text;
  v_existing_city text;
  v_existing_address text;
  v_new_id uuid;
BEGIN
  -- Search for existing profile by phone number
  SELECT up.id, COALESCE(up.name, up.full_name), up.email, up.role, up.city, up.address
  INTO v_existing_id, v_existing_name, v_existing_email, v_existing_role, v_existing_city, v_existing_address
  FROM public.user_profiles up
  WHERE up.phone = p_phone
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Update last login timestamp
    UPDATE public.user_profiles
    SET last_login_at = now(),
        updated_at = now()
    WHERE public.user_profiles.id = v_existing_id;

    RETURN QUERY
    SELECT v_existing_id, v_existing_name, v_existing_name, p_phone, v_existing_email, COALESCE(v_existing_role, 'customer'), v_existing_city, v_existing_address, true;
    RETURN;
  END IF;

  -- Create new profile if not exists
  v_new_id := gen_random_uuid();
  INSERT INTO public.user_profiles (
    id, name, full_name, phone, role, customer_type, address, city, account_status, last_login_at, created_at, updated_at
  ) VALUES (
    v_new_id, COALESCE(p_full_name, 'Customer'), COALESCE(p_full_name, 'Customer'), p_phone, 'customer', 'Regular Customer', p_address, p_city, 'active', now(), now(), now()
  );

  RETURN QUERY
  SELECT v_new_id, COALESCE(p_full_name, 'Customer'), COALESCE(p_full_name, 'Customer'), p_phone, NULL::text, 'customer'::text, p_city, p_address, false;
END;
$$;

-- 4. Enable RLS and verify policies on user_profiles, saved_addresses, bookings
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select user_profiles" ON public.user_profiles;
CREATE POLICY "Public select user_profiles" ON public.user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert user_profiles" ON public.user_profiles;
CREATE POLICY "Public insert user_profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update user_profiles" ON public.user_profiles;
CREATE POLICY "Public update user_profiles" ON public.user_profiles FOR UPDATE USING (true);
