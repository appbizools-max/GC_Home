-- ==============================================================================
-- GC HOME+ — MIGRATION 017: STORAGE BUCKETS (gc-home-assets), BANNERS & OFFERS
-- ==============================================================================
-- Purpose:
-- 1. Create dedicated 'gc-home-assets' public storage bucket (5MB, JPG/PNG/WEBP)
-- 2. Configure RLS policies for 'gc-home-assets' on storage.objects
-- 3. Ensure 'image_url' column on service_categories
-- 4. Create and configure 'homepage_banners' & 'offers' tables with RLS & Realtime
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STORAGE BUCKET DEFINITION
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gc-home-assets',
  'gc-home-assets',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Explicitly ensure public visibility
UPDATE storage.buckets SET public = true WHERE id = 'gc-home-assets';


-- ------------------------------------------------------------------------------
-- 2. STORAGE RLS POLICIES ON storage.objects
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view gc-home-assets" ON storage.objects;
CREATE POLICY "Public can view gc-home-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gc-home-assets');

DROP POLICY IF EXISTS "Public or authenticated can upload gc-home-assets" ON storage.objects;
CREATE POLICY "Public or authenticated can upload gc-home-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gc-home-assets');

DROP POLICY IF EXISTS "Public or authenticated can update gc-home-assets" ON storage.objects;
CREATE POLICY "Public or authenticated can update gc-home-assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gc-home-assets');

DROP POLICY IF EXISTS "Public or authenticated can delete gc-home-assets" ON storage.objects;
CREATE POLICY "Public or authenticated can delete gc-home-assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gc-home-assets');


-- ------------------------------------------------------------------------------
-- 3. DATABASE SCHEMA UPDATES FOR ADMIN-MANAGED CONTENT
-- ------------------------------------------------------------------------------

-- Ensure service_categories has image_url column
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS image_url text;

-- Ensure homepage_banners table exists
CREATE TABLE IF NOT EXISTS public.homepage_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  tagline text,
  cta_text text NOT NULL DEFAULT 'Book Now →',
  image_url text NOT NULL,
  badge_text text DEFAULT 'Featured',
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_homepage_banners_order ON public.homepage_banners(display_order);
CREATE INDEX IF NOT EXISTS idx_homepage_banners_active ON public.homepage_banners(is_active);

-- Enable RLS on homepage_banners
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homepage_banners_read_all" ON public.homepage_banners;
CREATE POLICY "homepage_banners_read_all" ON public.homepage_banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "homepage_banners_write_all" ON public.homepage_banners;
CREATE POLICY "homepage_banners_write_all" ON public.homepage_banners FOR ALL USING (true) WITH CHECK (true);

-- Ensure offers table has RLS policies if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "offers_read_all" ON public.offers';
    EXECUTE 'CREATE POLICY "offers_read_all" ON public.offers FOR SELECT USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "offers_write_all" ON public.offers';
    EXECUTE 'CREATE POLICY "offers_write_all" ON public.offers FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 4. REALTIME PUBLICATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.homepage_banners;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: Migration 017 completed. gc-home-assets bucket, policies, and homepage_banners configured!';
END $$;
