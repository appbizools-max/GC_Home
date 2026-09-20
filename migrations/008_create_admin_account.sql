-- ==============================================================================
-- GC HOME+ — MIGRATION 008: CREATE DEFAULT ADMIN LOGIN ACCOUNT
-- ==============================================================================
-- Default Credentials:
-- Email:    admin@example.com
-- Password: Admin@123456
-- (You can change these values below before running)
-- ==============================================================================

DO $$
DECLARE
  v_admin_email text := 'admin@example.com';
  v_admin_password text := 'Admin@123456';
  v_user_id uuid;
  v_encrypted_pw text;
BEGIN
  -- 1. Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_admin_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    v_encrypted_pw := crypt(v_admin_password, gen_salt('bf'));

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_admin_email,
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin"}',
      now(),
      now()
    );

    -- Also insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, v_admin_email)::jsonb,
      'email',
      v_admin_email,
      now(),
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created auth.users record for % with id %', v_admin_email, v_user_id;
  ELSE
    -- If user exists, update password to ensure it matches
    UPDATE auth.users 
    SET 
      encrypted_password = crypt(v_admin_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE 'Existing user found for %, password updated.', v_admin_email;
  END IF;

  -- 2. Ensure row in public.admin_users
  INSERT INTO public.admin_users (id, email, name, role, created_at)
  VALUES (v_user_id, v_admin_email, 'Super Admin', 'admin', now())
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    role = 'admin';

  -- 3. Also ensure row in user_profiles
  ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name text;
  ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS name text;
  ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';
  ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone text;
  ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email text;

  INSERT INTO public.user_profiles (id, full_name, name, phone, email, role, created_at)
  VALUES (v_user_id, 'Super Admin', 'Super Admin', '+91 99999 00000', v_admin_email, 'admin', now())
  ON CONFLICT (id) DO UPDATE 
  SET 
    role = 'admin',
    full_name = EXCLUDED.full_name,
    name = EXCLUDED.name;

  RAISE NOTICE 'SUCCESS: Admin account % is ready to login!', v_admin_email;
END;
$$;
