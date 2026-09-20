-- ============================================================
-- FILE: migrations/tests/smoke_001_schema.sql
-- Purpose: Smoke test — verify that 001_phase1_foundation.sql
--          schema components exist and are correctly configured.
--
-- PREREQUISITES:
--   Run 001_phase1_foundation.sql in Supabase SQL Editor before this test.
--
-- HOW TO RUN:
--   Paste this file into the Supabase SQL editor and execute.
--   Check the output notices and final result set.
-- ============================================================

DO $$
DECLARE
  missing_tables text[] := '{}';
  expected_tables text[] := ARRAY[
    'user_profiles', 'admin_users', 'services',
    'maid_profiles', 'bookings', 'saved_addresses'
  ];
  t text;

  missing_enums text[] := '{}';
  expected_enums text[] := ARRAY[
    'booking_status', 'maid_application_status', 'kyc_doc_type',
    'kyc_doc_status', 'payment_method_enum', 'payment_status_enum',
    'assignment_status', 'payout_status', 'notification_category'
  ];
  e text;

  services_count integer := 0;
  rls_missing text[] := '{}';
BEGIN
  -- 1. Check Tables
  FOREACH t IN ARRAY expected_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      missing_tables := array_append(missing_tables, t);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'SMOKE TEST FAILED: Missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE 'SUCCESS: All 6 required tables exist in public schema.';
  END IF;

  -- 2. Check Enums
  FOREACH e IN ARRAY expected_enums LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = e
    ) THEN
      missing_enums := array_append(missing_enums, e);
    END IF;
  END LOOP;

  IF array_length(missing_enums, 1) > 0 THEN
    RAISE EXCEPTION 'SMOKE TEST FAILED: Missing enums: %', missing_enums;
  ELSE
    RAISE NOTICE 'SUCCESS: All 9 required enum types exist.';
  END IF;

  -- 3. Check Sequence
  IF NOT EXISTS (
    SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'maid_code_seq'
  ) THEN
    RAISE EXCEPTION 'SMOKE TEST FAILED: Sequence maid_code_seq missing.';
  ELSE
    RAISE NOTICE 'SUCCESS: Sequence maid_code_seq exists.';
  END IF;

  -- 4. Check RLS enabled
  FOREACH t IN ARRAY expected_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t AND rowsecurity = true
    ) THEN
      rls_missing := array_append(rls_missing, t);
    END IF;
  END LOOP;

  IF array_length(rls_missing, 1) > 0 THEN
    RAISE EXCEPTION 'SMOKE TEST FAILED: RLS not enabled on tables: %', rls_missing;
  ELSE
    RAISE NOTICE 'SUCCESS: RLS is enabled on all 6 tables.';
  END IF;

  -- 5. Check Seed Services
  SELECT COUNT(*) INTO services_count FROM services;
  IF services_count < 5 THEN
    RAISE EXCEPTION 'SMOKE TEST FAILED: Expected at least 5 services, found %', services_count;
  ELSE
    RAISE NOTICE 'SUCCESS: Services table contains % rows (expected >= 5).', services_count;
  END IF;

  RAISE NOTICE 'SMOKE TEST PASSED: All Phase 1 foundation schema checks completed successfully.';
END $$;

-- Summary query for visual verification in SQL Editor
SELECT
  t.table_name,
  t.row_security,
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM (
  SELECT tablename AS table_name, rowsecurity AS row_security
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('user_profiles','admin_users','services','maid_profiles','bookings','saved_addresses')
) t;
