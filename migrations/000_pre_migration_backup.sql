-- ============================================================
-- FILE: migrations/000_pre_migration_backup.sql
-- Purpose: Safely rename existing tables before new schema is applied.
-- MUST run BEFORE 001_phase1_foundation.sql
-- Idempotent: safe to run multiple times without errors.
-- ============================================================

-- -------------------------
-- Backup: maids → _backup_maids
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
-- Backup: bookings → _backup_bookings
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
-- Backup: maid_profiles → _backup_maid_profiles (if exists)
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

SELECT 'Backup script complete. Check NOTICE messages above for results.' AS status;
