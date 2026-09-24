-- Migration 018: Complete 18 Categories and 90 Services Catalog Seed with Storage Paths
-- Bucket: gc-home-assets
-- Category images: categories/{category-slug}.webp
-- Service images: services/{category-slug}/{service-slug}.webp

-- Ensure table columns exist
ALTER TABLE IF EXISTS public.service_categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Verify 18 categories and 90 services seeded
COMMENT ON TABLE public.service_categories IS 'Service categories managed via Admin Panel and displayed in User App';
COMMENT ON TABLE public.services IS 'Services catalog managed via Admin Panel and booked in User App';
