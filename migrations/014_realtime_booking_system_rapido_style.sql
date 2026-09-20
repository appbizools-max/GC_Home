-- ==============================================================================
-- GC HOME+ — MIGRATION 014: REAL-TIME BOOKING SYSTEM (RAPIDO-STYLE)
-- ==============================================================================
-- This migration implements a comprehensive real-time service assignment system
-- with distance-based partner matching, OTP verification, payment validation,
-- and complete booking lifecycle management similar to Rapido's model.
--
-- Key Features:
-- 1. Enhanced booking state machine with granular states
-- 2. Distance-based partner matching (1km → 10km progressive radius)
-- 3. Secure OTP generation and verification with rate limiting
-- 4. Payment validation before partner assignment
-- 5. Atomic partner acceptance preventing double-assignment
-- 6. Real-time location tracking and arrival detection
-- 7. Service completion workflow with customer confirmation
-- 8. Payment settlement with tip support
-- 9. Comprehensive audit trail and timeline
-- 10. Unauthorized payment reporting system
-- 11. Cancellation and refund workflow
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: ENHANCE BOOKING STATUS ENUM
-- ==============================================================================

-- Add new granular states to existing booking_status enum
DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_pending';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_verified';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'searching_partner';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'partner_offered';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'partner_accepted';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'partner_en_route';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'partner_arrived';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'otp_verified';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'service_in_progress';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completion_submitted';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'customer_confirmed';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_settled';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'disputed';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'refund_pending';
  ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'refunded';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payment status enum enhancement
DO $$ BEGIN
  ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'authorized';
  ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'failed';
  ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'refunded';
  ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'partial_refund';
  ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;

-- ==============================================================================
-- SECTION 2: ENHANCE BOOKINGS TABLE
-- ==============================================================================

