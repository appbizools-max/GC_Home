-- ==============================================================================
-- GC HOME+ — MIGRATION 007: OPERATIONAL FUNCTIONS, AUTO-DISPATCH & PII SECURITY
-- Aligns with Audit Document Part 2.5 (Functions 6, 7, 8, 10, 12) & Part 5
-- ==============================================================================

-- Ensure dependent columns exist across schemas
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'pending';
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_area_lat numeric(10,7);
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_area_lng numeric(10,7);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS maid_application_status text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_role text DEFAULT 'all';
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;

-- ------------------------------------------------------------------------------
-- 1. PII DATA MASKING UTILITIES (Audit Part 5)
-- Safe presentation of government IDs & financial account numbers
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mask_aadhaar(val text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF val IS NULL OR length(trim(val)) < 4 THEN
    RETURN 'XXXX-XXXX-XXXX';
  END IF;
  -- Return masked format e.g. XXXX-XXXX-1234
  RETURN 'XXXX-XXXX-' || right(regexp_replace(val, '\s+', '', 'g'), 4);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_bank_account(val text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF val IS NULL OR length(trim(val)) < 4 THEN
    RETURN 'XXXXXXXX';
  END IF;
  -- Return masked format e.g. XXXXXXXX1234
  RETURN repeat('X', GREATEST(length(val) - 4, 4)) || right(trim(val), 4);
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. TRIGGER ON MAID REJECTION (Audit Function #10)
-- Triggered when maid_profiles.application_status is set to 'rejected'
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_maid_rejected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if transitioning to rejected
  IF (COALESCE(NEW.status::text, NEW.application_status::text, '') != 'rejected') 
     OR (COALESCE(OLD.status::text, OLD.application_status::text, '') = 'rejected') THEN
    RETURN NEW;
  END IF;

  -- 1. Update user_profiles application status
  UPDATE public.user_profiles
  SET 
    maid_application_status = 'rejected',
    updated_at = now()
  WHERE id = NEW.id;

  -- 2. Insert audit record into maid_history
  INSERT INTO public.maid_history (
    maid_id,
    action,
    actor_id,
    actor_name,
    details,
    created_at
  ) VALUES (
    NEW.id,
    'Application Rejected',
    NEW.rejected_by,
    'Admin',
    COALESCE(NEW.rejection_reason, 'Application rejected after document review.'),
    now()
  );

  -- 3. Insert notification for the applicant
  INSERT INTO public.notifications (
    recipient_id,
    recipient_role,
    title,
    message,
    category,
    is_read,
    created_at
  ) VALUES (
    NEW.id,
    'maid',
    'Application Update',
    'Your maid partner application was not approved. Reason: ' || COALESCE(NEW.rejection_reason, 'Document criteria not met.'),
    'maid',
    false,
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_maid_rejected ON public.maid_profiles;
CREATE TRIGGER trg_on_maid_rejected
  AFTER UPDATE ON public.maid_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_maid_rejected();

-- ------------------------------------------------------------------------------
-- 3. BUILD ASSIGNMENT QUEUE & DISPATCH (Audit Function #6)
-- Calculates distance, populates assignment_queue, and sends initial job_assignment
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.build_assignment_queue(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_timeout_mins integer := 10;
  v_platform_fee_pct numeric := 20.00;
  v_payout_amount numeric;
  v_platform_fee numeric;
  v_candidate record;
  v_position integer := 0;
  v_first_assignment_id uuid := NULL;
BEGIN
  -- 1. Fetch booking details
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking % not found', p_booking_id;
  END IF;

  -- 2. Fetch timeout setting from platform_settings if present
  BEGIN
    SELECT value::integer INTO v_timeout_mins 
    FROM public.platform_settings 
    WHERE key = 'assignment_timeout_mins';
  EXCEPTION WHEN OTHERS THEN
    v_timeout_mins := 10;
  END;

  -- Calculate financial cuts
  v_platform_fee := round((v_booking.total_amount * (v_platform_fee_pct / 100.0)), 2);
  v_payout_amount := v_booking.total_amount - v_platform_fee;

  -- 3. Clear any existing pending queue entries for this booking
  DELETE FROM public.assignment_queue WHERE booking_id = p_booking_id;

  -- 4. Find candidate maids ranked by distance (Haversine formula approximation or Euclidean)
  FOR v_candidate IN
    SELECT 
      m.id AS maid_id,
      m.full_name,
      m.phone,
      round((
        6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(COALESCE(v_booking.address_lat, 17.4401))) *
            cos(radians(COALESCE(m.service_area_lat, 17.4401))) *
            cos(radians(COALESCE(m.service_area_lng, 78.3489)) - radians(COALESCE(v_booking.address_lng, 78.3489))) +
            sin(radians(COALESCE(v_booking.address_lat, 17.4401))) *
            sin(radians(COALESCE(m.service_area_lat, 17.4401)))
          ))
        )
      )::numeric, 2) AS distance_km
    FROM public.maid_profiles m
    WHERE (COALESCE(m.status::text, m.application_status::text, '') = 'approved')
      AND m.is_online = true
      AND (m.current_status IS NULL OR m.current_status::text IN ('online', 'available'))
    ORDER BY distance_km ASC, m.rating DESC
    LIMIT 10
  LOOP
    v_position := v_position + 1;

    INSERT INTO public.assignment_queue (
      booking_id,
      maid_id,
      queue_position,
      status,
      distance_km,
      created_at
    ) VALUES (
      p_booking_id,
      v_candidate.maid_id,
      v_position,
      CASE WHEN v_position = 1 THEN 'sent' ELSE 'pending' END,
      v_candidate.distance_km,
      now()
    );

    -- Dispatch job assignment to candidate #1
    IF v_position = 1 THEN
      INSERT INTO public.job_assignments (
        booking_id,
        maid_id,
        status,
        attempt_number,
        payout_amount,
        platform_fee,
        distance_km,
        eta_mins,
        sent_at,
        expires_at,
        assigned_by
      ) VALUES (
        p_booking_id,
        v_candidate.maid_id,
        'sent',
        1,
        v_payout_amount,
        v_platform_fee,
        v_candidate.distance_km,
        GREATEST(5, round(v_candidate.distance_km * 3)::integer),
        now(),
        now() + (v_timeout_mins || ' minutes')::interval,
        'auto'
      ) RETURNING id INTO v_first_assignment_id;

      -- Update booking status to pending_assignment
      UPDATE public.bookings 
      SET 
        status = 'pending_assignment',
        updated_at = now()
      WHERE id = p_booking_id;

      -- Add timeline log
      INSERT INTO public.booking_timeline_logs (
        booking_id,
        status_to,
        title,
        details,
        actor_type,
        actor_name,
        created_at
      ) VALUES (
        p_booking_id,
        'pending_assignment',
        'Auto-Dispatch Initiated',
        'Job request dispatched to ' || v_candidate.full_name || ' (' || v_candidate.distance_km || ' km away). Response timeout: ' || v_timeout_mins || 'm.',
        'system',
        'Auto-Dispatch Engine',
        now()
      );

      -- Send notification to candidate maid
      INSERT INTO public.notifications (
        recipient_id,
        recipient_role,
        title,
        message,
        category,
        related_booking_id,
        is_read,
        created_at
      ) VALUES (
        v_candidate.maid_id,
        'maid',
        'New Job Request Available!',
        'New cleaning booking near you (' || v_candidate.distance_km || ' km). Payout: ₹' || v_payout_amount || '. Accept within ' || v_timeout_mins || ' mins.',
        'dispatch',
        p_booking_id,
        false,
        now()
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'booking_id', p_booking_id,
    'candidates_queued', v_position,
    'first_assignment_id', v_first_assignment_id,
    'status', CASE WHEN v_position > 0 THEN 'dispatched' ELSE 'no_available_maids' END
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. EXPIRE TIMED-OUT JOB ASSIGNMENTS (Audit Function #7)
-- Marks overdue assignments as expired and advances to candidate #2 in the queue
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_job_assignments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_rec record;
  v_next_candidate record;
  v_count integer := 0;
  v_timeout_mins integer := 10;
  v_booking record;
BEGIN
  -- 1. Find sent assignments that exceeded expires_at
  FOR v_expired_rec IN
    SELECT ja.id AS assignment_id, ja.booking_id, ja.maid_id, ja.attempt_number, ja.payout_amount, ja.platform_fee
    FROM public.job_assignments ja
    WHERE ja.status = 'sent' AND ja.expires_at < now()
  LOOP
    -- Mark current as expired
    UPDATE public.job_assignments
    SET status = 'expired', responded_at = now()
    WHERE id = v_expired_rec.assignment_id;

    -- Update queue status for this maid
    UPDATE public.assignment_queue
    SET status = 'skipped'
    WHERE booking_id = v_expired_rec.booking_id AND maid_id = v_expired_rec.maid_id;

    -- Log expiration
    INSERT INTO public.booking_timeline_logs (
      booking_id,
      status_to,
      title,
      details,
      actor_type,
      created_at
    ) VALUES (
      v_expired_rec.booking_id,
      'pending_assignment',
      'Assignment Timed Out',
      'Maid did not respond within deadline. Auto-advancing to next available partner.',
      'system',
      now()
    );

    -- 2. Find candidate next in queue
    SELECT aq.*, m.full_name INTO v_next_candidate
    FROM public.assignment_queue aq
    JOIN public.maid_profiles m ON m.id = aq.maid_id
    WHERE aq.booking_id = v_expired_rec.booking_id 
      AND aq.status = 'pending'
      AND m.is_online = true
    ORDER BY aq.queue_position ASC
    LIMIT 1;

    IF FOUND THEN
      -- Dispatch to next candidate
      INSERT INTO public.job_assignments (
        booking_id,
        maid_id,
        status,
        attempt_number,
        payout_amount,
        platform_fee,
        distance_km,
        eta_mins,
        sent_at,
        expires_at,
        assigned_by
      ) VALUES (
        v_expired_rec.booking_id,
        v_next_candidate.maid_id,
        'sent',
        v_expired_rec.attempt_number + 1,
        v_expired_rec.payout_amount,
        v_expired_rec.platform_fee,
        v_next_candidate.distance_km,
        GREATEST(5, round(COALESCE(v_next_candidate.distance_km, 3) * 3)::integer),
        now(),
        now() + (v_timeout_mins || ' minutes')::interval,
        'auto'
      );

      UPDATE public.assignment_queue
      SET status = 'sent'
      WHERE id = v_next_candidate.id;

      -- Notify next maid
      INSERT INTO public.notifications (
        recipient_id,
        recipient_role,
        title,
        message,
        category,
        related_booking_id,
        created_at
      ) VALUES (
        v_next_candidate.maid_id,
        'maid',
        'New Job Request Available!',
        'New cleaning booking near you. Accept within ' || v_timeout_mins || ' mins.',
        'dispatch',
        v_expired_rec.booking_id,
        now()
      );
    ELSE
      -- No further candidates available: notify admin
      INSERT INTO public.notifications (
        recipient_role,
        title,
        message,
        category,
        related_booking_id,
        created_at
      ) VALUES (
        'admin',
        'Dispatch Alert: Assignment Exhausted',
        'All candidates in queue for booking have expired or are offline. Manual assignment required.',
        'dispatch',
        v_expired_rec.booking_id,
        now()
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. RESET MONTHLY EARNINGS (Audit Function #8)
-- Resets maid_profiles.earnings_this_month to 0.00
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reset_monthly_earnings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.maid_profiles
  SET 
    earnings_this_month = 0.00,
    updated_at = now();
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. REFRESH REPORTS CACHE (Audit Function #12)
-- Aggregates daily platform totals into reports_cache
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.refresh_reports_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := current_date;
  v_revenue_payload jsonb;
  v_utilization_payload jsonb;
BEGIN
  -- Aggregate Revenue & Booking Counts
  SELECT jsonb_build_object(
    'date', v_today,
    'total_bookings', count(*),
    'completed_bookings', count(*) FILTER (WHERE status = 'completed'),
    'cancelled_bookings', count(*) FILTER (WHERE status = 'cancelled'),
    'gross_revenue', COALESCE(sum(total_amount) FILTER (WHERE payment_status = 'paid'), 0),
    'platform_commission', COALESCE(sum(total_amount * 0.20) FILTER (WHERE payment_status = 'paid' AND status = 'completed'), 0)
  ) INTO v_revenue_payload
  FROM public.bookings
  WHERE scheduled_date >= (v_today - interval '30 days');

  -- Aggregate Maid Partner Utilization
  SELECT jsonb_build_object(
    'date', v_today,
    'total_maids', count(*),
    'online_maids', count(*) FILTER (WHERE is_online = true),
    'approved_maids', count(*) FILTER (WHERE COALESCE(status::text, application_status::text, '') = 'approved'),
    'pending_kyc', count(*) FILTER (WHERE kyc_status::text != 'verified' AND COALESCE(status::text, application_status::text, '') = 'pending')
  ) INTO v_utilization_payload
  FROM public.maid_profiles;

  -- Upsert Revenue Cache
  INSERT INTO public.reports_cache (report_type, period, payload, generated_at)
  VALUES ('daily_revenue', v_today, v_revenue_payload, now())
  ON CONFLICT DO NOTHING;

  -- Upsert Utilization Cache
  INSERT INTO public.reports_cache (report_type, period, payload, generated_at)
  VALUES ('maid_utilization', v_today, v_utilization_payload, now())
  ON CONFLICT DO NOTHING;
END;
$$;

-- Grant execution to authenticated users / service roles
GRANT EXECUTE ON FUNCTION public.mask_aadhaar(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.mask_bank_account(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.build_assignment_queue(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_job_assignments() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_monthly_earnings() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_reports_cache() TO authenticated, service_role;
