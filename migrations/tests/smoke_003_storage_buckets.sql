-- ============================================================
-- FILE: migrations/tests/smoke_003_storage_buckets.sql
-- Purpose: Smoke test for 003_storage_buckets.sql
-- Validates: Requirements 11.1, 11.5, 11.8
--
-- Run this AFTER executing 003_storage_buckets.sql to confirm
-- all 3 storage buckets were created with correct visibility.
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: Show all 3 expected buckets
-- ------------------------------------------------------------
SELECT name, public
FROM storage.buckets
WHERE name IN ('maid-documents', 'profile-photos', 'job-photos')
ORDER BY name;

-- ------------------------------------------------------------
-- STEP 2: Assert total count equals 3
-- ------------------------------------------------------------
DO $$
DECLARE
  bucket_count integer;
BEGIN
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE name IN ('maid-documents', 'profile-photos', 'job-photos');

  IF bucket_count = 3 THEN
    RAISE NOTICE 'PASS: All 3 storage buckets exist (maid-documents, profile-photos, job-photos)';
  ELSE
    RAISE EXCEPTION 'FAIL: Expected 3 buckets, found %', bucket_count;
  END IF;
END $$;

-- ------------------------------------------------------------
-- STEP 3: Assert maid-documents is PRIVATE (public = false)
-- Requirement 11.1 — KYC documents must be stored privately
-- ------------------------------------------------------------
DO $$
DECLARE
  is_public boolean;
BEGIN
  SELECT public INTO is_public
  FROM storage.buckets
  WHERE name = 'maid-documents';

  IF is_public IS NULL THEN
    RAISE EXCEPTION 'FAIL: Bucket maid-documents does not exist';
  ELSIF is_public = false THEN
    RAISE NOTICE 'PASS: maid-documents is private (public = false)';
  ELSE
    RAISE EXCEPTION 'FAIL: maid-documents should be private but public = %', is_public;
  END IF;
END $$;

-- ------------------------------------------------------------
-- STEP 4: Assert profile-photos is PUBLIC (public = true)
-- Requirement 11.5 — Profile photos must be publicly accessible
-- ------------------------------------------------------------
DO $$
DECLARE
  is_public boolean;
BEGIN
  SELECT public INTO is_public
  FROM storage.buckets
  WHERE name = 'profile-photos';

  IF is_public IS NULL THEN
    RAISE EXCEPTION 'FAIL: Bucket profile-photos does not exist';
  ELSIF is_public = true THEN
    RAISE NOTICE 'PASS: profile-photos is public (public = true)';
  ELSE
    RAISE EXCEPTION 'FAIL: profile-photos should be public but public = %', is_public;
  END IF;
END $$;

-- ------------------------------------------------------------
-- STEP 5: Assert job-photos is PRIVATE (public = false)
-- Requirement 11.8 — Job photos must be stored privately
-- ------------------------------------------------------------
DO $$
DECLARE
  is_public boolean;
BEGIN
  SELECT public INTO is_public
  FROM storage.buckets
  WHERE name = 'job-photos';

  IF is_public IS NULL THEN
    RAISE EXCEPTION 'FAIL: Bucket job-photos does not exist';
  ELSIF is_public = false THEN
    RAISE NOTICE 'PASS: job-photos is private (public = false)';
  ELSE
    RAISE EXCEPTION 'FAIL: job-photos should be private but public = %', is_public;
  END IF;
END $$;

-- ------------------------------------------------------------
-- STEP 6: Final summary view — name and visibility for all 3 buckets
-- ------------------------------------------------------------
SELECT name, public
FROM storage.buckets
WHERE name IN ('maid-documents', 'profile-photos', 'job-photos')
ORDER BY name;
