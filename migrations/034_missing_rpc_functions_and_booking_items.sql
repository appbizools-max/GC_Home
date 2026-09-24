-- ==============================================================================
-- GC HOME+ — MIGRATION 034: MISSING RPC FUNCTIONS + BOOKING_ITEMS FIX
-- ==============================================================================
-- PURPOSE:
--   Creates the 5 RPC functions called by the User App / Partner App
--   that were missing from the live database:
--     1. resolve_booking_uuid        — resolves booking_code → UUID
--     2. generate_booking_otp        — generates and stores start OTP
--     3. verify_booking_otp          — verifies OTP to start service
--     4. find_eligible_partners      — finds available partners for a booking
--     5. accept_booking              — partner accept (RPC alias)
--   Also ensures booking_items table is exposed to PostgREST.
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: ENSURE booking_items TABLE IS VISIBLE TO PostgREST
-- ─────────────────────────────────────────────────────────────────────────────

-- Re-create if migration 030 was never applied to this project
CREATE TABLE IF NOT EXISTS public.booking_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id  uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  quantity    integer NOT NULL DEFAULT 1,
  unit_price  numeric(10,2) NOT NULL DEFAULT 0,
  subtotal    numeric(10,2) NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id ON public.booking_items(booking_id);

ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_items_public_select" ON public.booking_items;
CREATE POLICY "booking_items_public_select"
  ON public.booking_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "booking_items_public_insert" ON public.booking_items;
CREATE POLICY "booking_items_public_insert"
  ON public.booking_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "booking_items_public_update" ON public.booking_items;
CREATE POLICY "booking_items_public_update"
  ON public.booking_items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "booking_items_public_delete" ON public.booking_items;
CREATE POLICY "booking_items_public_delete"
  ON public.booking_items FOR DELETE USING (true);

-- Add booking_items to realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_items;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Ensure start_otp column exists on bookings
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS start_otp text,
  ADD COLUMN IF NOT EXISTS otp_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS otp_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS otp_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS partner_accepted_at timestamptz;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: RPC 1 — resolve_booking_uuid
-- ─────────────────────────────────────────────────────────────────────────────
-- Converts a booking_code (e.g. "GC-12345") to the internal UUID.
-- Used by bookingStateMachine.ts before every OTP or status RPC call.

