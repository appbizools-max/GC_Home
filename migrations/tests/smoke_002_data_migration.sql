-- ============================================================
-- FILE: migrations/tests/smoke_002_data_migration.sql
-- Purpose: Smoke test — verify that 002_data_migration.sql
--          is idempotent (safe to run a second time without error or duplicating rows).
--
-- PREREQUISITES:
--   Run 001_phase1_foundation.sql and 002_data_migration.sql before this test.
--
-- HOW TO RUN:
--   Paste this file into the Supabase SQL editor and execute.
-- ============================================================

DO $$
DECLARE
  initial_maid_count integer;
  final_maid_count integer;
  initial_booking_count integer;
  final_booking_count integer;
BEGIN
  -- Record initial counts
  SELECT COUNT(*) INTO initial_maid_count FROM public.maid_profiles;
  SELECT COUNT(*) INTO initial_booking_count FROM public.bookings;

  -- Attempt re-run of migration inserts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_backup_maids') THEN
    INSERT INTO public.maid_profiles (
      id, full_name, phone, email, address, service_area, status, rejection_reason, is_online, rating, applied_at, approved_at, health_safety_decl
    )
    SELECT
      id,
      COALESCE(full_name, name, 'Maid Partner'),
      phone, email,
      COALESCE(address, hub_zone, service_area, ''),
      COALESCE(hub_zone, service_area, city, 'Hyderabad'),
      CASE WHEN status IN ('none','pending','approved','rejected') THEN status::public.maid_application_status ELSE 'pending'::public.maid_application_status END,
      rejection_reason,
      COALESCE(is_online, false),
      COALESCE(rating, 0),
      COALESCE(created_at, now()),
      approved_at,
      true
    FROM public._backup_maids
    WHERE id IS NOT NULL
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_backup_bookings') THEN
    INSERT INTO public.bookings (
      id, booking_code, customer_id, customer_name, customer_phone,
      service_name, service_price, total_amount,
      address_label, address_street, address_locality, address_city, address_pincode,
      scheduled_date, time_slot, status, payment_method, payment_status,
      assigned_maid_id, assigned_maid_name, assigned_maid_phone, assigned_maid_photo_url, created_at
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
      COALESCE(NULLIF(regexp_replace(service_price::text, '[^0-9]', '', 'g'), '')::integer, 0),
      COALESCE(NULLIF(regexp_replace(total_amount::text, '[^0-9]', '', 'g'), '')::integer, 0),
      'Home', COALESCE(address::text, ''), '', 'Hyderabad', '',
      COALESCE(CASE WHEN date::text ~ '^\d{4}-\d{2}-\d{2}$' THEN (date::text)::date ELSE NULL END, CURRENT_DATE),
      COALESCE(time_slot, '10:00 AM'),
      'pending_assignment'::public.booking_status,
      'online'::public.payment_method_enum,
      'paid'::public.payment_status_enum,
      NULL, assigned_maid_name, assigned_maid_phone, NULL, COALESCE(created_at, now())
    FROM public._backup_bookings b
    WHERE NOT EXISTS (
      SELECT 1 FROM public.bookings pb
      WHERE (b.id IS NOT NULL AND pb.id = b.id::uuid)
         OR (b.booking_id IS NOT NULL AND pb.booking_code = b.booking_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Record counts after re-run
  SELECT COUNT(*) INTO final_maid_count FROM public.maid_profiles;
  SELECT COUNT(*) INTO final_booking_count FROM public.bookings;

  IF final_maid_count <> initial_maid_count THEN
    RAISE EXCEPTION 'IDEMPOTENCY FAILED: maid_profiles count changed from % to %', initial_maid_count, final_maid_count;
  END IF;

  IF final_booking_count <> initial_booking_count THEN
    RAISE EXCEPTION 'IDEMPOTENCY FAILED: bookings count changed from % to %', initial_booking_count, final_booking_count;
  END IF;

  RAISE NOTICE 'SUCCESS: Migration idempotency verified. Counts remained stable: % maids, % bookings.',
    final_maid_count, final_booking_count;
END $$;

SELECT
  (SELECT COUNT(*) FROM public.maid_profiles) AS total_maid_profiles,
  (SELECT COUNT(*) FROM public.bookings) AS total_bookings,
  (SELECT COUNT(*) FROM public.services) AS total_services,
  'Data migration idempotency check passed' AS status;
