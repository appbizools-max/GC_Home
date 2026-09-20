-- ============================================================
-- FILE: migrations/003_storage_buckets.sql
-- Purpose: Create Supabase Storage buckets and their access policies.
-- Run AFTER 001_phase1_foundation.sql
-- Idempotent: safe to run multiple times without errors.
-- ============================================================

-- -------------------------
-- BUCKET 1: maid-documents (private)
-- For KYC documents: Aadhaar, PAN, Address Proof, Police Certificate, Bank Passbook
-- -------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maid-documents',
  'maid-documents',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -------------------------
-- BUCKET 2: profile-photos (public)
-- For maid selfies, customer avatars, admin avatars
-- -------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -------------------------
-- BUCKET 3: job-photos (private)
-- For before/after job photos uploaded by maids
-- -------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Explicitly ensure visibility is correct for existing buckets
UPDATE storage.buckets SET public = false WHERE name = 'maid-documents';
UPDATE storage.buckets SET public = true WHERE name = 'profile-photos';
UPDATE storage.buckets SET public = false WHERE name = 'job-photos';

-- ============================================================
-- STORAGE OBJECT POLICIES
-- Supabase Storage uses RLS on storage.objects table
-- ============================================================

-- -------------------------
-- maid-documents policies
-- -------------------------

-- Maids can upload their own documents (path must start with their uid)
DROP POLICY IF EXISTS "maid_docs_owner_insert" ON storage.objects;
CREATE POLICY "maid_docs_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'maid-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Maids can view their own documents
DROP POLICY IF EXISTS "maid_docs_owner_select" ON storage.objects;
CREATE POLICY "maid_docs_owner_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'maid-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Maids can update/replace their own documents
DROP POLICY IF EXISTS "maid_docs_owner_update" ON storage.objects;
CREATE POLICY "maid_docs_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'maid-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Maids can delete their own documents
DROP POLICY IF EXISTS "maid_docs_owner_delete" ON storage.objects;
CREATE POLICY "maid_docs_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'maid-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- -------------------------
-- profile-photos policies
-- -------------------------

-- Anyone (including unauthenticated) can view profile photos (public bucket)
DROP POLICY IF EXISTS "profile_photos_public_select" ON storage.objects;
CREATE POLICY "profile_photos_public_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'profile-photos');

-- Authenticated users can upload their own profile photo (path starts with uid)
DROP POLICY IF EXISTS "profile_photos_owner_insert" ON storage.objects;
CREATE POLICY "profile_photos_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update their own profile photo
DROP POLICY IF EXISTS "profile_photos_owner_update" ON storage.objects;
CREATE POLICY "profile_photos_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- -------------------------
-- job-photos policies
-- -------------------------

-- Authenticated maids can upload job photos (path: {booking_id}/{maid_uid}/filename)
DROP POLICY IF EXISTS "job_photos_maid_insert" ON storage.objects;
CREATE POLICY "job_photos_maid_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'job-photos');

-- Authenticated users can view job photos they are associated with
-- (Broad select for authenticated — admin/service_role enforces tighter access via service key)
DROP POLICY IF EXISTS "job_photos_authenticated_select" ON storage.objects;
CREATE POLICY "job_photos_authenticated_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'job-photos');

SELECT 'Storage buckets and policies created successfully.' AS status;
