-- ==============================================================================
-- GC HOME+ MIGRATION 041: SERVICE AREAS UNIQUE CONSTRAINT & DUPLICATE PREVENTION
-- ==============================================================================
-- Ensures that duplicate service areas (same City + Locality + Pincode) cannot
-- be inserted into the public.service_areas table.
-- ==============================================================================

-- 1. Create a unique index on lowercase city, lowercase locality_name, and pincode
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_areas_city_locality_pincode
ON public.service_areas (
  lower(trim(city)),
  lower(trim(COALESCE(locality_name, locality, zone_name))),
  trim(pincode)
);

-- 2. Verify state default is Telangana
ALTER TABLE public.service_areas 
ALTER COLUMN state SET DEFAULT 'Telangana';

-- 3. Verify comments
COMMENT ON INDEX uq_service_areas_city_locality_pincode IS 
'Guarantees zero duplicate records for City + Locality + Pincode combinations across GC HOME+ Telangana operations.';
