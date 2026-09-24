-- ==============================================================================
-- GC HOME+ — MIGRATION 033: FIX STORAGE BUCKET & VERIFY PAYOUT TRIGGER
-- ==============================================================================
-- PURPOSE:
--   1. Ensure gc-home-assets storage bucket is created and publicly accessible
--   2. Ensure partner-kyc storage bucket is created and accessible
--   3. Verify payout trigger exists on bookings table completion
--   4. Create payout trigger if missing
-- ==============================================================================

-- ── SECTION 1: STORAGE BUCKETS ────────────────────────────────────────────────
-- Note: Storage bucket creation via SQL requires the storage schema.
-- Run this block ONLY if the buckets do not already exist in your Supabase project.
-- You can also create them via the Supabase Dashboard > Storage > New Bucket.

DO $$
BEGIN
  -- Create gc-home-assets bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'gc-home-assets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
    VALUES (
      'gc-home-assets',
      'gc-home-assets',
      true,
      false,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    );
    RAISE NOTICE 'Created storage bucket: gc-home-assets';
  ELSE
    -- Ensure existing bucket is public
    UPDATE storage.buckets
    SET public = true
    WHERE id = 'gc-home-assets';
    RAISE NOTICE 'Storage bucket gc-home-assets already exists — ensured public = true';
  END IF;

  -- Create partner-kyc bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'partner-kyc'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
    VALUES (
      'partner-kyc',
      'partner-kyc',
      false,
      false,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    );
    RAISE NOTICE 'Created storage bucket: partner-kyc';
  ELSE
    RAISE NOTICE 'Storage bucket partner-kyc already exists — no change needed';
  END IF;
END $$;


-- ── SECTION 2: STORAGE RLS POLICIES ──────────────────────────────────────────

-- Public read access for gc-home-assets (service images, banners, etc.)
DROP POLICY IF EXISTS "gc_home_assets_public_read" ON storage.objects;
CREATE POLICY "gc_home_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gc-home-assets');

-- Authenticated upload for gc-home-assets (admin can upload service images)
DROP POLICY IF EXISTS "gc_home_assets_authenticated_upload" ON storage.objects;
CREATE POLICY "gc_home_assets_authenticated_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gc-home-assets' AND auth.role() = 'authenticated');

-- Authenticated update for gc-home-assets
DROP POLICY IF EXISTS "gc_home_assets_authenticated_update" ON storage.objects;
CREATE POLICY "gc_home_assets_authenticated_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gc-home-assets' AND auth.role() = 'authenticated');

-- Authenticated delete for gc-home-assets (admin only)
DROP POLICY IF EXISTS "gc_home_assets_authenticated_delete" ON storage.objects;
CREATE POLICY "gc_home_assets_authenticated_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gc-home-assets' AND auth.role() = 'authenticated');

-- Partner KYC: only the partner themselves or admin can read/write
DROP POLICY IF EXISTS "partner_kyc_owner_or_admin_access" ON storage.objects;
CREATE POLICY "partner_kyc_owner_or_admin_access"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'partner-kyc'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'partner-kyc'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ── SECTION 3: PAYOUT TRIGGER VERIFICATION & CREATION ────────────────────────

-- 3a. Ensure the payouts table exists (created in migration 005, but guard here)
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  maid_id uuid REFERENCES public.maid_profiles(id) ON DELETE SET NULL,
  gross_amount numeric(10,2) NOT NULL DEFAULT 0,
  platform_commission_pct numeric(5,2) NOT NULL DEFAULT 25.00,
  platform_commission numeric(10,2) NOT NULL DEFAULT 0,
  net_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'disbursed', 'failed', 'on_hold')),
  payment_method text DEFAULT 'bank_transfer',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3b. Create or replace the payout calculation function
CREATE OR REPLACE FUNCTION public.fn_auto_create_payout_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gross     numeric;
  v_pct       numeric := 25.00;  -- 25% platform commission; 75% goes to partner
  v_commission numeric;
  v_net       numeric;
BEGIN
  -- Only fire when status transitions TO 'completed'
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'completed' THEN
    RETURN NEW;  -- Already completed, prevent duplicate payout
  END IF;
  -- Only create payout if partner is assigned
  IF NEW.assigned_maid_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_gross      := COALESCE(NEW.total_amount, 0);
  v_commission := ROUND(v_gross * v_pct / 100.0, 2);
  v_net        := v_gross - v_commission;

  -- Insert payout row (idempotent — skip if one already exists for this booking+maid)
  INSERT INTO public.payouts (
    booking_id,
    maid_id,
    gross_amount,
    platform_commission_pct,
    platform_commission,
    net_amount,
    status,
    notes,
    created_at,
    updated_at
  )
  SELECT
    NEW.id,
    NEW.assigned_maid_id,
    v_gross,
    v_pct,
    v_commission,
    v_net,
    'pending',
    'Auto-created on booking completion: ' || COALESCE(NEW.booking_code, NEW.id::text),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.payouts
    WHERE booking_id = NEW.id
    AND maid_id = NEW.assigned_maid_id
  );

  -- Update maid_profiles cumulative earnings
  UPDATE public.maid_profiles
  SET
    total_earnings      = COALESCE(total_earnings, 0) + v_net,
    earnings_this_month = COALESCE(earnings_this_month, 0) + v_net,
    completed_jobs_count = COALESCE(completed_jobs_count, 0) + 1,
    updated_at          = now()
  WHERE id = NEW.assigned_maid_id;

  RETURN NEW;
END;
$$;

-- 3c. Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_auto_payout_on_completion ON public.bookings;

CREATE TRIGGER trg_auto_payout_on_completion
  AFTER UPDATE OF status
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_create_payout_on_completion();


-- ── SECTION 4: PAYOUTS RLS ────────────────────────────────────────────────────
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Admin can see and manage all payouts
DROP POLICY IF EXISTS "payouts_admin_all" ON public.payouts;
CREATE POLICY "payouts_admin_all"
  ON public.payouts FOR ALL
  USING (true) WITH CHECK (true);

-- Maid can see their own payouts
DROP POLICY IF EXISTS "payouts_maid_read_own" ON public.payouts;
CREATE POLICY "payouts_maid_read_own"
  ON public.payouts FOR SELECT
  USING (maid_id = auth.uid());

-- Add payouts to realtime if publication exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;


-- ── SECTION 5: VERIFY ────────────────────────────────────────────────────────
-- Run these SELECT statements manually to confirm everything is in place:
--
-- SELECT id, name, public FROM storage.buckets WHERE id IN ('gc-home-assets', 'partner-kyc');
-- SELECT trigger_name, event_manipulation, action_statement
--   FROM information_schema.triggers
--   WHERE event_object_table = 'bookings' AND trigger_name = 'trg_auto_payout_on_completion';
-- SELECT COUNT(*) FROM public.payouts;