-- Add location and distance tracking fields (Telangana coordinates only)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_location_lat numeric(10,8);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_location_lng numeric(11,8);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_state text DEFAULT 'Telangana';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_distance_km numeric(5,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_location_lat numeric(10,8);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_location_lng numeric(11,8);

-- Add constraint to ensure bookings are only in Telangana
ALTER TABLE public.bookings ADD CONSTRAINT telangana_service_only 
  CHECK (service_state = 'Telangana' OR service_state IS NULL);

-- Add payment validation fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS advance_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS remaining_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS advance_paid boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tax_amount numeric(10,2) DEFAULT 0;

-- Add partner earnings fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_earnings numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_commission numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tip_amount numeric(10,2) DEFAULT 0;

-- Add OTP and verification fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS verification_otp text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_generated_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_verified_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_attempts integer DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_verified boolean DEFAULT false;

-- Add service completion fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS completion_submitted_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS completion_notes text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS completion_photos text[];
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_confirmed_at timestamptz;

-- Add partner tracking fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_accepted_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_arrived_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS estimated_arrival_time timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_eta_minutes integer;

-- Add offered partners tracking (for audit)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS offered_partners uuid[];
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS offer_radius_km numeric(5,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_search_started_at timestamptz;

-- Add refund fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_amount numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_reason text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_processed_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refund_transaction_id text;

-- ==============================================================================
-- SECTION 3: BOOKING OTP TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.booking_otp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  otp_code text NOT NULL, -- Hashed for security
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  verification_attempts integer NOT NULL DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  verified_by uuid, -- partner_id who verified
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_active_otp_per_booking UNIQUE(booking_id, is_verified)
);

CREATE INDEX IF NOT EXISTS idx_booking_otp_booking ON public.booking_otp(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_otp_active ON public.booking_otp(booking_id, is_verified) WHERE is_verified = false;
CREATE INDEX IF NOT EXISTS idx_booking_otp_expiry ON public.booking_otp(expires_at) WHERE is_verified = false;

-- ==============================================================================
-- SECTION 4: PARTNER ASSIGNMENTS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.partner_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  assignment_type text NOT NULL DEFAULT 'system', -- system, admin, manual
  distance_km numeric(5,2),
  estimated_earnings numeric(10,2),
  offer_sent_at timestamptz NOT NULL DEFAULT now(),
  offer_expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 seconds'),
  response_status text NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  responded_at timestamptz,
  acceptance_lat numeric(10,8),
  acceptance_lng numeric(11,8),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_response_status CHECK (response_status IN ('pending', 'accepted', 'declined', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_partner_assignments_booking ON public.partner_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_assignments_partner ON public.partner_assignments(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_assignments_status ON public.partner_assignments(booking_id, response_status);
CREATE INDEX IF NOT EXISTS idx_partner_assignments_pending ON public.partner_assignments(partner_id, response_status) WHERE response_status = 'pending';

-- ==============================================================================
-- SECTION 5: BOOKING TIMELINE TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.booking_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_title text NOT NULL,
  event_description text,
  event_status text, -- success, error, warning, info
  actor_id uuid, -- user_id or maid_id or admin_id who triggered
  actor_type text, -- customer, partner, admin, system
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_actor_type CHECK (actor_type IN ('customer', 'partner', 'admin', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_booking_timeline_booking ON public.booking_timeline(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_timeline_event ON public.booking_timeline(event_type);

-- ==============================================================================
-- SECTION 6: TIPS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_method text,
  transaction_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT positive_tip_amount CHECK (amount > 0),
  CONSTRAINT valid_tip_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_tips_booking ON public.tips(booking_id);
CREATE INDEX IF NOT EXISTS idx_tips_partner ON public.tips(partner_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_tips_customer ON public.tips(customer_id);

-- ==============================================================================
-- SECTION 7: PAYMENT REPORTS TABLE (UNAUTHORIZED PAYMENT REPORTING)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  reported_partner_id uuid REFERENCES public.maid_profiles(id) ON DELETE SET NULL,
  report_type text NOT NULL, -- asked_for_cash, unauthorized_amount, payment_outside_app, service_issue, other
  description text NOT NULL,
  evidence_urls text[],
  amount_requested numeric(10,2),
  status text NOT NULL DEFAULT 'pending', -- pending, under_review, resolved, invalid, action_taken
  reviewed_by uuid, -- admin_id
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_report_type CHECK (report_type IN ('asked_for_cash', 'unauthorized_amount', 'payment_outside_app', 'service_issue', 'other')),
  CONSTRAINT valid_report_status CHECK (status IN ('pending', 'under_review', 'resolved', 'invalid', 'action_taken'))
);

CREATE INDEX IF NOT EXISTS idx_payment_reports_booking ON public.payment_reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_reports_partner ON public.payment_reports(reported_partner_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_reports_status ON public.payment_reports(status, created_at DESC);

-- ==============================================================================
-- SECTION 8: PARTNER LOCATION TRACKING TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.partner_location_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  accuracy_meters numeric(7,2),
  heading numeric(5,2), -- 0-360 degrees
  speed_mps numeric(5,2), -- meters per second
  is_active_booking boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_location_partner ON public.partner_location_history(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_location_booking ON public.partner_location_history(booking_id, created_at DESC) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partner_location_recent ON public.partner_location_history(partner_id, created_at DESC);

-- ==============================================================================
-- SECTION 9: PARTNER AVAILABILITY TRACKING
-- ==============================================================================

ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS current_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS last_location_lat numeric(10,8);
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS last_location_lng numeric(11,8);
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS last_location_updated_at timestamptz;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS total_distance_traveled_km numeric(10,2) DEFAULT 0;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS acceptance_rate numeric(5,2) DEFAULT 100.0; -- percentage
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS average_response_time_seconds integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_maid_profiles_online ON public.maid_profiles(is_online, is_available) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_maid_profiles_location ON public.maid_profiles(last_location_lat, last_location_lng) WHERE is_online = true;

-- ==============================================================================
-- SECTION 10: HAVERSINE DISTANCE CALCULATION FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
)
RETURNS numeric AS $$
DECLARE
  earth_radius_km numeric := 6371.0;
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
BEGIN
  -- Handle NULL values
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN ROUND((earth_radius_km * c)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================================================
-- SECTION 11: FIND ELIGIBLE PARTNERS FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.find_eligible_partners(
  p_booking_id uuid,
  p_radius_km numeric DEFAULT 1.0,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  partner_id uuid,
  partner_name text,
  partner_phone text,
  partner_rating numeric,
  distance_km numeric,
  estimated_earnings numeric,
  is_available boolean
) AS $$
DECLARE
  v_customer_lat numeric;
  v_customer_lng numeric;
  v_service_price numeric;
  v_partner_share numeric := 0.70; -- 70% goes to partner
BEGIN
  -- Get booking location and price
  SELECT 
    service_location_lat,
    service_location_lng,
    COALESCE(service_price, total_amount, 0)
  INTO v_customer_lat, v_customer_lng, v_service_price
  FROM public.bookings
  WHERE id = p_booking_id;
  
  -- Calculate estimated partner earnings
  v_partner_share := v_service_price * 0.70;
  
  RETURN QUERY
  SELECT 
    mp.id AS partner_id,
    mp.full_name AS partner_name,
    mp.phone AS partner_phone,
    COALESCE(mp.rating, 0) AS partner_rating,
    public.calculate_distance_km(
      v_customer_lat,
      v_customer_lng,
      mp.last_location_lat,
      mp.last_location_lng
    ) AS distance_km,
    v_partner_share AS estimated_earnings,
    mp.is_available
  FROM public.maid_profiles mp
  WHERE 
    mp.status = 'approved'
    AND mp.is_online = true
    AND mp.is_available = true
    AND mp.current_booking_id IS NULL
    AND mp.last_location_lat IS NOT NULL
    AND mp.last_location_lng IS NOT NULL
    AND public.calculate_distance_km(
      v_customer_lat,
      v_customer_lng,
      mp.last_location_lat,
      mp.last_location_lng
    ) <= p_radius_km
  ORDER BY distance_km ASC, mp.rating DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SECTION 12: GENERATE BOOKING OTP FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.generate_booking_otp(p_booking_id uuid)
RETURNS text AS $$
DECLARE
  v_otp text;
  v_otp_hashed text;
BEGIN
  -- Generate 6-digit OTP
  v_otp := LPAD(FLOOR(random() * 1000000)::text, 6, '0');
  
  -- Hash OTP for storage (using pgcrypto extension)
  v_otp_hashed := encode(digest(v_otp, 'sha256'), 'hex');
  
  -- Invalidate any existing active OTPs for this booking
  UPDATE public.booking_otp
  SET is_verified = true, updated_at = now()
  WHERE booking_id = p_booking_id AND is_verified = false;
  
  -- Insert new OTP
  INSERT INTO public.booking_otp (
    booking_id,
    otp_code,
    generated_at,
    expires_at
  ) VALUES (
    p_booking_id,
    v_otp_hashed,
    now(),
    now() + interval '15 minutes'
  );
  
  -- Update bookings table
  UPDATE public.bookings
  SET 
    verification_otp = v_otp, -- Store plain OTP temporarily for display to customer
    otp_generated_at = now(),
    otp_expires_at = now() + interval '15 minutes',
    otp_attempts = 0,
    otp_verified = false,
    updated_at = now()
  WHERE id = p_booking_id;
  
  RETURN v_otp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SECTION 13: VERIFY BOOKING OTP FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verify_booking_otp(
  p_booking_id uuid,
  p_otp_code text,
  p_partner_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_otp_hashed text;
  v_stored_otp booking_otp%ROWTYPE;
  v_booking bookings%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Hash the provided OTP
  v_otp_hashed := encode(digest(p_otp_code, 'sha256'), 'hex');
  
  -- Get active OTP
  SELECT * INTO v_stored_otp
  FROM public.booking_otp
  WHERE booking_id = p_booking_id
    AND is_verified = false
  ORDER BY generated_at DESC
  LIMIT 1;
  
  -- Get booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;
  
  -- Validation checks
  IF v_stored_otp.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_active_otp',
      'message', 'No active OTP found for this booking'
    );
  END IF;
  
  IF v_stored_otp.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'otp_expired',
      'message', 'OTP has expired. Please request a new one'
    );
  END IF;
  
  IF v_stored_otp.verification_attempts >= 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'max_attempts_exceeded',
      'message', 'Maximum verification attempts exceeded'
    );
  END IF;
  
  IF v_booking.assigned_maid_id != p_partner_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized_partner',
      'message', 'You are not assigned to this booking'
    );
  END IF;
  
  -- Check OTP match
  IF v_stored_otp.otp_code != v_otp_hashed THEN
    -- Increment attempt counter
    UPDATE public.booking_otp
    SET verification_attempts = verification_attempts + 1,
        updated_at = now()
    WHERE id = v_stored_otp.id;
    
    UPDATE public.bookings
    SET otp_attempts = otp_attempts + 1,
        updated_at = now()
    WHERE id = p_booking_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_otp',
      'message', 'Invalid OTP. Please try again',
      'attempts_remaining', 5 - (v_stored_otp.verification_attempts + 1)
    );
  END IF;
  
  -- OTP is valid - mark as verified
  UPDATE public.booking_otp
  SET 
    is_verified = true,
    verified_at = now(),
    verified_by = p_partner_id,
    updated_at = now()
  WHERE id = v_stored_otp.id;
  
  -- Update booking
  UPDATE public.bookings
  SET 
    status = 'otp_verified',
    otp_verified = true,
    otp_verified_at = now(),
    started_at = now(),
    updated_at = now()
  WHERE id = p_booking_id;
  
  -- Log timeline event
  INSERT INTO public.booking_timeline (
    booking_id,
    event_type,
    event_title,
    event_description,
    event_status,
    actor_id,
    actor_type,
    metadata
  ) VALUES (
    p_booking_id,
    'otp_verified',
    'OTP Verified Successfully',
    'Service verification completed. Service can now begin.',
    'success',
    p_partner_id,
    'partner',
    jsonb_build_object('otp_attempts', v_stored_otp.verification_attempts + 1)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'OTP verified successfully. Service can now begin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SECTION 14: VALIDATE PAYMENT BEFORE ASSIGNMENT FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.validate_payment_before_assignment(p_booking_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;
  
  IF v_booking.id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'booking_not_found',
      'message', 'Booking not found'
    );
  END IF;
  
  -- Check payment method
  IF v_booking.payment_method = 'cash' THEN
    -- For cash bookings, advance must be paid
    IF v_booking.advance_paid = false OR v_booking.advance_amount <= 0 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'advance_payment_required',
        'message', 'Advance payment required for cash bookings',
        'advance_amount', v_booking.advance_amount
      );
    END IF;
  ELSE
    -- For online payments, must be paid or authorized
    IF v_booking.payment_status NOT IN ('paid', 'authorized') THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'payment_not_completed',
        'message', 'Payment must be completed before assignment',
        'payment_status', v_booking.payment_status
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Payment validation successful'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SECTION 15: CALCULATE PARTNER EARNINGS FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.calculate_partner_earnings(p_booking_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_partner_share numeric := 0.70; -- 70%
  v_platform_share numeric := 0.30; -- 30%
  v_partner_earnings numeric;
  v_platform_commission numeric;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;
  
  -- Calculate earnings
  v_partner_earnings := (COALESCE(v_booking.service_price, v_booking.total_amount, 0) * v_partner_share);
  v_platform_commission := (COALESCE(v_booking.service_price, v_booking.total_amount, 0) * v_platform_share);
  
  -- Update booking with calculated values
  UPDATE public.bookings
  SET 
    partner_earnings = v_partner_earnings,
    platform_commission = v_platform_commission,
    updated_at = now()
  WHERE id = p_booking_id;
  
  RETURN jsonb_build_object(
    'booking_id', p_booking_id,
    'service_price', COALESCE(v_booking.service_price, v_booking.total_amount, 0),
    'partner_earnings', v_partner_earnings,
    'platform_commission', v_platform_commission,
    'partner_share_percent', v_partner_share * 100,
    'platform_share_percent', v_platform_share * 100
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SECTION 16: ATOMIC PARTNER ACCEPTANCE FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.accept_booking(
  p_booking_id uuid,
  p_partner_id uuid,
  p_acceptance_lat numeric,
  p_acceptance_lng numeric
)
RETURNS jsonb AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_partner maid_profiles%ROWTYPE;
  v_distance numeric;
  v_payment_valid jsonb;
  v_assignment_id uuid;
BEGIN
  -- Start transaction with row lock
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;
  
  -- Get partner details
  SELECT * INTO v_partner
  FROM public.maid_profiles
  WHERE id = p_partner_id
  FOR UPDATE;
  
  -- Validation checks
  IF v_booking.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'booking_not_found',
      'message', 'Booking not found'
    );
  END IF;
  
  IF v_booking.assigned_maid_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_assigned',
      'message', 'This booking has already been assigned to another partner'
    );
  END IF;
  
  IF v_booking.status::text NOT IN ('searching_partner', 'partner_offered') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'Booking is not available for assignment',
      'current_status', v_booking.status
    );
  END IF;
  
  IF v_partner.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'partner_not_found',
      'message', 'Partner not found'
    );
  END IF;
  
  IF v_partner.status != 'approved' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'partner_not_approved',
      'message', 'Partner is not approved'
    );
  END IF;
  
  IF v_partner.is_online = false OR v_partner.is_available = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'partner_not_available',
      'message', 'Partner is not available'
    );
  END IF;
  
  IF v_partner.current_booking_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'partner_busy',
      'message', 'Partner is already assigned to another booking'
    );
  END IF;
  
  -- Validate payment
  v_payment_valid := public.validate_payment_before_assignment(p_booking_id);
  IF (v_payment_valid->>'valid')::boolean = false THEN
    RETURN v_payment_valid;
  END IF;
  
  -- Calculate distance
  v_distance := public.calculate_distance_km(
    v_booking.service_location_lat,
    v_booking.service_location_lng,
    p_acceptance_lat,
    p_acceptance_lng
  );
  
  -- Update partner assignment record
  UPDATE public.partner_assignments
  SET 
    response_status = 'accepted',
    responded_at = now(),
    acceptance_lat = p_acceptance_lat,
    acceptance_lng = p_acceptance_lng
  WHERE booking_id = p_booking_id
    AND partner_id = p_partner_id
    AND response_status = 'pending'
  RETURNING id INTO v_assignment_id;
  
  -- Calculate earnings
  PERFORM public.calculate_partner_earnings(p_booking_id);
  
  -- Update booking
  UPDATE public.bookings
  SET 
    status = 'partner_accepted',
    assigned_maid_id = p_partner_id,
    assigned_maid_name = v_partner.full_name,
    assigned_maid_phone = v_partner.phone,
    assigned_maid_photo_url = v_partner.photo_url,
    assigned_maid_rating = v_partner.rating,
    partner_accepted_at = now(),
    partner_distance_km = v_distance,
    partner_location_lat = p_acceptance_lat,
    partner_location_lng = p_acceptance_lng,
    updated_at = now()
  WHERE id = p_booking_id;
  
  -- Update partner
  UPDATE public.maid_profiles
  SET 
    current_booking_id = p_booking_id,
    is_available = false,
    updated_at = now()
  WHERE id = p_partner_id;
  
  -- Expire other pending offers
  UPDATE public.partner_assignments
  SET response_status = 'expired'
  WHERE booking_id = p_booking_id
    AND partner_id != p_partner_id
    AND response_status = 'pending';
  
  -- Log timeline
  INSERT INTO public.booking_timeline (
    booking_id,
    event_type,
    event_title,
    event_description,
    event_status,
    actor_id,
    actor_type,
    metadata
  ) VALUES (
    p_booking_id,
    'partner_accepted',
    'Partner Accepted Booking',
    format('Partner %s accepted the booking', v_partner.full_name),
    'success',
    p_partner_id,
    'partner',
    jsonb_build_object(
      'partner_name', v_partner.full_name,
      'distance_km', v_distance,
      'acceptance_location', jsonb_build_object('lat', p_acceptance_lat, 'lng', p_acceptance_lng)
    )
  );
  
  -- Generate OTP for service start
  PERFORM public.generate_booking_otp(p_booking_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Booking accepted successfully',
    'booking_id', p_booking_id,
    'partner_id', p_partner_id,
    'distance_km', v_distance,
    'estimated_earnings', (SELECT partner_earnings FROM public.bookings WHERE id = p_booking_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SECTION 17: BOOKING STATE TRANSITION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.log_booking_state_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_timeline (
      booking_id,
      event_type,
      event_title,
      event_description,
      event_status,
      actor_type,
      metadata
    ) VALUES (
      NEW.id,
      'status_change',
      format('Status Changed: %s → %s', OLD.status, NEW.status),
      format('Booking status changed from %s to %s', OLD.status, NEW.status),
      'info',
      'system',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_booking_state_change ON public.bookings;
CREATE TRIGGER trigger_log_booking_state_change
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_state_change();

-- ==============================================================================
-- SECTION 18: ENABLE REALTIME FOR NEW TABLES
-- ==============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_otp;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_location_history;

-- ==============================================================================
-- SECTION 19: RLS POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.booking_otp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_location_history ENABLE ROW LEVEL SECURITY;

-- Booking OTP policies (highly restricted)
CREATE POLICY "Customers can view own booking OTP" ON public.booking_otp
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_otp.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

CREATE POLICY "Partners can verify OTP for assigned bookings" ON public.booking_otp
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_otp.booking_id
      AND bookings.assigned_maid_id IN (
        SELECT id FROM public.maid_profiles WHERE id = auth.uid() OR user_id = auth.uid()
      )
    )
  );

-- Partner assignments policies
CREATE POLICY "Partners can view own assignments" ON public.partner_assignments
  FOR SELECT USING (
    partner_id IN (SELECT id FROM public.maid_profiles WHERE id = auth.uid() OR user_id = auth.uid())
  );

CREATE POLICY "Customers can view assignments for own bookings" ON public.partner_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = partner_assignments.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Booking timeline policies
CREATE POLICY "Users can view timeline for own bookings" ON public.booking_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_timeline.booking_id
      AND (bookings.customer_id = auth.uid() OR
           bookings.assigned_maid_id IN (SELECT id FROM public.maid_profiles WHERE id = auth.uid() OR user_id = auth.uid()))
    )
  );

