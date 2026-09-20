-- ============================================================
-- FILE: migrations/002_data_migration.sql
-- Idempotent: safe to run multiple times without errors
-- Run AFTER 001_phase1_foundation.sql
-- ============================================================

-- ------------------------------------------------------------
-- STEP 0: Safety - Drop foreign key constraint on maid_profiles.id
-- so that legacy maid IDs from backup tables can be migrated safely
-- ------------------------------------------------------------
ALTER TABLE public.maid_profiles DROP CONSTRAINT IF EXISTS maid_profiles_id_fkey;

-- ------------------------------------------------------------
-- STEP 1: Migrate maids → maid_profiles
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_backup_maids'
  ) THEN
    -- Ensure columns exist so the SELECT query cannot fail on schema variations
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS full_name text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS name text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS address text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS hub_zone text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS service_area text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS city text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS status text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS rejection_reason text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS is_online boolean;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS rating numeric;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS created_at timestamptz;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS approved_at timestamptz;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS bank_account text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS bank_ifsc text;
    ALTER TABLE public._backup_maids ADD COLUMN IF NOT EXISTS bank_name text;

    INSERT INTO public.maid_profiles (
      id,
      full_name,
      phone,
      email,
      address,
      service_area,
      status,
      rejection_reason,
      is_online,
      rating,
      bank_account_number,
      bank_ifsc,
      bank_name,
      applied_at,
      approved_at,
      health_safety_decl
    )
    SELECT
      id,
      COALESCE(full_name, name, 'Maid Partner'),
      phone,
      email,
      COALESCE(address, hub_zone, service_area, ''),
      COALESCE(hub_zone, service_area, city, 'Hyderabad'),
      CASE
        WHEN status IN ('none', 'pending', 'approved', 'rejected') THEN status::public.maid_application_status
        ELSE 'pending'::public.maid_application_status
      END,
      rejection_reason,
      COALESCE(is_online, false),
      COALESCE(rating, 0),
      bank_account,
      bank_ifsc,
      bank_name,
      COALESCE(created_at, now()),
      approved_at,
      true
    FROM public._backup_maids
    WHERE id IS NOT NULL
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'SUCCESS: public._backup_maids migrated into public.maid_profiles';
  ELSE
    RAISE NOTICE 'SKIP: public._backup_maids does not exist, skipping maid migration.';
  END IF;
END $$;

-- ------------------------------------------------------------
-- Also migrate _backup_maid_profiles if present
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_backup_maid_profiles'
  ) THEN
    -- Ensure columns exist so SELECT never fails on schema variations
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS full_name text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS name text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS date_of_birth text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS gender text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS photo_url text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS id_proof_url text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS emergency_contact text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS address text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS city text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS service_area text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS service_radius_km integer;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS status text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS kyc_status text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS kyc_completion_pct integer;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS kyc_documents jsonb;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS rejection_reason text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS rejected_by text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS applied_at timestamptz;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS is_online boolean;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS rating numeric;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS total_ratings_count integer;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS completed_jobs_count integer;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS last_active timestamptz;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS bank_account_name text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS bank_account_number text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS bank_ifsc text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS bank_name text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS earnings_this_month integer;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS total_earnings integer;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS health_safety_decl boolean;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS admin_notes text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS age integer;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS experience text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS quote text;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS created_at timestamptz;
    ALTER TABLE public._backup_maid_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz;

    INSERT INTO public.maid_profiles (
      id,
      full_name,
      phone,
      email,
      date_of_birth,
      gender,
      photo_url,
      id_proof_url,
      emergency_contact,
      address,
      city,
      service_area,
      service_radius_km,
      status,
      kyc_status,
      kyc_completion_pct,
      kyc_documents,
      rejection_reason,
      rejected_by,
      rejected_at,
      applied_at,
      approved_at,
      is_online,
      rating,
      total_ratings_count,
      completed_jobs_count,
      last_active,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      bank_name,
      earnings_this_month,
      total_earnings,
      health_safety_decl,
      admin_notes,
      age,
      experience,
      quote,
      created_at,
      updated_at
    )
    SELECT
      id,
      COALESCE(full_name, name, 'Maid Partner'),
      phone,
      email,
      CASE
        WHEN date_of_birth IS NULL THEN NULL
        WHEN date_of_birth::text ~ '^\d{4}-\d{2}-\d{2}' THEN (substring(date_of_birth::text from 1 for 10))::date
        ELSE NULL
      END,
      gender,
      photo_url,
      id_proof_url,
      emergency_contact,
      COALESCE(address, ''),
      COALESCE(city, 'Hyderabad'),
      COALESCE(service_area, 'Hyderabad'),
      COALESCE(service_radius_km, 5),
      CASE
        WHEN status::text IN ('none', 'pending', 'approved', 'rejected') THEN status::text::public.maid_application_status
        ELSE 'pending'::public.maid_application_status
      END,
      COALESCE(kyc_status, 'pending'),
      COALESCE(kyc_completion_pct, 0),
      COALESCE(kyc_documents, '[]'::jsonb),
      rejection_reason,
      rejected_by,
      rejected_at,
      COALESCE(applied_at, created_at, now()),
      approved_at,
      COALESCE(is_online, false),
      COALESCE(rating, 0),
      COALESCE(total_ratings_count, 0),
      COALESCE(completed_jobs_count, 0),
      last_active,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      bank_name,
      COALESCE(earnings_this_month, 0),
      COALESCE(total_earnings, 0),
      COALESCE(health_safety_decl, true),
      admin_notes,
      age,
      experience,
      quote,
      COALESCE(created_at, now()),
      COALESCE(updated_at, now())
    FROM public._backup_maid_profiles
    WHERE id IS NOT NULL
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'SUCCESS: public._backup_maid_profiles migrated into public.maid_profiles';
  END IF;
