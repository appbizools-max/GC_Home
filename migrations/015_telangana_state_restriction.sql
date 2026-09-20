-- ==============================================================================
-- GC HOME+ — MIGRATION 015: TELANGANA STATE RESTRICTION
-- ==============================================================================
-- This migration enforces the business rule that GC HOME+ operates ONLY in
-- Telangana state. All services, bookings, partners, and customers must be
-- within Telangana boundaries.
--
-- Geographic Scope:
-- - State: Telangana (India)
-- - Major Cities: Hyderabad, Warangal, Nizamabad, Khammam, Karimnagar, etc.
-- - Telangana Latitude Range: ~16.0°N to 19.9°N
-- - Telangana Longitude Range: ~77.2°E to 81.3°E
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: ADD STATE COLUMNS
-- ==============================================================================

-- Add state tracking to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_state text DEFAULT 'Telangana';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_city text;

-- Add state tracking to user profiles (customers)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS state text DEFAULT 'Telangana';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS city text;

-- Add state tracking to maid profiles (partners)
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_state text DEFAULT 'Telangana';
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_cities text[] DEFAULT '{Hyderabad}'; -- Cities they serve

-- Add state and locality tracking to service areas
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS state text DEFAULT 'Telangana';
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS locality_name text;
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS is_serviceable boolean DEFAULT true;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = 'service_areas' AND column_name = 'zone_name') THEN
    ALTER TABLE public.service_areas ALTER COLUMN zone_name DROP NOT NULL;
  END IF;
END $$;

-- Add state tracking to user addresses
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='saved_addresses') THEN
    ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS state text DEFAULT 'Telangana';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_addresses') THEN
    ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS state text DEFAULT 'Telangana';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='addresses') THEN
    ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS state text DEFAULT 'Telangana';
  END IF;
END $$;

-- ==============================================================================
-- SECTION 2: UPDATE & NORMALIZE EXISTING DATA
-- ==============================================================================

-- Set state to Telangana for existing bookings
UPDATE public.bookings SET service_state = 'Telangana' WHERE service_state != 'Telangana' OR service_state IS NULL;

-- Set state to Telangana for existing customers
UPDATE public.user_profiles SET state = 'Telangana' WHERE state != 'Telangana' OR state IS NULL;

-- Set state to Telangana for existing partners
UPDATE public.maid_profiles SET service_state = 'Telangana' WHERE service_state != 'Telangana' OR service_state IS NULL;

-- Set state to Telangana for existing service areas
UPDATE public.service_areas SET state = 'Telangana' WHERE state != 'Telangana' OR state IS NULL;

-- Set state to Telangana for existing addresses (safely)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='saved_addresses' AND table_type='BASE TABLE') THEN
    BEGIN
      UPDATE public.saved_addresses SET state = 'Telangana' WHERE state IS NULL OR state != 'Telangana';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='addresses' AND table_type='BASE TABLE') THEN
    BEGIN
      UPDATE public.addresses SET state = 'Telangana' WHERE state IS NULL OR state != 'Telangana';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

-- ==============================================================================
-- SECTION 3: STATE VALIDATION CONSTRAINTS
-- ==============================================================================

