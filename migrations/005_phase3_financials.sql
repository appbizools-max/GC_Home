-- ============================================================
-- FILE: migrations/005_phase3_financials.sql
-- Purpose: Phase 3 Financial Engine, Earnings & Payout Ledger
-- Tables: maid_payouts, payments, earnings
-- Views: v_revenue_summary, v_maid_dashboard, v_customer_lifetime_value
-- Triggers: on_job_completed
-- Idempotent: safe to run multiple times
-- ============================================================

-- -------------------------
-- STEP 1: Tables
-- -------------------------

-- 1.1 maid_payouts (created before earnings so earnings can FK to it)
CREATE TABLE IF NOT EXISTS public.maid_payouts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maid_id               uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  amount                numeric(10,2) NOT NULL,
  period_start          date NOT NULL DEFAULT CURRENT_DATE,
  period_end            date NOT NULL DEFAULT CURRENT_DATE,
  jobs_count            integer NOT NULL DEFAULT 1,
  bank_account_number   text NOT NULL DEFAULT '',
  bank_ifsc             text NOT NULL DEFAULT '',
  status                payout_status NOT NULL DEFAULT 'pending',
  disbursal_reference   text,
  disbursed_by          uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  disbursed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS amount numeric(10,2);
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS period_start date DEFAULT CURRENT_DATE;
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS period_end date DEFAULT CURRENT_DATE;
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS jobs_count integer DEFAULT 1;
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS bank_account_number text DEFAULT '';
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS bank_ifsc text DEFAULT '';
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS status payout_status DEFAULT 'pending';
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS disbursal_reference text;
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS disbursed_by uuid;
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS disbursed_at timestamptz;
ALTER TABLE public.maid_payouts ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_maid_payouts_maid_id ON public.maid_payouts(maid_id);
CREATE INDEX IF NOT EXISTS idx_maid_payouts_status ON public.maid_payouts(status);

