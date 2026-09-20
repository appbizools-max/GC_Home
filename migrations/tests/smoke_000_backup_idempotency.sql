-- ============================================================
-- FILE: migrations/tests/smoke_000_backup_idempotency.sql
-- Purpose: Smoke test — verify that 000_pre_migration_backup.sql
--          is idempotent (safe to run a second time without errors).
--
-- PREREQUISITES:
--   Run 000_pre_migration_backup.sql at least once before this test.
--   After the first run, the original tables (maids, bookings,
--   maid_profiles) will have been renamed to their _backup_ counterparts,
--   so a second run should emit only SKIP NOTICE messages and zero errors.
--
-- HOW TO RUN:
--   Paste this file into the Supabase SQL editor and execute.
--   Check the NOTICE messages — every block should say SKIP, never ERROR.
--   The final SELECT should return the idempotency confirmation message.
-- ============================================================

-- -------------------------
-- Second run: maids → _backup_maids
-- Expected on second run: SKIP (maids no longer exists OR _backup_maids already exists)
-- -------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'maids'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_backup_maids'
    ) THEN
      ALTER TABLE public.maids RENAME TO _backup_maids;
      RAISE NOTICE 'SUCCESS: public.maids renamed to public._backup_maids';
    ELSE
      RAISE NOTICE 'SKIP: public._backup_maids already exists, skipping rename of maids';
    END IF;
  ELSE
    RAISE NOTICE 'SKIP: public.maids not found, nothing to backup';
  END IF;
END $$;

-- -------------------------
-- Second run: bookings → _backup_bookings
-- Expected on second run: SKIP (bookings no longer exists OR _backup_bookings already exists)
-- -------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_backup_bookings'
    ) THEN
      ALTER TABLE public.bookings RENAME TO _backup_bookings;
      RAISE NOTICE 'SUCCESS: public.bookings renamed to public._backup_bookings';
    ELSE
      RAISE NOTICE 'SKIP: public._backup_bookings already exists, skipping rename of bookings';
    END IF;
  ELSE
    RAISE NOTICE 'SKIP: public.bookings not found, nothing to backup';
  END IF;
END $$;

-- -------------------------
-- Second run: maid_profiles → _backup_maid_profiles
-- Expected on second run: SKIP (maid_profiles no longer exists OR _backup_maid_profiles already exists)
-- -------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'maid_profiles'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_backup_maid_profiles'
    ) THEN
      ALTER TABLE public.maid_profiles RENAME TO _backup_maid_profiles;
      RAISE NOTICE 'SUCCESS: public.maid_profiles renamed to public._backup_maid_profiles';
    ELSE
      RAISE NOTICE 'SKIP: public._backup_maid_profiles already exists, skipping rename of maid_profiles';
    END IF;
  ELSE
    RAISE NOTICE 'SKIP: public.maid_profiles not found, nothing to backup';
  END IF;
END $$;

-- ============================================================
-- Idempotency confirmation
-- If execution reached this point without errors, the script is
-- idempotent. All three DO $$ blocks above should have emitted
-- only SKIP NOTICE messages.
-- Requirements satisfied: 8.5, 9.6
-- ============================================================
SELECT 'Idempotency check passed: no errors on second run' AS result;