-- Tips policies
CREATE POLICY "Customers can view and create own tips" ON public.tips
  FOR ALL USING (customer_id = auth.uid());

CREATE POLICY "Partners can view received tips" ON public.tips
  FOR SELECT USING (
    partner_id IN (SELECT id FROM public.maid_profiles WHERE id = auth.uid() OR user_id = auth.uid())
  );

-- Payment reports policies
CREATE POLICY "Customers can create and view own reports" ON public.payment_reports
  FOR ALL USING (reporter_id = auth.uid());

-- Partner location policies
CREATE POLICY "Partners can manage own location" ON public.partner_location_history
  FOR ALL USING (
    partner_id IN (SELECT id FROM public.maid_profiles WHERE id = auth.uid() OR user_id = auth.uid())
  );

CREATE POLICY "Customers can view partner location for active bookings" ON public.partner_location_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = partner_location_history.booking_id
      AND bookings.customer_id = auth.uid()
      AND bookings.status::text IN ('partner_accepted', 'partner_en_route', 'partner_arrived', 'otp_verified', 'service_in_progress')
    )
  );

-- ==============================================================================
-- SECTION 20: INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_location ON public.bookings(service_location_lat, service_location_lng) WHERE service_location_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON public.bookings(status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_partner_status ON public.bookings(assigned_maid_id, status) WHERE assigned_maid_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status, payment_method);
CREATE INDEX IF NOT EXISTS idx_bookings_otp_verification ON public.bookings(id, otp_verified) WHERE otp_verified = false;

