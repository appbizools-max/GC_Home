-- Migration: 036_partner_reapplication_and_history.sql
-- Purpose: Support Partner Re-Application versioning, application history preservation, and backend booking eligibility enforcement.

ALTER TABLE public.maid_profiles
  ADD COLUMN IF NOT EXISTS application_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reapplication_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latest_applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_cities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by TEXT;

COMMENT ON COLUMN public.maid_profiles.application_history IS 'Complete historical log of submitted partner applications and rejection snapshots.';
COMMENT ON COLUMN public.maid_profiles.reapplication_count IS 'Total number of times this partner has re-applied after rejection.';
COMMENT ON COLUMN public.maid_profiles.latest_applied_at IS 'Timestamp of the most recent re-application or application submission.';

-- SECTION 18: Backend Booking Eligibility Enforcement
-- Ensure ONLY Approved + Active partners can accept bookings at the database level.
CREATE OR REPLACE FUNCTION public.accept_booking(
  p_booking_id uuid,
  p_maid_id    uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner record;
  v_accepted_at timestamptz := now();
BEGIN
  -- 1. Verify partner exists
  SELECT * INTO v_partner FROM public.maid_profiles WHERE id = p_maid_id LIMIT 1;
  IF NOT FOUND THEN
    RETURN 'partner_not_found';
  END IF;

  -- 2. Strict Backend Eligibility Check (SECTION 18)
  -- Partners with status 'pending', 'rejected', 'correction_requested', or 'draft' CANNOT accept bookings
  IF v_partner.status != 'approved' THEN
    RETURN 'partner_not_eligible';
  END IF;

  -- 3. Update booking to assigned
  UPDATE public.bookings
  SET
    status                  = 'maid_assigned',
    assignment_status       = 'assigned',
    admin_approval_status   = 'approved',
    assigned_maid_id        = p_maid_id,
    assigned_maid_name      = v_partner.full_name,
    assigned_maid_phone     = v_partner.phone,
    assigned_maid_photo_url = v_partner.photo_url,
    assigned_maid_rating    = COALESCE(v_partner.rating, 5.0),
    partner_accepted_at     = v_accepted_at,
    updated_at              = v_accepted_at
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN 'booking_not_found';
  END IF;

  -- 4. Mark this assignment as accepted
  UPDATE public.partner_assignments
  SET
    response_status = 'accepted',
    responded_at    = v_accepted_at
  WHERE
    booking_id    = p_booking_id
    AND partner_id = p_maid_id
    AND response_status = 'pending';

  -- 5. Expire all other pending assignments for this booking
  UPDATE public.partner_assignments
  SET response_status = 'expired'
  WHERE
    booking_id = p_booking_id
    AND partner_id != p_maid_id
    AND response_status = 'pending';

  RETURN 'success';
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_booking(uuid, uuid) TO authenticated, anon;
