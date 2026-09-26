-- Migration: 037_add_submitted_at_column.sql
-- Purpose: Add submitted_at column to maid_profiles to cleanly distinguish
-- between draft saves (in-progress registration) and formal final submissions.
-- Partners only enter the Pending Approval queue when submitted_at IS NOT NULL.

ALTER TABLE public.maid_profiles
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.maid_profiles.submitted_at IS
  'Timestamp of final submission by partner. NULL means registration is in-progress/draft. '
  'Only records with submitted_at IS NOT NULL appear in Pending Approval admin tab.';

-- Backfill: all existing pending records that have applied_at set are already submitted
-- (they were registered before this migration, so treat them as formally submitted)
UPDATE public.maid_profiles
SET submitted_at = COALESCE(latest_applied_at, applied_at, created_at)
WHERE submitted_at IS NULL
  AND status::text IN ('pending', 'approved', 'rejected')
  AND applied_at IS NOT NULL;