-- Ensure bookings are only in Telangana
DO $$ BEGIN
  ALTER TABLE public.bookings ADD CONSTRAINT telangana_bookings_only 
    CHECK (service_state = 'Telangana' OR service_state IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure customers are in Telangana
DO $$ BEGIN
  ALTER TABLE public.user_profiles ADD CONSTRAINT telangana_customers_only 
    CHECK (state = 'Telangana' OR state IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure partners operate only in Telangana
DO $$ BEGIN
  ALTER TABLE public.maid_profiles ADD CONSTRAINT telangana_partners_only 
    CHECK (service_state = 'Telangana' OR service_state IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure addresses are in Telangana
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='saved_addresses' AND table_type='BASE TABLE') THEN
    UPDATE public.saved_addresses SET state = 'Telangana' WHERE state IS NULL OR state != 'Telangana';
    ALTER TABLE public.saved_addresses ADD CONSTRAINT telangana_saved_addresses_only CHECK (state = 'Telangana' OR state IS NULL);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='addresses' AND table_type='BASE TABLE') THEN
    UPDATE public.addresses SET state = 'Telangana' WHERE state IS NULL OR state != 'Telangana';
    ALTER TABLE public.addresses ADD CONSTRAINT telangana_addresses_only CHECK (state = 'Telangana' OR state IS NULL);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- Update service_areas table to enforce Telangana only
DO $$ BEGIN
  ALTER TABLE public.service_areas ADD CONSTRAINT telangana_service_areas_only 
    CHECK (state = 'Telangana');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- SECTION 4: GEOGRAPHIC VALIDATION FUNCTION
-- ==============================================================================

-- Function to validate if coordinates are within Telangana boundaries
CREATE OR REPLACE FUNCTION public.is_within_telangana(
  p_latitude numeric,
  p_longitude numeric
)
RETURNS boolean AS $$
BEGIN
  -- Telangana approximate boundaries:
  -- Latitude: 16.0°N to 19.9°N
  -- Longitude: 77.2°E to 81.3°E
  
  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if coordinates fall within Telangana bounding box
  IF p_latitude >= 16.0 AND p_latitude <= 19.9 AND
     p_longitude >= 77.2 AND p_longitude <= 81.3 THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================================================
-- SECTION 5: BOOKING LOCATION VALIDATION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.validate_booking_location_telangana()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if coordinates are provided
  IF NEW.service_location_lat IS NOT NULL AND NEW.service_location_lng IS NOT NULL THEN
    IF NOT public.is_within_telangana(NEW.service_location_lat, NEW.service_location_lng) THEN
      RAISE EXCEPTION 'Service location must be within Telangana state. GC HOME+ currently operates only in Telangana.';
    END IF;
  END IF;
  
  -- Ensure state is Telangana
  IF NEW.service_state IS NOT NULL AND NEW.service_state != 'Telangana' THEN
    RAISE EXCEPTION 'GC HOME+ services are available only in Telangana state.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_booking_location ON public.bookings;
CREATE TRIGGER trigger_validate_booking_location
  BEFORE INSERT OR UPDATE OF service_location_lat, service_location_lng, service_state ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_location_telangana();

-- ==============================================================================
-- SECTION 6: PARTNER LOCATION VALIDATION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.validate_partner_location_telangana()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate partner's current location
  IF NEW.last_location_lat IS NOT NULL AND NEW.last_location_lng IS NOT NULL THEN
    IF NOT public.is_within_telangana(NEW.last_location_lat, NEW.last_location_lng) THEN
      RAISE EXCEPTION 'Partner location must be within Telangana state. GC HOME+ operates only in Telangana.';
    END IF;
  END IF;
  
  -- Ensure service state is Telangana
  IF NEW.service_state IS NOT NULL AND NEW.service_state != 'Telangana' THEN
    RAISE EXCEPTION 'Partners can only serve in Telangana state.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_partner_location ON public.maid_profiles;
CREATE TRIGGER trigger_validate_partner_location
  BEFORE INSERT OR UPDATE OF last_location_lat, last_location_lng, service_state ON public.maid_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_partner_location_telangana();

-- ==============================================================================
-- SECTION 7: SEED TELANGANA SERVICE AREAS
-- ==============================================================================

-- Insert major cities and localities in Telangana
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_areas' AND column_name = 'zone_name') THEN
    INSERT INTO public.service_areas (state, city, locality_name, zone_name, pincode, is_serviceable) VALUES
    ('Telangana', 'Hyderabad', 'Banjara Hills', 'Banjara Hills', '500034', true),
    ('Telangana', 'Hyderabad', 'Jubilee Hills', 'Jubilee Hills', '500033', true),
    ('Telangana', 'Hyderabad', 'Madhapur', 'Madhapur', '500081', true),
    ('Telangana', 'Hyderabad', 'Gachibowli', 'Gachibowli', '500032', true),
    ('Telangana', 'Hyderabad', 'Kondapur', 'Kondapur', '500084', true),
    ('Telangana', 'Hyderabad', 'Hitech City', 'Hitech City', '500081', true),
    ('Telangana', 'Hyderabad', 'Kukatpally', 'Kukatpally', '500072', true),
    ('Telangana', 'Hyderabad', 'Miyapur', 'Miyapur', '500049', true),
    ('Telangana', 'Hyderabad', 'Ameerpet', 'Ameerpet', '500016', true),
    ('Telangana', 'Hyderabad', 'Begumpet', 'Begumpet', '500016', true),
    ('Telangana', 'Hyderabad', 'Secunderabad', 'Secunderabad', '500003', true),
    ('Telangana', 'Hyderabad', 'Dilsukhnagar', 'Dilsukhnagar', '500060', true),
    ('Telangana', 'Hyderabad', 'LB Nagar', 'LB Nagar', '500074', true),
    ('Telangana', 'Hyderabad', 'Uppal', 'Uppal', '500039', true),
    ('Telangana', 'Hyderabad', 'Kompally', 'Kompally', '500014', true),
    ('Telangana', 'Hyderabad', 'Miyapur', 'Miyapur', '500090', true),
    ('Telangana', 'Hyderabad', 'Nizampet', 'Nizampet', '500090', true),
    ('Telangana', 'Hyderabad', 'Manikonda', 'Manikonda', '500089', true),
    ('Telangana', 'Hyderabad', 'Financial District', 'Financial District', '500032', true),
    ('Telangana', 'Hyderabad', 'KPHB Colony', 'KPHB Colony', '500072', true),
    ('Telangana', 'Warangal', 'Hanamkonda', 'Hanamkonda', '506001', true),
    ('Telangana', 'Warangal', 'Kazipet', 'Kazipet', '506003', true),
    ('Telangana', 'Nizamabad', 'City Center', 'City Center', '503001', true),
    ('Telangana', 'Khammam', 'City Center', 'City Center', '507001', true),
    ('Telangana', 'Karimnagar', 'City Center', 'City Center', '505001', true),
    ('Telangana', 'Ramagundam', 'NTPC Township', 'NTPC Township', '505209', true),
    ('Telangana', 'Mahbubnagar', 'City Center', 'City Center', '509001', true),
    ('Telangana', 'Nalgonda', 'City Center', 'City Center', '508001', true),
    ('Telangana', 'Adilabad', 'City Center', 'City Center', '504001', true),
    ('Telangana', 'Suryapet', 'City Center', 'City Center', '508213', true)
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.service_areas (state, city, locality_name, pincode, is_serviceable) VALUES
    ('Telangana', 'Hyderabad', 'Banjara Hills', '500034', true),
    ('Telangana', 'Hyderabad', 'Jubilee Hills', '500033', true),
    ('Telangana', 'Hyderabad', 'Madhapur', '500081', true),
    ('Telangana', 'Hyderabad', 'Gachibowli', '500032', true),
    ('Telangana', 'Hyderabad', 'Kondapur', '500084', true),
    ('Telangana', 'Hyderabad', 'Hitech City', '500081', true),
    ('Telangana', 'Hyderabad', 'Kukatpally', '500072', true),
    ('Telangana', 'Hyderabad', 'Miyapur', '500049', true),
    ('Telangana', 'Hyderabad', 'Ameerpet', '500016', true),
    ('Telangana', 'Hyderabad', 'Begumpet', '500016', true),
    ('Telangana', 'Hyderabad', 'Secunderabad', '500003', true),
    ('Telangana', 'Hyderabad', 'Dilsukhnagar', '500060', true),
    ('Telangana', 'Hyderabad', 'LB Nagar', '500074', true),
    ('Telangana', 'Hyderabad', 'Uppal', '500039', true),
    ('Telangana', 'Hyderabad', 'Kompally', '500014', true),
    ('Telangana', 'Hyderabad', 'Miyapur', '500090', true),
    ('Telangana', 'Hyderabad', 'Nizampet', '500090', true),
    ('Telangana', 'Hyderabad', 'Manikonda', '500089', true),
    ('Telangana', 'Hyderabad', 'Financial District', '500032', true),
    ('Telangana', 'Hyderabad', 'KPHB Colony', '500072', true),
    ('Telangana', 'Warangal', 'Hanamkonda', '506001', true),
    ('Telangana', 'Warangal', 'Kazipet', '506003', true),
    ('Telangana', 'Nizamabad', 'City Center', '503001', true),
    ('Telangana', 'Khammam', 'City Center', '507001', true),
    ('Telangana', 'Karimnagar', 'City Center', '505001', true),
    ('Telangana', 'Ramagundam', 'NTPC Township', '505209', true),
    ('Telangana', 'Mahbubnagar', 'City Center', '509001', true),
    ('Telangana', 'Nalgonda', 'City Center', '508001', true),
    ('Telangana', 'Adilabad', 'City Center', '504001', true),
    ('Telangana', 'Suryapet', 'City Center', '508213', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ==============================================================================
-- SECTION 8: UPDATE PLATFORM SETTINGS
-- ==============================================================================

-- Add Telangana-specific platform settings dynamically based on schema
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_settings' AND column_name = 'setting_key') THEN
    INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description, category, is_active)
    VALUES 
    ('operating_state', 'Telangana', 'text', 'The state where GC HOME+ operates', 'geographic', true),
    ('service_cities', '["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar"]', 'json', 'Major cities where service is available', 'geographic', true),
    ('telangana_min_lat', '16.0', 'number', 'Minimum latitude for Telangana', 'geographic', true),
    ('telangana_max_lat', '19.9', 'number', 'Maximum latitude for Telangana', 'geographic', true),
    ('telangana_min_lng', '77.2', 'number', 'Minimum longitude for Telangana', 'geographic', true),
    ('telangana_max_lng', '81.3', 'number', 'Maximum longitude for Telangana', 'geographic', true),
    ('primary_service_city', 'Hyderabad', 'text', 'Primary city for operations', 'geographic', true)
    ON CONFLICT (setting_key) DO UPDATE SET
      setting_value = EXCLUDED.setting_value,
      updated_at = now();
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_settings' AND column_name = 'key') THEN
    INSERT INTO public.platform_settings (key, value, description)
    VALUES 
    ('operating_state', 'Telangana', 'The state where GC HOME+ operates'),
    ('service_cities', '["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar"]', 'Major cities where service is available'),
    ('telangana_min_lat', '16.0', 'Minimum latitude for Telangana'),
    ('telangana_max_lat', '19.9', 'Maximum latitude for Telangana'),
    ('telangana_min_lng', '77.2', 'Minimum longitude for Telangana'),
    ('telangana_max_lng', '81.3', 'Maximum longitude for Telangana'),
    ('primary_service_city', 'Hyderabad', 'Primary city for operations')
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = now();
  ELSE
    CREATE TABLE IF NOT EXISTS public.platform_settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      key text UNIQUE,
      value text,
      description text,
      updated_at timestamptz DEFAULT now()
    );
    INSERT INTO public.platform_settings (key, value, description)
    VALUES 
    ('operating_state', 'Telangana', 'The state where GC HOME+ operates'),
    ('service_cities', '["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar"]', 'Major cities where service is available'),
    ('telangana_min_lat', '16.0', 'Minimum latitude for Telangana'),
    ('telangana_max_lat', '19.9', 'Maximum latitude for Telangana'),
    ('telangana_min_lng', '77.2', 'Minimum longitude for Telangana'),
    ('telangana_max_lng', '81.3', 'Maximum longitude for Telangana'),
    ('primary_service_city', 'Hyderabad', 'Primary city for operations')
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = now();
  END IF;
