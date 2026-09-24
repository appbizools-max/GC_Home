-- ==============================================================================
-- GC HOME+ — MIGRATION 016: SERVICES, CATEGORIES & ADDONS RLS, SEED AND REALTIME
-- ==============================================================================

-- 1. Table Definitions
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon_name text NOT NULL DEFAULT 'home',
  bg_color text NOT NULL DEFAULT '#EAF8F1',
  icon_color text NOT NULL DEFAULT '#168A68',
  route_category text NOT NULL DEFAULT 'home_cleaning',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_bestseller boolean DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public.service_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration_min integer DEFAULT 30,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_service_categories_order ON public.service_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_order ON public.services(display_order);
CREATE INDEX IF NOT EXISTS idx_service_addons_service_id ON public.service_addons(service_id);

-- 3. Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;

-- 4. Permissive RLS Policies (Full SELECT and Write access for web app & admin context)
DROP POLICY IF EXISTS "service_categories_public_read" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_admin_all" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_read_all" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_write_all" ON public.service_categories;

CREATE POLICY "service_categories_read_all" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "service_categories_write_all" ON public.service_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "services_public_read" ON public.services;
DROP POLICY IF EXISTS "services_admin_all" ON public.services;
DROP POLICY IF EXISTS "services_read_all" ON public.services;
DROP POLICY IF EXISTS "services_write_all" ON public.services;

CREATE POLICY "services_read_all" ON public.services FOR SELECT USING (true);
CREATE POLICY "services_write_all" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_addons_public_read" ON public.service_addons;
DROP POLICY IF EXISTS "service_addons_admin_all" ON public.service_addons;
DROP POLICY IF EXISTS "service_addons_read_all" ON public.service_addons;
DROP POLICY IF EXISTS "service_addons_write_all" ON public.service_addons;

CREATE POLICY "service_addons_read_all" ON public.service_addons FOR SELECT USING (true);
CREATE POLICY "service_addons_write_all" ON public.service_addons FOR ALL USING (true) WITH CHECK (true);

-- 5. Realtime Publication Integration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.service_categories;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.service_addons;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- 6. Initial Seed Data (Only if tables are empty)
INSERT INTO public.service_categories (id, name, icon_name, bg_color, icon_color, route_category, display_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Home Cleaning', 'home', '#EAF8F1', '#168A68', 'home_cleaning', 1),
  ('22222222-2222-2222-2222-222222222222', 'Kitchen Cleaning', 'kitchen', '#FEF3C7', '#D97706', 'kitchen_cleaning', 2),
  ('33333333-3333-3333-3333-333333333333', 'Bathroom Cleaning', 'bath', '#E0F2FE', '#0284C7', 'bathroom_cleaning', 3),
  ('44444444-4444-4444-4444-444444444444', 'Sofa & Fabric Care', 'sofa', '#F3E8FF', '#7E22CE', 'sofa_cleaning', 4),
  ('55555555-5555-5555-5555-555555555555', 'Deep Cleaning', 'deep', '#FCE7F3', '#BE185D', 'deep_cleaning', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.services (id, name, category, category_id, starting_price, estimated_duration, image_url, features, is_bestseller, display_order, rating, review_count)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'Full Home Deep Cleaning',
    'Deep Cleaning',
    '55555555-5555-5555-5555-555555555555',
    1999,
    '4 - 5 hrs',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    ARRAY['All rooms deep sanitized', 'Inside wardrobe wipe', 'Balcony pressure wash', 'Cobweb removal'],
    true,
    1,
    4.9,
    3400
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Kitchen Deep Sanitization',
    'Kitchen Cleaning',
    '22222222-2222-2222-2222-222222222222',
    899,
    '2 - 3 hrs',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600',
    ARRAY['Stove & sink degreasing', 'Tile scrub & stain removal', 'Appliance exterior polish'],
    true,
    2,
    4.8,
    2100
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'Bathroom Deep Cleaning',
    'Bathroom Cleaning',
    '33333333-3333-3333-3333-333333333333',
    499,
    '1.5 hrs',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    ARRAY['Tile descaling & grout scrub', 'Taps & fixture chrome shine', 'Disinfection wash'],
    false,
    3,
    4.7,
    1800
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'Sofa & Upholstery Care',
    'Sofa & Fabric Care',
    '44444444-4444-4444-4444-444444444444',
    699,
    '2 hrs',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=600',
    ARRAY['Shampooing & foam wash', 'Stain extraction', 'Quick dry blow'],
    true,
    4,
    4.9,
    1500
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_addons (id, service_id, name, description, price, duration_min, display_order)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Refrigerator Cleaning', 'Internal shelves wipe, freezer defrost wash & deodorizing', 199, 30, 1),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Microwave Cleaning', 'Grease removal, turntable sanitize & interior polish', 149, 20, 2),
  ('b3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Balcony Cleaning', 'Railing wash, floor scrubbing & pigeon net wipe', 199, 30, 3),
  ('b4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'Window Cleaning', 'Glass descaling, mesh vacuum & track cleaning', 249, 45, 4)
ON CONFLICT (id) DO NOTHING;