END $$;

-- ------------------------------------------------------------
-- STEP 2: Migrate bookings → bookings
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_backup_bookings'
  ) THEN
    -- Ensure columns exist so query never fails
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS id uuid;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS booking_id text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS customer_id text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS customer_name text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS customer_phone text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS service_name text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS service_price text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS total_amount text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS address jsonb;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS date text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS time_slot text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS status text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS payment_method text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS payment_status text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS assigned_maid_id text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS assigned_maid_name text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS assigned_maid_phone text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS assigned_maid_photo text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS assigned_maid_photo_url text;
    ALTER TABLE public._backup_bookings ADD COLUMN IF NOT EXISTS created_at timestamptz;

    INSERT INTO public.bookings (
      id,
      booking_code,
      customer_id,
      customer_name,
      customer_phone,
      service_name,
      service_price,
      total_amount,
      address_label,
      address_street,
      address_locality,
      address_city,
      address_pincode,
      scheduled_date,
      time_slot,
      status,
      payment_method,
      payment_status,
      assigned_maid_id,
      assigned_maid_name,
      assigned_maid_phone,
      assigned_maid_photo_url,
      created_at
    )
    SELECT
      COALESCE(id::uuid, gen_random_uuid()),
      COALESCE(booking_id, 'GC-MIG-' || substring(md5(COALESCE(id::text, 'gc-booking')), 1, 8)),
      CASE
        WHEN customer_id IS NOT NULL AND customer_id::text ~ '^[0-9a-f-]{36}$'
             AND EXISTS (SELECT 1 FROM public.user_profiles WHERE id = customer_id::uuid)
        THEN customer_id::uuid
        ELSE NULL
      END,
      COALESCE(customer_name, 'Customer'),
      customer_phone,
      COALESCE(service_name, 'Home Cleaning'),
      COALESCE(NULLIF(regexp_replace(service_price::text, '[^0-9]', '', 'g'), '')::integer,
               NULLIF(regexp_replace(total_amount::text, '[^0-9]', '', 'g'), '')::integer, 0),
      COALESCE(NULLIF(regexp_replace(total_amount::text, '[^0-9]', '', 'g'), '')::integer,
               NULLIF(regexp_replace(service_price::text, '[^0-9]', '', 'g'), '')::integer, 0),
      -- Address extraction (handles JSONB object or text)
      CASE
        WHEN address IS NOT NULL AND jsonb_typeof(to_jsonb(address)) = 'object'
          THEN COALESCE(to_jsonb(address)->>'label', 'Home')
        ELSE 'Home'
      END,
      CASE
        WHEN address IS NOT NULL AND jsonb_typeof(to_jsonb(address)) = 'object'
          THEN COALESCE(to_jsonb(address)->>'street', '')
        ELSE COALESCE(address::text, '')
      END,
      CASE
        WHEN address IS NOT NULL AND jsonb_typeof(to_jsonb(address)) = 'object'
          THEN COALESCE(to_jsonb(address)->>'locality', '')
        ELSE ''
      END,
      CASE
        WHEN address IS NOT NULL AND jsonb_typeof(to_jsonb(address)) = 'object'
          THEN COALESCE(to_jsonb(address)->>'city', 'Hyderabad')
        ELSE 'Hyderabad'
      END,
      CASE
        WHEN address IS NOT NULL AND jsonb_typeof(to_jsonb(address)) = 'object'
          THEN COALESCE(to_jsonb(address)->>'pincode', '')
        ELSE ''
      END,
      -- Scheduled Date conversion with ISO check and CURRENT_DATE fallback
      COALESCE(
        CASE
          WHEN date::text ~ '^\d{4}-\d{2}-\d{2}$' THEN (date::text)::date
          ELSE NULL
        END,
        CURRENT_DATE
      ),
      COALESCE(time_slot, '10:00 AM'),
      CASE
        WHEN status IN ('pending_assignment','maid_assigned','maid_accepted','en_route',
                        'arrived','cleaning_started','in_progress','completed',
                        'cancelled','rescheduled') THEN status::public.booking_status
        WHEN status = 'pending' THEN 'pending_assignment'::public.booking_status
        WHEN status = 'ongoing' THEN 'in_progress'::public.booking_status
        ELSE 'pending_assignment'::public.booking_status
      END,
      CASE
        WHEN payment_method IN ('upi','card','cash','pay_on_completion','online') THEN payment_method::public.payment_method_enum
        WHEN payment_method ILIKE '%upi%' THEN 'upi'::public.payment_method_enum
        WHEN payment_method ILIKE '%card%' THEN 'card'::public.payment_method_enum
        WHEN payment_method ILIKE '%cash%' THEN 'cash'::public.payment_method_enum
        ELSE 'online'::public.payment_method_enum
      END,
      CASE
        WHEN payment_status IN ('pending','paid','refunded','failed') THEN payment_status::public.payment_status_enum
        ELSE 'paid'::public.payment_status_enum
      END,
      CASE
        WHEN assigned_maid_id IS NOT NULL AND assigned_maid_id::text ~ '^[0-9a-f-]{36}$'
             AND EXISTS (SELECT 1 FROM public.maid_profiles WHERE id = assigned_maid_id::uuid)
        THEN assigned_maid_id::uuid
        ELSE NULL
      END,
      assigned_maid_name,
      assigned_maid_phone,
      COALESCE(assigned_maid_photo, assigned_maid_photo_url),
      COALESCE(created_at, now())
    FROM public._backup_bookings b
    WHERE NOT EXISTS (
      SELECT 1 FROM public.bookings pb
      WHERE (b.id IS NOT NULL AND pb.id = b.id::uuid)
         OR (b.booking_id IS NOT NULL AND pb.booking_code = b.booking_id)
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'SUCCESS: public._backup_bookings migrated into public.bookings';
  ELSE
    RAISE NOTICE 'SKIP: public._backup_bookings does not exist, skipping booking migration.';
  END IF;
END $$;

-- ------------------------------------------------------------
-- STEP 3: Verification Notice Block
-- ------------------------------------------------------------
DO $$
DECLARE
  backup_maids_count integer := 0;
  migrated_maids_count integer := 0;
  backup_bookings_count integer := 0;
  migrated_bookings_count integer := 0;
BEGIN
  -- Verify Maids
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_backup_maids') THEN
    SELECT COUNT(*) INTO backup_maids_count FROM public._backup_maids WHERE id IS NOT NULL;
    SELECT COUNT(*) INTO migrated_maids_count FROM public.maid_profiles
      WHERE id IN (SELECT id FROM public._backup_maids WHERE id IS NOT NULL);

    IF migrated_maids_count < backup_maids_count THEN
      RAISE NOTICE 'Maid migration: % of % rows migrated.', migrated_maids_count, backup_maids_count;
    ELSE
      RAISE NOTICE 'Maid migration verified: all % rows migrated successfully.', backup_maids_count;
    END IF;
  ELSE
    SELECT COUNT(*) INTO migrated_maids_count FROM public.maid_profiles;
    RAISE NOTICE 'Maid profiles count: % rows in public.maid_profiles.', migrated_maids_count;
  END IF;

  -- Verify Bookings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_backup_bookings') THEN
    SELECT COUNT(*) INTO backup_bookings_count FROM public._backup_bookings;
    SELECT COUNT(*) INTO migrated_bookings_count FROM public.bookings
      WHERE booking_code IN (SELECT booking_id FROM public._backup_bookings WHERE booking_id IS NOT NULL);

    RAISE NOTICE 'Booking migration: % of % rows matched by booking_code.', migrated_bookings_count, backup_bookings_count;
  ELSE
    SELECT COUNT(*) INTO migrated_bookings_count FROM public.bookings;
    RAISE NOTICE 'Bookings count: % rows in public.bookings.', migrated_bookings_count;
  END IF;
END $$;

SELECT '002_data_migration.sql completed successfully.' AS status;