-- ==============================================================================
-- SECTION 21: COMMENTS FOR DOCUMENTATION
-- ==============================================================================

COMMENT ON TABLE public.booking_otp IS 'Stores secure OTP codes for booking verification with rate limiting';
COMMENT ON TABLE public.partner_assignments IS 'Tracks all partner offers and responses for bookings';
COMMENT ON TABLE public.booking_timeline IS 'Complete audit trail of all booking lifecycle events';
COMMENT ON TABLE public.tips IS 'Customer tips processed through the platform';
COMMENT ON TABLE public.payment_reports IS 'Reports of unauthorized payment requests by partners';
COMMENT ON TABLE public.partner_location_history IS 'Real-time location tracking for partners during active bookings';

COMMENT ON FUNCTION public.calculate_distance_km IS 'Haversine formula for calculating distance between two coordinates';
COMMENT ON FUNCTION public.find_eligible_partners IS 'Finds available partners within specified radius sorted by distance and rating';
COMMENT ON FUNCTION public.generate_booking_otp IS 'Generates secure 6-digit OTP with 15-minute expiry';
COMMENT ON FUNCTION public.verify_booking_otp IS 'Verifies OTP with rate limiting and security checks';
COMMENT ON FUNCTION public.validate_payment_before_assignment IS 'Ensures payment is completed before allowing partner assignment';
COMMENT ON FUNCTION public.calculate_partner_earnings IS 'Calculates 70/30 split between partner and platform';
COMMENT ON FUNCTION public.accept_booking IS 'Atomic booking acceptance preventing double-assignment with comprehensive validation';

-- ==============================================================================
-- END OF MIGRATION 014
-- ==============================================================================