END $$;

-- ==============================================================================
-- SECTION 9: INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_state ON public.bookings(service_state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON public.user_profiles(state);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_state ON public.maid_profiles(service_state);
CREATE INDEX IF NOT EXISTS idx_service_areas_state_city ON public.service_areas(state, city);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='saved_addresses') THEN
    CREATE INDEX IF NOT EXISTS idx_saved_addresses_state ON public.saved_addresses(state);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_addresses') THEN
    CREATE INDEX IF NOT EXISTS idx_user_addresses_state ON public.user_addresses(state);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='addresses') THEN
    CREATE INDEX IF NOT EXISTS idx_addresses_state ON public.addresses(state);
  END IF;
END $$;

-- ==============================================================================
-- SECTION 10: COMMENTS FOR DOCUMENTATION
-- ==============================================================================

COMMENT ON COLUMN public.bookings.service_state IS 'Service state - must be Telangana (enforced by constraint)';
COMMENT ON COLUMN public.user_profiles.state IS 'Customer state - must be Telangana (enforced by constraint)';
COMMENT ON COLUMN public.maid_profiles.service_state IS 'Partner operating state - must be Telangana (enforced by constraint)';
COMMENT ON FUNCTION public.is_within_telangana IS 'Validates if given coordinates fall within Telangana state boundaries';
COMMENT ON FUNCTION public.validate_booking_location_telangana IS 'Trigger function to ensure booking locations are within Telangana';
COMMENT ON FUNCTION public.validate_partner_location_telangana IS 'Trigger function to ensure partner locations are within Telangana';

-- ==============================================================================
-- END OF MIGRATION 015
-- ==============================================================================

-- VERIFICATION QUERIES (for admin use):
-- 
-- -- Check bookings outside Telangana (should return 0 rows):
-- SELECT * FROM public.bookings WHERE service_state != 'Telangana' AND service_state IS NOT NULL;
-- 
-- -- Check partners outside Telangana (should return 0 rows):
-- SELECT * FROM public.maid_profiles WHERE service_state != 'Telangana' AND service_state IS NOT NULL;
-- 
-- -- Check customers outside Telangana (should return 0 rows):
-- SELECT * FROM public.user_profiles WHERE state != 'Telangana' AND state IS NOT NULL;
-- 
-- -- List all serviceable areas:
-- SELECT city, locality_name, pincode FROM public.service_areas WHERE is_serviceable = true ORDER BY city, locality_name;
