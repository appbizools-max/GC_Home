-- ==============================================================================
-- GC HOME+ — MIGRATION 021: PURGE MOCK RUNTIME DATA & ENABLE CLEAN TESTING
-- ==============================================================================
-- Removes all mock/seeded/demo runtime records while strictly preserving
-- the entire service catalog (18 categories, 90 services, 57 addons, banners, offers).
-- Safe & idempotent: wraps each table delete in an exception handler so non-existent
-- tables do not block the purge transaction.
-- Run this in the Supabase SQL Editor to wipe demo data before manual testing.
-- ==============================================================================

BEGIN;

-- Helper macro to safely truncate or delete from table if it exists
DO $$
DECLARE
  tbl text;
  tables_to_purge text[] := ARRAY[
    'ratings',
    'chat_messages',
    'booking_timeline_logs',
    'booking_status_history',
    'booking_otp',
    'job_assignments',
    'assignment_queue',
    'partner_assignments',
    'partner_location_history',
    'tips',
    'payment_reports',
    'sos_alerts',
    'notifications',
    'payments',
    'maid_history',
    'maid_kyc_documents',
    'maid_availability_schedule',
    'maid_payouts',
    'customer_notes',
    'saved_addresses',
    'bookings',
    'maid_profiles',
    'user_profiles'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_purge LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DELETE FROM public.%I', tbl);
      RAISE NOTICE 'Purged table public.%', tbl;
    END IF;
  END LOOP;
END $$;

-- Enable clean CRUD RLS policies for manual testing
-- Allows User App and Admin Panel to register customers, register maids, and create bookings smoothly
DO $$
DECLARE
  tbl text;
  policy_tables text[] := ARRAY[
    'user_profiles',
    'saved_addresses',
    'bookings',
    'maid_profiles',
    'notifications',
    'ratings',
    'chat_messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY policy_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_all_testing', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl || '_all_testing', tbl);
      RAISE NOTICE 'Enabled testing RLS policy for public.%', tbl;
    END IF;
  END LOOP;
END $$;

COMMIT;
