-- Migration 019: Complete Banners & Offers Module
-- Bucket: gc-home-assets (folders: 'banners/', 'offers/')

-- 1. Ensure homepage_banners title and cta_text are optional to support Image-Only banners
ALTER TABLE IF EXISTS public.homepage_banners ALTER COLUMN title DROP NOT NULL;
ALTER TABLE IF EXISTS public.homepage_banners ALTER COLUMN title SET DEFAULT 'Homepage Banner';
ALTER TABLE IF EXISTS public.homepage_banners ALTER COLUMN cta_text DROP NOT NULL;
ALTER TABLE IF EXISTS public.homepage_banners ALTER COLUMN cta_text SET DEFAULT 'Book Now';

-- 2. Ensure offers table has image_url and applicability columns
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS applicable_type text DEFAULT 'all';
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS applicable_category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS applicable_service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

-- 3. RLS Policies on homepage_banners and offers
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "homepage_banners_read_all" ON public.homepage_banners;
CREATE POLICY "homepage_banners_read_all" ON public.homepage_banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "homepage_banners_write_all" ON public.homepage_banners;
CREATE POLICY "homepage_banners_write_all" ON public.homepage_banners FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "offers_read_all" ON public.offers;
CREATE POLICY "offers_read_all" ON public.offers FOR SELECT USING (true);

DROP POLICY IF EXISTS "offers_write_all" ON public.offers;
CREATE POLICY "offers_write_all" ON public.offers FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Realtime Replication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.homepage_banners;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;
