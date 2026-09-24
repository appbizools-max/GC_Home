-- 035_partner_services_relationship.sql
-- Create partner_services many-to-many relationship table between maid_profiles and services

CREATE TABLE IF NOT EXISTS public.partner_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  experience_years INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT partner_services_partner_service_unique UNIQUE (partner_id, service_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_services_partner_id ON public.partner_services(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_services_service_id ON public.partner_services(service_id);

-- Enable RLS
ALTER TABLE public.partner_services ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "partner_services_public_read" ON public.partner_services;
CREATE POLICY "partner_services_public_read" ON public.partner_services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "partner_services_insert_own" ON public.partner_services;
CREATE POLICY "partner_services_insert_own" ON public.partner_services
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "partner_services_delete_own" ON public.partner_services;
CREATE POLICY "partner_services_delete_own" ON public.partner_services
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "partner_services_admin_all" ON public.partner_services;
CREATE POLICY "partner_services_admin_all" ON public.partner_services
  FOR ALL USING (true);

-- Publication for Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'partner_services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_services;
  END IF;
END $$;
