-- ==============================================================================
-- GC HOME+ — MIGRATION 032: PURGE NON-CATALOG DATA (PRESERVE SERVICE CATALOG)
-- ==============================================================================
-- Purges all runtime operational records (bookings, user profiles, maid profiles,
-- notifications, payments, payouts, ratings) while strictly preserving 100% of the
-- Service Catalog (categories, services, addons, homepage banners, promo offers).
-- Safe & idempotent script.
-- ==============================================================================

BEGIN;

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
      RAISE NOTICE 'Purged public.%', tbl;
    END IF;
  END LOOP;
END $$;

COMMIT;
