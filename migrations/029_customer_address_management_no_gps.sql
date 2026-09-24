-- ==============================================================================
-- GC HOME+ — MIGRATION 029: CUSTOMER ADDRESS MANAGEMENT (NO GPS / TEXT-BASED)
-- ==============================================================================

-- 1. Ensure saved_addresses table columns exist without requiring GPS coordinates
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS house_flat text;
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS locality text;
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS city text DEFAULT 'Hyderabad';
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS state text DEFAULT 'Telangana';
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS pincode text DEFAULT '500081';
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
ALTER TABLE public.saved_addresses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Index user_id on saved_addresses
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_is_default ON public.saved_addresses(user_id, is_default);

-- 3. Enable RLS and verify policies for saved_addresses
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select saved_addresses" ON public.saved_addresses;
CREATE POLICY "Public select saved_addresses" ON public.saved_addresses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert saved_addresses" ON public.saved_addresses;
CREATE POLICY "Public insert saved_addresses" ON public.saved_addresses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update saved_addresses" ON public.saved_addresses;
CREATE POLICY "Public update saved_addresses" ON public.saved_addresses FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete saved_addresses" ON public.saved_addresses;
CREATE POLICY "Public delete saved_addresses" ON public.saved_addresses FOR DELETE USING (true);