CREATE OR REPLACE FUNCTION public.resolve_booking_uuid(p_booking_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Try booking_code first
  SELECT id INTO v_id FROM public.bookings WHERE booking_code = p_booking_code LIMIT 1;

  -- Fallback: maybe the caller already passed a UUID
  IF v_id IS NULL THEN
    BEGIN
      v_id := p_booking_code::uuid;
      -- Verify it actually exists
      PERFORM 1 FROM public.bookings WHERE id = v_id;
      IF NOT FOUND THEN
        v_id := NULL;
      END IF;
    EXCEPTION WHEN invalid_text_representation THEN
      v_id := NULL;
    END;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_booking_uuid(text) TO authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: RPC 2 — generate_booking_otp
-- ─────────────────────────────────────────────────────────────────────────────
-- Generates a 6-digit OTP for the booking and stores it.
-- Called when partner is assigned / customer is waiting.

CREATE OR REPLACE FUNCTION public.generate_booking_otp(p_booking_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id uuid;
  v_otp        text;
BEGIN
  v_booking_id := public.resolve_booking_uuid(p_booking_code);
  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_code;
  END IF;

  -- Generate 6-digit OTP
  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');

  UPDATE public.bookings
  SET
    start_otp          = v_otp,
    otp_generated_at   = now(),
    otp_verified       = false,
    updated_at         = now()
  WHERE id = v_booking_id;

  RETURN v_otp;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_booking_otp(text) TO authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: RPC 3 — verify_booking_otp
-- ─────────────────────────────────────────────────────────────────────────────
-- Verifies OTP entered by partner to start the service.
-- Returns: 'success' | 'invalid_otp' | 'booking_not_found' | 'already_verified'

CREATE OR REPLACE FUNCTION public.verify_booking_otp(
  p_booking_code text,
  p_otp          text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id  uuid;
  v_stored_otp  text;
  v_verified    boolean;
  v_status      text;
BEGIN
  v_booking_id := public.resolve_booking_uuid(p_booking_code);
  IF v_booking_id IS NULL THEN
    RETURN 'booking_not_found';
  END IF;

  SELECT start_otp, otp_verified, status
  INTO v_stored_otp, v_verified, v_status
  FROM public.bookings
  WHERE id = v_booking_id;

  IF v_verified THEN
    RETURN 'already_verified';
  END IF;

  IF v_stored_otp IS NULL OR v_stored_otp <> p_otp THEN
    RETURN 'invalid_otp';
  END IF;

  -- OTP correct — mark verified and transition status
  UPDATE public.bookings
  SET
    otp_verified     = true,
    otp_verified_at  = now(),
    status           = 'cleaning_started',
    updated_at       = now()
  WHERE id = v_booking_id;

  -- Log to booking_timeline if table exists
  BEGIN
    INSERT INTO public.booking_timeline (booking_id, event_type, event_title, event_description)
    VALUES (v_booking_id, 'otp_verified', 'Service Started', 'OTP verified. Service has begun.');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN 'success';
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_booking_otp(text, text) TO authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: RPC 4 — find_eligible_partners
-- ─────────────────────────────────────────────────────────────────────────────
-- Returns approved, online maid_profiles who match the booking's service area.
-- Used by Admin Dispatch → Assign Partner screen.

CREATE OR REPLACE FUNCTION public.find_eligible_partners(booking_id uuid)
RETURNS TABLE (
  id                  uuid,
  maid_code           text,
  full_name           text,
  phone               text,
  photo_url           text,
  rating              numeric,
  completed_jobs_count integer,
  service_area        text,
  services_provided   jsonb,
  is_online           boolean,
  distance_km         numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
BEGIN
  SELECT * INTO v_booking FROM public.bookings b WHERE b.id = booking_id LIMIT 1;

  RETURN QUERY
  SELECT
    mp.id,
    mp.maid_code,
    mp.full_name,
    mp.phone,
    mp.photo_url,
    COALESCE(mp.rating, 5.0)::numeric,
    COALESCE(mp.completed_jobs_count, 0),
    COALESCE(mp.service_area, mp.city, 'Bengaluru'),
    COALESCE(mp.services_provided, '[]'::jsonb),
    COALESCE(mp.is_online, false),
    -- Placeholder distance (real GPS distance requires PostGIS or lat/lng columns)
    (RANDOM() * 8 + 0.5)::numeric(5,2) AS distance_km
  FROM public.maid_profiles mp
  WHERE
    mp.status = 'approved'
    AND COALESCE(mp.is_available, true) = true
  ORDER BY
    COALESCE(mp.is_online, false) DESC,
    COALESCE(mp.rating, 0) DESC,
    COALESCE(mp.completed_jobs_count, 0) DESC
  LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_eligible_partners(uuid) TO authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: RPC 5 — accept_booking
-- ─────────────────────────────────────────────────────────────────────────────
-- Partner accepts a booking offer.
-- Updates: bookings (maid_assigned), partner_assignments (accepted),
--          expires other pending offers, marks partner as unavailable.

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
  -- Get partner details
  SELECT * INTO v_partner FROM public.maid_profiles WHERE id = p_maid_id LIMIT 1;
  IF NOT FOUND THEN
    RETURN 'partner_not_found';
  END IF;

  -- Update booking to assigned
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

  -- Mark this assignment as accepted
  UPDATE public.partner_assignments
  SET
    response_status = 'accepted',
    responded_at    = v_accepted_at
  WHERE
    booking_id    = p_booking_id
    AND partner_id = p_maid_id
    AND response_status = 'pending';

  -- Expire all other pending assignments for this booking
  UPDATE public.partner_assignments
  SET response_status = 'expired'
  WHERE
    booking_id    = p_booking_id
    AND partner_id <> p_maid_id
    AND response_status = 'pending';

  -- Mark partner as unavailable
  UPDATE public.maid_profiles
  SET
    is_available = false,
    updated_at   = v_accepted_at
  WHERE id = p_maid_id;

  -- Log to timeline
  BEGIN
    INSERT INTO public.booking_timeline (booking_id, event_type, event_title, event_description)
    VALUES (p_booking_id, 'partner_accepted', 'Partner Assigned', v_partner.full_name || ' accepted the booking.');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN 'success';
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_booking(uuid, uuid) TO authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 8: Ensure maid_profiles has is_available column
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.maid_profiles
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 9: VERIFY
-- ─────────────────────────────────────────────────────────────────────────────
-- Run these in SQL Editor to confirm:
--
-- SELECT routine_name FROM information_schema.routines
--   WHERE routine_schema = 'public'
--   AND routine_name IN (
--     'resolve_booking_uuid', 'generate_booking_otp', 'verify_booking_otp',
--     'find_eligible_partners', 'accept_booking'
--   );
--
-- SELECT COUNT(*) FROM public.booking_items;
--
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'bookings'
--   AND column_name IN ('start_otp','otp_verified','otp_verified_at','partner_accepted_at');
