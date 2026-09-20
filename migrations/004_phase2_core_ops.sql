-- ============================================================
-- FILE: migrations/004_phase2_core_ops.sql
-- Purpose: Phase 2 Core Operations & KYC Persistence
-- Tables: maid_kyc_documents, maid_history, job_assignments,
--         assignment_queue, booking_timeline_logs,
--         booking_status_history, ratings
-- Views: v_booking_summary, v_pending_assignments
-- Triggers: update_kyc_completion_pct, on_rating_submitted, on_booking_status_change
-- Idempotent: safe to run multiple times
-- ============================================================

-- -------------------------
-- STEP 0: Schema Alignment on bookings
-- -------------------------
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS time_slot text DEFAULT '10:00 AM';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS scheduled_time text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_lat numeric(10,7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_lng numeric(10,7);

-- -------------------------
-- STEP 1: Tables
-- -------------------------

-- 1.1 maid_kyc_documents
CREATE TABLE IF NOT EXISTS public.maid_kyc_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maid_id           uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  doc_type          kyc_doc_type NOT NULL,
  title             text NOT NULL,
  file_name         text,
  file_url          text NOT NULL DEFAULT '',
  file_size_bytes   integer,
  file_size         text,
  status            kyc_doc_status NOT NULL DEFAULT 'pending',
  rejection_note    text,
  uploaded_at       timestamptz NOT NULL DEFAULT now(),
  verified_at       timestamptz,
  verified_by       uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  verified_by_name  text,
  expires_at        date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS maid_id uuid;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS doc_type kyc_doc_type;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS file_url text DEFAULT '';
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS file_size_bytes integer;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS file_size text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS status kyc_doc_status DEFAULT 'pending';
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS rejection_note text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS uploaded_at timestamptz DEFAULT now();
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS verified_by uuid;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS verified_by_name text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS expires_at date;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_maid_kyc_docs_maid_id ON public.maid_kyc_documents(maid_id);
CREATE INDEX IF NOT EXISTS idx_maid_kyc_docs_status ON public.maid_kyc_documents(status);

-- 1.2 maid_history
CREATE TABLE IF NOT EXISTS public.maid_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maid_id     uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  action      text NOT NULL,
  actor_id    uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  actor_name  text,
  details     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maid_history ADD COLUMN IF NOT EXISTS maid_id uuid;
ALTER TABLE public.maid_history ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE public.maid_history ADD COLUMN IF NOT EXISTS actor_id uuid;
ALTER TABLE public.maid_history ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE public.maid_history ADD COLUMN IF NOT EXISTS details text;
ALTER TABLE public.maid_history ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_maid_history_maid_id ON public.maid_history(maid_id);

-- 1.3 job_assignments
CREATE TABLE IF NOT EXISTS public.job_assignments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  maid_id               uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  status                assignment_status NOT NULL DEFAULT 'sent',
  attempt_number        integer NOT NULL DEFAULT 1,
  payout_amount         numeric(10,2) NOT NULL DEFAULT 0,
  platform_fee          numeric(10,2) NOT NULL DEFAULT 0,
  distance_km           numeric(6,2),
  eta_mins              integer,
  sent_at               timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz NOT NULL,
  responded_at          timestamptz,
  rejection_reason      text,
  assigned_by           text NOT NULL DEFAULT 'auto',
  assigned_by_admin_id  uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS booking_id uuid;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS maid_id uuid;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS status assignment_status DEFAULT 'sent';
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS attempt_number integer DEFAULT 1;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS payout_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2) DEFAULT 0;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS distance_km numeric(6,2);
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS eta_mins integer;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS sent_at timestamptz DEFAULT now();
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS responded_at timestamptz;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS assigned_by text DEFAULT 'auto';
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS assigned_by_admin_id uuid;
ALTER TABLE public.job_assignments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_job_assignments_booking_id ON public.job_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_maid_id ON public.job_assignments(maid_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_status ON public.job_assignments(status);

-- 1.4 assignment_queue
CREATE TABLE IF NOT EXISTS public.assignment_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  maid_id         uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  queue_position  integer NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'pending',
  distance_km     numeric(6,2),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_queue ADD COLUMN IF NOT EXISTS booking_id uuid;
ALTER TABLE public.assignment_queue ADD COLUMN IF NOT EXISTS maid_id uuid;
ALTER TABLE public.assignment_queue ADD COLUMN IF NOT EXISTS queue_position integer DEFAULT 1;
ALTER TABLE public.assignment_queue ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.assignment_queue ADD COLUMN IF NOT EXISTS distance_km numeric(6,2);
ALTER TABLE public.assignment_queue ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_assignment_queue_booking ON public.assignment_queue(booking_id, queue_position);

-- 1.5 booking_timeline_logs
CREATE TABLE IF NOT EXISTS public.booking_timeline_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status_to   booking_status NOT NULL,
  title       text NOT NULL,
  details     text,
  actor_type  text NOT NULL DEFAULT 'system',
  actor_id    uuid,
  actor_name  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS booking_id uuid;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS status_to booking_status;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS details text;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS actor_type text DEFAULT 'system';
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS actor_id uuid;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_booking_timeline_booking_id ON public.booking_timeline_logs(booking_id);

-- 1.6 booking_status_history
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_status     booking_status,
  to_status       booking_status NOT NULL,
  changed_by_type text NOT NULL DEFAULT 'system',
  changed_by_id   uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_status_history ADD COLUMN IF NOT EXISTS booking_id uuid;
ALTER TABLE public.booking_status_history ADD COLUMN IF NOT EXISTS from_status booking_status;
ALTER TABLE public.booking_status_history ADD COLUMN IF NOT EXISTS to_status booking_status;
ALTER TABLE public.booking_status_history ADD COLUMN IF NOT EXISTS changed_by_type text DEFAULT 'system';
ALTER TABLE public.booking_status_history ADD COLUMN IF NOT EXISTS changed_by_id uuid;
ALTER TABLE public.booking_status_history ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_booking_status_hist_booking ON public.booking_status_history(booking_id);

-- 1.7 ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  maid_id     uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  service_id  uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     text,
  is_visible  boolean NOT NULL DEFAULT true,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS rating smallint;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS reviewed_at timestamptz DEFAULT now();
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS maid_id uuid;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS service_id uuid;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS booking_id uuid;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_ratings_maid_id ON public.ratings(maid_id);
CREATE INDEX IF NOT EXISTS idx_ratings_customer_id ON public.ratings(customer_id);

-- -------------------------
-- STEP 2: Triggers and Functions
-- -------------------------

-- 2.1 Updated_at trigger for maid_kyc_documents
DROP TRIGGER IF EXISTS trg_maid_kyc_documents_updated_at ON public.maid_kyc_documents;
CREATE TRIGGER trg_maid_kyc_documents_updated_at
  BEFORE UPDATE ON public.maid_kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 2.2 update_kyc_completion_pct trigger
CREATE OR REPLACE FUNCTION update_kyc_completion_pct()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_maid_id uuid;
  total_required integer := 5;
  verified_count integer := 0;
  calc_pct integer := 0;
  new_kyc_status text := 'pending';
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_maid_id := OLD.maid_id;
  ELSE
    target_maid_id := NEW.maid_id;
  END IF;

  SELECT COUNT(*)
  INTO verified_count
  FROM public.maid_kyc_documents
  WHERE maid_id = target_maid_id
    AND status = 'verified'
    AND doc_type IN ('aadhaar', 'pan', 'address_proof', 'police_verification', 'bank_passbook');

  calc_pct := LEAST(100, (verified_count * 100) / total_required);

  IF calc_pct = 100 THEN
    new_kyc_status := 'verified';
  ELSIF verified_count > 0 THEN
    new_kyc_status := 'under_review';
  ELSE
    new_kyc_status := 'pending';
  END IF;

  UPDATE public.maid_profiles
  SET kyc_completion_pct = calc_pct,
      kyc_status = new_kyc_status,
      updated_at = now()
  WHERE id = target_maid_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_kyc_completion_pct ON public.maid_kyc_documents;
CREATE TRIGGER trg_update_kyc_completion_pct
  AFTER INSERT OR UPDATE OR DELETE ON public.maid_kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_kyc_completion_pct();

-- 2.3 on_rating_submitted trigger
CREATE OR REPLACE FUNCTION on_rating_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_score numeric(3,2);
  ratings_cnt integer;
BEGIN
  SELECT
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*)
  INTO avg_score, ratings_cnt
  FROM public.ratings
  WHERE maid_id = NEW.maid_id AND is_visible = true;

  UPDATE public.maid_profiles
  SET rating = COALESCE(avg_score, 5.00),
      total_ratings_count = COALESCE(ratings_cnt, 0),
      updated_at = now()
  WHERE id = NEW.maid_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_rating_submitted ON public.ratings;