-- 1.2 payments
CREATE TABLE IF NOT EXISTS public.payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount              numeric(10,2) NOT NULL,
  currency            text NOT NULL DEFAULT 'INR',
  payment_method      payment_method_enum NOT NULL DEFAULT 'online',
  payment_status      payment_status_enum NOT NULL DEFAULT 'pending',
  gateway             text DEFAULT 'razorpay',
  gateway_order_id    text,
  gateway_payment_id  text,
  gateway_signature   text,
  gateway_response    jsonb,
  refund_id           text,
  refund_amount       numeric(10,2),
  refunded_at         timestamptz,
  paid_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount numeric(10,2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method payment_method_enum DEFAULT 'online';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pending';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway text DEFAULT 'razorpay';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_order_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_payment_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_signature text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_response jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS refund_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS refund_amount numeric(10,2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

-- 1.3 earnings
CREATE TABLE IF NOT EXISTS public.earnings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maid_id             uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  booking_id          uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_name        text NOT NULL,
  gross_amount        numeric(10,2) NOT NULL,
  platform_fee_pct    numeric(5,2) NOT NULL DEFAULT 20.00,
  platform_fee_amount numeric(10,2) NOT NULL,
  maid_amount         numeric(10,2) NOT NULL,
  payout_status       payout_status NOT NULL DEFAULT 'pending',
  payout_id           uuid REFERENCES public.maid_payouts(id) ON DELETE SET NULL,
  earned_at           date NOT NULL DEFAULT CURRENT_DATE,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.earnings ADD COLUMN IF NOT EXISTS gross_amount numeric(10,2);
ALTER TABLE public.earnings ADD COLUMN IF NOT EXISTS platform_fee_pct numeric(5,2) DEFAULT 20.00;
ALTER TABLE public.earnings ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(10,2);
ALTER TABLE public.earnings ADD COLUMN IF NOT EXISTS maid_amount numeric(10,2);
ALTER TABLE public.earnings ADD COLUMN IF NOT EXISTS payout_status payout_status DEFAULT 'pending';
ALTER TABLE public.earnings ADD COLUMN IF NOT EXISTS payout_id uuid;
ALTER TABLE public.earnings ADD COLUMN IF NOT EXISTS earned_at date DEFAULT CURRENT_DATE;
ALTER TABLE public.earnings ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_earnings_maid_id ON public.earnings(maid_id);
CREATE INDEX IF NOT EXISTS idx_earnings_booking_id ON public.earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_earnings_payout_status ON public.earnings(payout_status);

-- -------------------------
-- STEP 2: Triggers and Functions
-- -------------------------

-- 2.1 on_job_completed trigger
CREATE OR REPLACE FUNCTION on_job_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gross numeric(10,2);
  v_fee_pct numeric(5,2) := 20.00;
  v_fee_amt numeric(10,2);
  v_maid_amt numeric(10,2);
  v_service_title text;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    v_gross := COALESCE(NEW.total_amount, 0);
    v_fee_amt := ROUND(v_gross * (v_fee_pct / 100.0), 2);
    v_maid_amt := v_gross - v_fee_amt;
    v_service_title := COALESCE(NEW.service_name, 'Home Cleaning Service');

    -- Insert earning record if maid was assigned
    IF NEW.assigned_maid_id IS NOT NULL THEN
      INSERT INTO public.earnings (
        maid_id,
        booking_id,
        service_name,
        gross_amount,
        platform_fee_pct,
        platform_fee_amount,
        maid_amount,
        payout_status,
        earned_at
      ) VALUES (
        NEW.assigned_maid_id,
        NEW.id,
        v_service_title,
        v_gross,
        v_fee_pct,
        v_fee_amt,
        v_maid_amt,
        'pending',
        COALESCE(NEW.scheduled_date, CURRENT_DATE)
      );

      -- Update maid profile counters
      UPDATE public.maid_profiles
      SET completed_jobs_count = COALESCE(completed_jobs_count, 0) + 1,
          total_earnings = COALESCE(total_earnings, 0) + v_maid_amt,
          earnings_this_month = COALESCE(earnings_this_month, 0) + v_maid_amt,
          updated_at = now()
      WHERE id = NEW.assigned_maid_id;
    END IF;

    -- Update customer profile counters
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE public.user_profiles
      SET updated_at = now()
      WHERE id = NEW.customer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_job_completed ON public.bookings;
CREATE TRIGGER trg_on_job_completed
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION on_job_completed();

-- -------------------------
-- STEP 3: Views
-- -------------------------

-- 3.1 v_revenue_summary
CREATE OR REPLACE VIEW public.v_revenue_summary AS
SELECT
  b.scheduled_date AS date,
  COUNT(b.id) AS completed_bookings,
  COALESCE(SUM(b.total_amount), 0) AS gross_revenue,
  COALESCE(SUM(ROUND(b.total_amount * 0.20, 2)), 0) AS platform_commission,
  COALESCE(SUM(ROUND(b.total_amount * 0.80, 2)), 0) AS maid_payouts
FROM public.bookings b
WHERE b.status = 'completed'
GROUP BY b.scheduled_date
ORDER BY b.scheduled_date DESC;

-- 3.2 v_maid_dashboard
CREATE OR REPLACE VIEW public.v_maid_dashboard AS
SELECT
  m.id AS maid_id,
  m.maid_code,
  m.full_name,
  m.phone,
  m.rating,
  m.total_ratings_count,
  m.is_online,
  m.status,
  m.service_area,
  COALESCE(m.completed_jobs_count, 0) AS completed_jobs,
  COALESCE(m.earnings_this_month, 0) AS earnings_this_month,
  COALESCE(m.total_earnings, 0) AS total_earnings,
  COALESCE(SUM(CASE WHEN e.payout_status = 'pending' THEN e.maid_amount ELSE 0 END), 0) AS pending_payout_amount
FROM public.maid_profiles m
LEFT JOIN public.earnings e ON m.id = e.maid_id
GROUP BY m.id, m.maid_code, m.full_name, m.phone, m.rating, m.total_ratings_count, m.is_online, m.status, m.service_area, m.completed_jobs_count, m.earnings_this_month, m.total_earnings;

-- 3.3 v_customer_lifetime_value
CREATE OR REPLACE VIEW public.v_customer_lifetime_value AS
SELECT
  u.id AS customer_id,
  u.name,
  u.phone,
  u.email,
  u.customer_type,
  u.created_at AS joined_date,
  COUNT(b.id) AS total_bookings,
  COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) AS total_spent,
  MAX(b.scheduled_date) AS last_booking_date
FROM public.user_profiles u
LEFT JOIN public.bookings b ON u.id = b.customer_id
WHERE u.role = 'customer'
GROUP BY u.id, u.name, u.phone, u.email, u.customer_type, u.created_at;

-- -------------------------
-- STEP 4: Row-Level Security
-- -------------------------

ALTER TABLE public.maid_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

-- 4.1 maid_payouts policies
DROP POLICY IF EXISTS "Maids can view own payouts" ON public.maid_payouts;
CREATE POLICY "Maids can view own payouts"
  ON public.maid_payouts FOR SELECT
  TO authenticated
  USING (maid_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage maid payouts" ON public.maid_payouts;
CREATE POLICY "Admins can manage maid payouts"
  ON public.maid_payouts FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 4.2 payments policies
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id AND bookings.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Admins can manage all payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 4.3 earnings policies
DROP POLICY IF EXISTS "Maids can view own earnings" ON public.earnings;
CREATE POLICY "Maids can view own earnings"
  ON public.earnings FOR SELECT
  TO authenticated
  USING (maid_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all earnings" ON public.earnings;
CREATE POLICY "Admins can manage all earnings"
  ON public.earnings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
