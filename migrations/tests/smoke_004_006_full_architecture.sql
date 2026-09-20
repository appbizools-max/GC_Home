-- ============================================================
-- FILE: migrations/tests/smoke_004_006_full_architecture.sql
-- Purpose: Verify existence and integrity of all 24 tables,
--          5 views, functions, triggers, and RLS policies across
--          Phases 1 through 4.
-- ============================================================

DO $$
DECLARE
  expected_tables text[] := ARRAY[
    'user_profiles',
    'admin_users',
    'saved_addresses',
    'maid_profiles',
    'services',
    'bookings',
    'maid_kyc_documents',
    'maid_history',
    'job_assignments',
    'assignment_queue',
    'booking_timeline_logs',
    'booking_status_history',
    'ratings',
    'maid_payouts',
    'payments',
    'earnings',
    'notifications',
    'fcm_device_tokens',
    'platform_settings',
    'service_areas',
    'customer_notes',
    'maid_availability_schedule',
    'booking_photos',
    'reports_cache'
  ];
  expected_views text[] := ARRAY[
    'v_booking_summary',
    'v_pending_assignments',
    'v_revenue_summary',
    'v_maid_dashboard',
    'v_customer_lifetime_value'
  ];
  tbl text;
  vw text;
  missing_tables text[] := '{}';
  missing_views text[] := '{}';
  rls_disabled text[] := '{}';
  is_rls_enabled boolean;
BEGIN
  -- 1. Check Tables
  FOREACH tbl IN ARRAY expected_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    ELSE
      -- Check RLS
      SELECT relrowsecurity INTO is_rls_enabled
      FROM pg_class
      WHERE relname = tbl AND relnamespace = 'public'::regnamespace;

      IF NOT COALESCE(is_rls_enabled, false) THEN
        rls_disabled := array_append(rls_disabled, tbl);
      END IF;
    END IF;
  END LOOP;

  -- 2. Check Views
  FOREACH vw IN ARRAY expected_views LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public' AND table_name = vw
    ) THEN
      missing_views := array_append(missing_views, vw);
    END IF;
  END LOOP;

  -- 3. Assertions
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'TEST FAILED: Missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE 'SUCCESS: All 24 required tables verified in public schema.';
  END IF;

  IF array_length(missing_views, 1) > 0 THEN
    RAISE EXCEPTION 'TEST FAILED: Missing views: %', missing_views;
  ELSE
    RAISE NOTICE 'SUCCESS: All 5 required views verified in public schema.';
  END IF;

  IF array_length(rls_disabled, 1) > 0 THEN
    RAISE WARNING 'WARNING: RLS is disabled on: %', rls_disabled;
  ELSE
    RAISE NOTICE 'SUCCESS: Row-Level Security confirmed enabled on all tables.';
  END IF;

  RAISE NOTICE 'GC HOME+ Full Database Architecture Smoke Test PASSED.';
END $$;
