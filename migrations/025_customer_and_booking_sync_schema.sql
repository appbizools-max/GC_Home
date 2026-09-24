-- ==============================================================================
-- GC HOME+ — MIGRATION 025: CUSTOMER & BOOKING REALTIME SYNC SCHEMA ALIGNMENT
-- ==============================================================================

-- 1. Align user_profiles schema
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz DEFAULT now();
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS total_bookings integer DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS total_spent numeric(10,2) DEFAULT 0;

-- Ensure role constraint or index
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 2. Relax foreign key constraints on bookings table for standalone client app users
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey1;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey2;

-- 3. Align bookings schema
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS admin_approval_status text DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assignment_status text DEFAULT 'unassigned';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS category_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS selected_addons jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS base_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS addon_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS lat numeric(10,7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS lng numeric(10,7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create helpful lookup indexes on bookings
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_admin_approval ON public.bookings(admin_approval_status);
CREATE INDEX IF NOT EXISTS idx_bookings_assignment_status ON public.bookings(assignment_status);

-- 4. Supabase Realtime Publication for client apps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Notice on publication setup: %', SQLERRM;
END $$;
