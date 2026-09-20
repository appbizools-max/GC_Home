-- ==============================================================================
-- GC HOME+ — MIGRATION 013: COMPLETE SYSTEM TABLES, DYNAMIC MODULES & REALTIME
-- ==============================================================================
-- This migration completes the GC Home Plus ecosystem by adding:
-- 1. Service Categories, Add-ons, and Packages
-- 2. Coupons and Promotional Offers
-- 3. Homepage Banners for dynamic content
-- 4. Service Areas and locality management
-- 5. Payouts tracking for maid disbursements
-- 6. Helper functions for rating aggregation and booking timeline
-- 7. Comprehensive RLS policies for all tables
-- 8. Indexes for performance optimization
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: TABLE DEFINITIONS
-- ==============================================================================

-- 1. Service Categories
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

-- 2. Service Add-ons
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

-- 3. Service Packages
CREATE TABLE IF NOT EXISTS public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  included_services uuid[] NOT NULL DEFAULT '{}',
  included_addons uuid[] NOT NULL DEFAULT '{}',
  package_price numeric(10,2) NOT NULL DEFAULT 0,
  original_price numeric(10,2),
  discount_percent integer DEFAULT 0,
  duration_hours numeric(4,1) DEFAULT 3.0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Coupons & Promo Offers
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_text text NOT NULL DEFAULT 'Special Discount',
  subtitle text DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  min_order_amount numeric(10,2) NOT NULL DEFAULT 0,
  max_discount numeric(10,2),
  usage_limit integer DEFAULT 1000,
  used_count integer NOT NULL DEFAULT 0,
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Homepage Banners
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

-- 6. Service Areas & Localities
CREATE TABLE IF NOT EXISTS public.service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL DEFAULT 'Bengaluru',
  locality_name text NOT NULL,
  pincode text NOT NULL,
  is_serviceable boolean NOT NULL DEFAULT true,
  surge_multiplier numeric(3,2) NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maid_id uuid REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed
  reference_id text,
  notes text,
  disbursed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Extend existing services table with additional fields
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_bestseller boolean DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 9. Extend user_profiles for customer management
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- 10. Extend maid_profiles for enhanced management
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS maid_code text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_area text[] DEFAULT '{}';
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_radius_km numeric(5,2) DEFAULT 10.0;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS working_days text[] DEFAULT '{Mon,Tue,Wed,Thu,Fri,Sat}';
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS bank_details jsonb;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS earnings_this_month numeric(10,2) DEFAULT 0;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS total_earnings numeric(10,2) DEFAULT 0;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 11. Generate unique maid codes for existing maids
DO $$
BEGIN
  UPDATE public.maid_profiles 
  SET maid_code = 'GCM' || LPAD(nextval('maid_code_seq')::text, 5, '0')
  WHERE maid_code IS NULL;
END $$;

-- ==============================================================================
-- SECTION 2: INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_service_categories_active ON public.service_categories(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_service_addons_service ON public.service_addons(service_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON public.service_packages(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_validity ON public.coupons(valid_until) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_homepage_banners_active ON public.homepage_banners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_service_areas_pincode ON public.service_areas(pincode) WHERE is_serviceable = true;
CREATE INDEX IF NOT EXISTS idx_payouts_maid ON public.payouts(maid_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status, disbursed_at);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_bestseller ON public.services(is_bestseller) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_maid_profiles_code ON public.maid_profiles(maid_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_type ON public.user_profiles(customer_type);

-- ==============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ==============================================================================

-- Function: Calculate and update service rating aggregates
CREATE OR REPLACE FUNCTION public.update_service_rating_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.services
  SET 
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.ratings
      WHERE service_id = NEW.service_id AND is_visible = true
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*)
      FROM public.ratings
      WHERE service_id = NEW.service_id AND is_visible = true
    ), 0),
    updated_at = now()
  WHERE id = NEW.service_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate and update maid rating aggregates
CREATE OR REPLACE FUNCTION public.update_maid_rating_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.maid_profiles
  SET 
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.ratings
      WHERE maid_id = NEW.maid_id AND is_visible = true
    ), 0),
    updated_at = now()
  WHERE id = NEW.maid_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment coupon usage count
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coupon_code IS NOT NULL THEN
    UPDATE public.coupons
    SET 
      used_count = used_count + 1,
      updated_at = now()
    WHERE code = NEW.coupon_code AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update maid earnings on booking completion