CREATE TRIGGER trg_on_rating_submitted
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION on_rating_submitted();

-- 2.4 on_booking_status_change trigger
CREATE OR REPLACE FUNCTION on_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      from_status,
      to_status,
      changed_by_type
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'system'
    );

    INSERT INTO public.booking_timeline_logs (
      booking_id,
      status_to,
      title,
      details,
      actor_type
    ) VALUES (
      NEW.id,
      NEW.status,
      REPLACE(INITCAP(NEW.status::text), '_', ' '),
      'Status changed from ' || COALESCE(REPLACE(INITCAP(OLD.status::text), '_', ' '), 'None') || ' to ' || REPLACE(INITCAP(NEW.status::text), '_', ' '),
      'system'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_booking_status_change ON public.bookings;
CREATE TRIGGER trg_on_booking_status_change
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION on_booking_status_change();

-- -------------------------
-- STEP 3: Views
-- -------------------------

-- 3.1 v_booking_summary
CREATE OR REPLACE VIEW public.v_booking_summary AS
SELECT
  b.id,
  b.booking_code,
  b.status,
  b.scheduled_date,
  COALESCE(b.time_slot, '10:00 AM') AS scheduled_time,
  b.time_slot,
  b.total_amount,
  b.service_price,
  b.payment_method,
  b.payment_status,
  b.address_street,
  b.address_locality,
  b.address_city,
  b.address_pincode,
  b.customer_id,
  up.name AS customer_name,
  up.phone AS customer_phone,
  up.email AS customer_email,
  b.assigned_maid_id,
  mp.maid_code AS assigned_maid_code,
  mp.full_name AS assigned_maid_name,
  mp.phone AS assigned_maid_phone,
  mp.rating AS assigned_maid_rating,
  b.service_id,
  s.name AS service_name,
  s.category AS service_category,
  b.created_at,
  b.updated_at
FROM public.bookings b
LEFT JOIN public.user_profiles up ON b.customer_id = up.id
LEFT JOIN public.maid_profiles mp ON b.assigned_maid_id = mp.id
LEFT JOIN public.services s ON b.service_id = s.id;

-- 3.2 v_pending_assignments
CREATE OR REPLACE VIEW public.v_pending_assignments AS
SELECT
  b.id AS booking_id,
  b.booking_code,
  b.scheduled_date,
  COALESCE(b.time_slot, '10:00 AM') AS scheduled_time,
  b.time_slot,
  b.service_name,
  b.total_amount,
  b.address_locality,
  b.address_city,
  b.address_lat,
  b.address_lng,
  b.created_at,
  COUNT(ja.id) AS assignment_attempts
FROM public.bookings b
LEFT JOIN public.job_assignments ja ON b.id = ja.booking_id
WHERE b.status = 'pending_assignment'
GROUP BY b.id, b.booking_code, b.scheduled_date, b.time_slot, b.service_name, b.total_amount, b.address_locality, b.address_city, b.address_lat, b.address_lng, b.created_at;

-- -------------------------
-- STEP 4: Row-Level Security
-- -------------------------

ALTER TABLE public.maid_kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maid_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_timeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- 4.1 maid_kyc_documents policies
DROP POLICY IF EXISTS "Maids can view own KYC documents" ON public.maid_kyc_documents;
CREATE POLICY "Maids can view own KYC documents"
  ON public.maid_kyc_documents FOR SELECT
  TO authenticated
  USING (maid_id = auth.uid());

DROP POLICY IF EXISTS "Maids can insert own KYC documents" ON public.maid_kyc_documents;
CREATE POLICY "Maids can insert own KYC documents"
  ON public.maid_kyc_documents FOR INSERT
  TO authenticated
  WITH CHECK (maid_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view and manage all KYC documents" ON public.maid_kyc_documents;
CREATE POLICY "Admins can view and manage all KYC documents"
  ON public.maid_kyc_documents FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 4.2 maid_history policies
DROP POLICY IF EXISTS "Maids can view own history" ON public.maid_history;
CREATE POLICY "Maids can view own history"
  ON public.maid_history FOR SELECT
  TO authenticated
  USING (maid_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage maid history" ON public.maid_history;
CREATE POLICY "Admins can manage maid history"
  ON public.maid_history FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 4.3 job_assignments policies
DROP POLICY IF EXISTS "Maids can view assigned jobs" ON public.job_assignments;
CREATE POLICY "Maids can view assigned jobs"
  ON public.job_assignments FOR SELECT
  TO authenticated
  USING (maid_id = auth.uid());

DROP POLICY IF EXISTS "Maids can update assignment response" ON public.job_assignments;
CREATE POLICY "Maids can update assignment response"
  ON public.job_assignments FOR UPDATE
  TO authenticated
  USING (maid_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all job assignments" ON public.job_assignments;
CREATE POLICY "Admins can manage all job assignments"
  ON public.job_assignments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 4.4 assignment_queue policies
DROP POLICY IF EXISTS "Admins can manage assignment queue" ON public.assignment_queue;
CREATE POLICY "Admins can manage assignment queue"
  ON public.assignment_queue FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 4.5 booking_timeline_logs policies
DROP POLICY IF EXISTS "Users can view timeline for own bookings" ON public.booking_timeline_logs;
CREATE POLICY "Users can view timeline for own bookings"
  ON public.booking_timeline_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_timeline_logs.booking_id
        AND (bookings.customer_id = auth.uid() OR bookings.assigned_maid_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view and manage timeline logs" ON public.booking_timeline_logs;
CREATE POLICY "Admins can view and manage timeline logs"
  ON public.booking_timeline_logs FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 4.6 booking_status_history policies
DROP POLICY IF EXISTS "Admins can view booking status history" ON public.booking_status_history;
CREATE POLICY "Admins can view booking status history"
  ON public.booking_status_history FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 4.7 ratings policies
DROP POLICY IF EXISTS "Public can view visible ratings" ON public.ratings;
CREATE POLICY "Public can view visible ratings"
  ON public.ratings FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

DROP POLICY IF EXISTS "Customers can insert own rating" ON public.ratings;
CREATE POLICY "Customers can insert own rating"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.ratings;
CREATE POLICY "Admins can manage all ratings"
  ON public.ratings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
