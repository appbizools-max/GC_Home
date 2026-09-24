-- ==============================================================================
-- GC HOME+ — MIGRATION 030: MULTI-SERVICE BOOKING FLOW & BOOKING ITEMS SCHEMA
-- ==============================================================================

-- 1. Create booking_items table for multi-service cart orders
CREATE TABLE IF NOT EXISTS public.booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id ON public.booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_service_id ON public.add_ons(service_id);

-- 3. Enable RLS and verify policies for booking_items
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select booking_items" ON public.booking_items;
CREATE POLICY "Public select booking_items" ON public.booking_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert booking_items" ON public.booking_items;
CREATE POLICY "Public insert booking_items" ON public.booking_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update booking_items" ON public.booking_items;
CREATE POLICY "Public update booking_items" ON public.booking_items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete booking_items" ON public.booking_items;
CREATE POLICY "Public delete booking_items" ON public.booking_items FOR DELETE USING (true);