CREATE OR REPLACE FUNCTION public.update_maid_earnings()
RETURNS TRIGGER AS $$
DECLARE
  maid_share numeric(10,2);
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.assigned_maid_id IS NOT NULL THEN
    -- Calculate maid share (70% of service price)
    maid_share := NEW.service_price * 0.70;
    
    -- Update maid earnings
    UPDATE public.maid_profiles
    SET 
      earnings_this_month = earnings_this_month + maid_share,
      total_earnings = total_earnings + maid_share,
      completed_jobs_count = completed_jobs_count + 1,
      updated_at = now()
    WHERE id = NEW.assigned_maid_id;
    
    -- Create payout record
    INSERT INTO public.payouts (maid_id, booking_id, amount, status)
    VALUES (NEW.assigned_maid_id, NEW.id, maid_share, 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update customer stats on booking completion
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.user_profiles
    SET 
      total_bookings = total_bookings + 1,
      total_spent = total_spent + NEW.total_amount,
      customer_type = CASE
        WHEN (total_bookings + 1) >= 10 THEN 'VIP Customer'
        WHEN (total_bookings + 1) >= 5 THEN 'Regular Customer'
        ELSE 'New Customer'
      END,
      updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add booking timeline entry
CREATE OR REPLACE FUNCTION public.add_booking_timeline_entry()
RETURNS TRIGGER AS $$
DECLARE
  timeline_entry jsonb;
BEGIN
  timeline_entry := jsonb_build_object(
    'status', NEW.status,
    'timestamp', now(),
    'note', CASE
      WHEN NEW.status = 'maid_assigned' THEN 'Cleaner assigned: ' || COALESCE(NEW.assigned_maid_name, 'Unknown')
      WHEN NEW.status = 'completed' THEN 'Service completed successfully'
      WHEN NEW.status = 'cancelled' THEN 'Booking cancelled: ' || COALESCE(NEW.cancellation_reason, 'No reason provided')
      ELSE 'Status updated'
    END
  );
  
  NEW.timeline_logs := COALESCE(NEW.timeline_logs, '[]'::jsonb) || timeline_entry;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- SECTION 4: TRIGGERS
-- ==============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_service_rating ON public.ratings;
DROP TRIGGER IF EXISTS trigger_update_maid_rating ON public.ratings;
DROP TRIGGER IF EXISTS trigger_increment_coupon_usage ON public.bookings;
DROP TRIGGER IF EXISTS trigger_update_maid_earnings ON public.bookings;
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON public.bookings;
DROP TRIGGER IF EXISTS trigger_add_booking_timeline ON public.bookings;

-- Create triggers
CREATE TRIGGER trigger_update_service_rating
  AFTER INSERT OR UPDATE OF rating, is_visible ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_rating_aggregate();

CREATE TRIGGER trigger_update_maid_rating
  AFTER INSERT OR UPDATE OF rating, is_visible ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_maid_rating_aggregate();

CREATE TRIGGER trigger_increment_coupon_usage
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.coupon_code IS NOT NULL)
  EXECUTE FUNCTION public.increment_coupon_usage();

CREATE TRIGGER trigger_update_maid_earnings
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION public.update_maid_earnings();

CREATE TRIGGER trigger_update_customer_stats
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION public.update_customer_stats();

CREATE TRIGGER trigger_add_booking_timeline
  BEFORE UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.add_booking_timeline_entry();

-- ==============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Service Categories: Public read for active, admin full control
DROP POLICY IF EXISTS "service_categories_public_read" ON public.service_categories;
CREATE POLICY "service_categories_public_read" ON public.service_categories
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "service_categories_admin_all" ON public.service_categories;
CREATE POLICY "service_categories_admin_all" ON public.service_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service Add-ons: Public read for active, admin full control
DROP POLICY IF EXISTS "service_addons_public_read" ON public.service_addons;
CREATE POLICY "service_addons_public_read" ON public.service_addons
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "service_addons_admin_all" ON public.service_addons;
CREATE POLICY "service_addons_admin_all" ON public.service_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service Packages: Public read for active, admin full control
DROP POLICY IF EXISTS "service_packages_public_read" ON public.service_packages;
CREATE POLICY "service_packages_public_read" ON public.service_packages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "service_packages_admin_all" ON public.service_packages;
CREATE POLICY "service_packages_admin_all" ON public.service_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Coupons: Public read for active and valid, admin full control
DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;
CREATE POLICY "coupons_public_read" ON public.coupons
  FOR SELECT USING (
    is_active = true 
    AND (valid_until IS NULL OR valid_until > now())
    AND used_count < usage_limit
  );

DROP POLICY IF EXISTS "coupons_admin_all" ON public.coupons;
CREATE POLICY "coupons_admin_all" ON public.coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Homepage Banners: Public read for active, admin full control
DROP POLICY IF EXISTS "homepage_banners_public_read" ON public.homepage_banners;
CREATE POLICY "homepage_banners_public_read" ON public.homepage_banners
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "homepage_banners_admin_all" ON public.homepage_banners;
CREATE POLICY "homepage_banners_admin_all" ON public.homepage_banners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service Areas: Public read for serviceable, admin full control
DROP POLICY IF EXISTS "service_areas_public_read" ON public.service_areas;
CREATE POLICY "service_areas_public_read" ON public.service_areas
  FOR SELECT USING (is_serviceable = true);

DROP POLICY IF EXISTS "service_areas_admin_all" ON public.service_areas;
CREATE POLICY "service_areas_admin_all" ON public.service_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Payouts: Maid can read own, admin full control
DROP POLICY IF EXISTS "payouts_maid_read" ON public.payouts;
CREATE POLICY "payouts_maid_read" ON public.payouts
  FOR SELECT USING (
    maid_id IN (
      SELECT id FROM public.maid_profiles WHERE id = auth.uid() OR user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "payouts_admin_all" ON public.payouts;
CREATE POLICY "payouts_admin_all" ON public.payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- SECTION 6: ENABLE REALTIME FOR CLIENT APPS
-- ==============================================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_categories;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_addons;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_packages;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.homepage_banners;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_areas;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ==============================================================================
-- SECTION 7: SEED DEFAULT DATA FOR TESTING
-- ==============================================================================

-- Insert default service categories (only if empty)
INSERT INTO public.service_categories (id, name, icon_name, bg_color, icon_color, route_category, display_order)
SELECT 
  gen_random_uuid(),
  'Home Cleaning',
  'home',
  '#EAF8F1',
  '#168A68',
  'home_cleaning',
  1
WHERE NOT EXISTS (SELECT 1 FROM public.service_categories LIMIT 1);

INSERT INTO public.service_categories (id, name, icon_name, bg_color, icon_color, route_category, display_order)
SELECT 
  gen_random_uuid(),
  'Deep Cleaning',
  'sparkles',
  '#FFF4E6',
  '#FF8C00',
  'deep_cleaning',
  2
WHERE NOT EXISTS (SELECT 1 FROM public.service_categories WHERE route_category = 'deep_cleaning');

INSERT INTO public.service_categories (id, name, icon_name, bg_color, icon_color, route_category, display_order)
SELECT 
  gen_random_uuid(),
  'Move In/Out',
  'truck',
  '#E6F3FF',
  '#0066CC',
  'move_in_out',
  3
WHERE NOT EXISTS (SELECT 1 FROM public.service_categories WHERE route_category = 'move_in_out');

-- Insert default service area (Bengaluru)
INSERT INTO public.service_areas (city, locality_name, pincode, is_serviceable)
SELECT 'Bengaluru', 'Koramangala', '560034', true
WHERE NOT EXISTS (SELECT 1 FROM public.service_areas WHERE pincode = '560034');

INSERT INTO public.service_areas (city, locality_name, pincode, is_serviceable)
SELECT 'Bengaluru', 'Indiranagar', '560038', true
WHERE NOT EXISTS (SELECT 1 FROM public.service_areas WHERE pincode = '560038');

INSERT INTO public.service_areas (city, locality_name, pincode, is_serviceable)
SELECT 'Bengaluru', 'Whitefield', '560066', true
WHERE NOT EXISTS (SELECT 1 FROM public.service_areas WHERE pincode = '560066');

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- All tables, indexes, functions, triggers, RLS policies created successfully.
-- The GC Home Plus ecosystem is now ready for full admin panel integration.
-- ==============================================================================
