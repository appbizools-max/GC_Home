-- ============================================================
-- FILE: migrations/001_phase1_foundation.sql
-- Idempotent: safe to run multiple times
-- ============================================================

-- -------------------------
-- STEP 1: Enums
-- -------------------------
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending_assignment', 'maid_assigned', 'maid_accepted',
    'en_route', 'arrived', 'cleaning_started', 'in_progress',
    'completed', 'cancelled', 'rescheduled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE maid_application_status AS ENUM ('none','pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_doc_type AS ENUM (
    'aadhaar','pan','address_proof','police_verification','bank_passbook','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_doc_status AS ENUM (
    'verified','under_review','pending','rejected','not_submitted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM (
    'upi','card','cash','pay_on_completion','online'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('pending','paid','refunded','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('sent','accepted','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending','processing','paid','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM (
    'booking','dispatch','maid','payment','system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -------------------------
-- STEP 2: Sequences
-- -------------------------
CREATE SEQUENCE IF NOT EXISTS maid_code_seq START 1;

-- -------------------------
-- STEP 3A: user_profiles
-- -------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text NOT NULL DEFAULT '',
  phone                 text UNIQUE,
  email                 text,
  role                  text NOT NULL DEFAULT 'customer',
  maid_application_status maid_application_status NOT NULL DEFAULT 'none',
  fcm_token             text,
  customer_type         text NOT NULL DEFAULT 'Regular Customer',
  profile_photo_url     text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS maid_application_status maid_application_status NOT NULL DEFAULT 'none';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS fcm_token text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'Regular Customer';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Drop NOT NULL constraint on any legacy column in user_profiles not in foundation schema
DO $$
DECLARE
  col text;
BEGIN
  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name NOT IN ('id', 'name', 'role', 'maid_application_status', 'customer_type', 'created_at', 'updated_at')
      AND is_nullable = 'NO'
  LOOP
    EXECUTE format('ALTER TABLE public.user_profiles ALTER COLUMN %I DROP NOT NULL', col);
  END LOOP;
END $$;

-- -------------------------
-- STEP 3B: admin_users
-- -------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text UNIQUE NOT NULL,
  name       text,
  role       text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- -------------------------
-- STEP 3C: services
-- -------------------------
CREATE TABLE IF NOT EXISTS services (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  category           text NOT NULL DEFAULT 'Standard',
  description        text,
  starting_price     integer NOT NULL DEFAULT 0,
  price_per_room     integer,
  estimated_duration text,
  image_url          text,
  is_active          boolean NOT NULL DEFAULT true,
  features           text[] NOT NULL DEFAULT '{}',
  display_order      integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Ensure all columns exist on pre-existing services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Standard';
ALTER TABLE services ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS starting_price integer NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_per_room integer;
ALTER TABLE services ADD COLUMN IF NOT EXISTS estimated_duration text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- If features was pre-created as jsonb/json, convert/recreate it to text[]
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services'
      AND column_name = 'features'
      AND data_type != 'ARRAY'
  ) THEN
    ALTER TABLE services DROP COLUMN features CASCADE;
    ALTER TABLE services ADD COLUMN features text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- Drop NOT NULL constraint on any legacy column in services that is not in the foundation schema
DO $$
DECLARE
  col text;
BEGIN
  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services'
      AND column_name NOT IN ('id', 'name', 'category', 'starting_price', 'is_active', 'features', 'display_order', 'created_at', 'updated_at')
      AND is_nullable = 'NO'
  LOOP
    EXECUTE format('ALTER TABLE public.services ALTER COLUMN %I DROP NOT NULL', col);
  END LOOP;
END $$;

-- If legacy base_price or price exists, set default and sync with starting_price
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'base_price'
  ) THEN
    ALTER TABLE public.services ALTER COLUMN base_price SET DEFAULT 0;
    UPDATE public.services SET base_price = starting_price WHERE base_price IS NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'price'
  ) THEN
    ALTER TABLE public.services ALTER COLUMN price SET DEFAULT 0;
    UPDATE public.services SET starting_price = price WHERE (starting_price = 0 OR starting_price IS NULL) AND price IS NOT NULL;
  END IF;
END $$;

-- -------------------------
-- STEP 4: maid_profiles
-- -------------------------
CREATE TABLE IF NOT EXISTS maid_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maid_code           text UNIQUE DEFAULT ('MD' || lpad(nextval('maid_code_seq')::text, 3, '0')),
  -- Identity
  full_name           text NOT NULL DEFAULT '',
  phone               text,
  email               text,
  date_of_birth       date,
  gender              text,
  photo_url           text,
  id_proof_url        text,
  emergency_contact   text,
  -- Location
  address             text,
  city                text DEFAULT 'Hyderabad',
  service_area        text,
  service_radius_km   integer DEFAULT 5,
  -- Status & KYC
  status              maid_application_status NOT NULL DEFAULT 'pending',
  kyc_status          text DEFAULT 'pending',
  kyc_completion_pct  integer DEFAULT 0,
  kyc_documents       jsonb DEFAULT '[]',
  rejection_reason    text,
  rejected_by         text,
  rejected_at         timestamptz,
  applied_at          timestamptz DEFAULT now(),
  approved_at         timestamptz,
  -- Operations
  is_online           boolean NOT NULL DEFAULT false,
  rating              numeric(3,2) DEFAULT 0,
  total_ratings_count integer DEFAULT 0,
  completed_jobs_count integer DEFAULT 0,
  working_days        text[] DEFAULT '{}',
  skills              text[] DEFAULT '{}',
  preferred_areas     text[] DEFAULT '{}',
  languages           text[] DEFAULT '{}',
  last_active         timestamptz,
  -- Financials
  bank_account_name   text,
  bank_account_number text,
  bank_ifsc           text,
  bank_name           text,
  earnings_this_month integer DEFAULT 0,
  total_earnings      integer DEFAULT 0,
  -- Metadata
  health_safety_decl  boolean DEFAULT false,
  admin_notes         text,
  age                 integer,
  experience          text,
  quote               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE maid_profiles DROP CONSTRAINT IF EXISTS maid_profiles_id_fkey;

ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS maid_code text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS id_proof_url text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS city text DEFAULT 'Hyderabad';
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS service_area text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS service_radius_km integer DEFAULT 5;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS status maid_application_status NOT NULL DEFAULT 'pending';
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'pending';
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS kyc_completion_pct integer DEFAULT 0;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS kyc_documents jsonb DEFAULT '[]';
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS rejected_by text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now();
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS total_ratings_count integer DEFAULT 0;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS completed_jobs_count integer DEFAULT 0;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS working_days text[] DEFAULT '{}';
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS preferred_areas text[] DEFAULT '{}';
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS last_active timestamptz;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS bank_account_name text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS bank_ifsc text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS earnings_this_month integer DEFAULT 0;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS total_earnings integer DEFAULT 0;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS health_safety_decl boolean DEFAULT false;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS experience text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS quote text;
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- -------------------------
-- STEP 5: bookings
-- -------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code          text UNIQUE NOT NULL,  -- GC-YYYYMMDD-NNN
  -- Customer
  customer_id           uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  customer_name         text NOT NULL DEFAULT '',
  customer_phone        text,
  customer_email        text,
  -- Service
  service_id            uuid REFERENCES services(id) ON DELETE SET NULL,
  service_name          text,
  service_price         integer,
  total_amount          integer,
  service_duration      text,
  -- Address (normalized)
  address_label         text DEFAULT 'Home',
  address_street        text,
  address_locality      text,
  address_city          text,
  address_pincode       text,
  -- Scheduling
  scheduled_date        date NOT NULL,
  time_slot             text NOT NULL DEFAULT '10:00 AM',
  special_instructions  text,
  -- Status & Payment
  status                booking_status NOT NULL DEFAULT 'pending_assignment',
  payment_method        payment_method_enum,
  payment_status        payment_status_enum DEFAULT 'pending',
  transaction_id        text,
  paid_at               timestamptz,
  -- Assignment
  assigned_maid_id      uuid REFERENCES maid_profiles(id) ON DELETE SET NULL,
  assigned_maid_name    text,
  assigned_maid_phone   text,
  assigned_maid_photo_url text,
  assigned_maid_rating  numeric(3,2),
  -- Lifecycle
  start_otp             text,
  started_at            timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  cancellation_reason   text,
  cancelled_by          text,
  reschedule_reason     text,
  rescheduled_from      date,
  rescheduled_to        date,
  rescheduled_by        text,
  -- Audit
  timeline_logs         jsonb DEFAULT '[]',
  before_photo_url      text,
  after_photo_url       text,
  customer_rating       integer,
  customer_review       text,
  reviewed_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_code text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name text NOT NULL DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id uuid;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_price integer;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount integer;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_duration text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_label text DEFAULT 'Home';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_street text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_locality text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_city text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_pincode text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_date date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_slot text DEFAULT '10:00 AM';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_instructions text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status booking_status DEFAULT 'pending_assignment';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method payment_method_enum;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transaction_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_maid_id uuid;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_maid_name text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_maid_phone text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_maid_photo_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_maid_rating numeric(3,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_otp text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_reason text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduled_from date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduled_to date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduled_by text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS timeline_logs jsonb DEFAULT '[]';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS before_photo_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS after_photo_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_rating integer;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_review text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- -------------------------
-- STEP 6: saved_addresses
-- -------------------------
CREATE TABLE IF NOT EXISTS saved_addresses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  label      text NOT NULL DEFAULT 'Home',
  street     text,
  locality   text,
  city       text,
  pincode    text,
  landmark   text,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS label text NOT NULL DEFAULT 'Home';
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS locality text;
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();


-- -------------------------
-- STEP 7: Trigger Functions
-- -------------------------

-- 7a: update_updated_at (generic)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all relevant tables
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_maid_profiles_updated_at ON maid_profiles;
CREATE TRIGGER trg_maid_profiles_updated_at
  BEFORE UPDATE ON maid_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7b: handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
CREATE TRIGGER trg_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7c: on_maid_approved
CREATE OR REPLACE FUNCTION on_maid_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE user_profiles
    SET role = 'maid',
        maid_application_status = 'approved',
        updated_at = now()
    WHERE id = NEW.id;
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    UPDATE user_profiles
    SET maid_application_status = 'rejected',
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_maid_approved ON maid_profiles;
CREATE TRIGGER trg_on_maid_approved
  AFTER UPDATE ON maid_profiles
  FOR EACH ROW EXECUTE FUNCTION on_maid_approved();

-- -------------------------
-- STEP 8: RLS (Row Level Security)
-- -------------------------

-- 8a: user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- 8b: admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view own record" ON admin_users;
CREATE POLICY "Admins can view own record"
  ON admin_users FOR SELECT
  USING (auth.uid() = id);

-- 8c: services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can view active services" ON services;
CREATE POLICY "Anon can view active services"
  ON services FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can view all services" ON services;
CREATE POLICY "Authenticated can view all services"
  ON services FOR SELECT
  TO authenticated
  USING (true);

-- 8d: maid_profiles
ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Maid can view own profile" ON maid_profiles;
CREATE POLICY "Maid can view own profile"
  ON maid_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Maid can update own operational fields" ON maid_profiles;
CREATE POLICY "Maid can update own operational fields"
  ON maid_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all maid profiles" ON maid_profiles;
CREATE POLICY "Admins can view all maid profiles"
  ON maid_profiles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update maid profiles" ON maid_profiles;
CREATE POLICY "Admins can update maid profiles"
  ON maid_profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- 8e: bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own bookings" ON bookings;
CREATE POLICY "Customers can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can create bookings" ON bookings;
CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Assigned maid can view their bookings" ON bookings;
CREATE POLICY "Assigned maid can view their bookings"
  ON bookings FOR SELECT
  USING (assigned_maid_id = (
    SELECT id FROM maid_profiles WHERE id = auth.uid() LIMIT 1
  ));

DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- 8f: saved_addresses
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own addresses" ON saved_addresses;
CREATE POLICY "Users can manage own addresses"
  ON saved_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------
-- STEP 9: Services Seed Data
-- -------------------------
INSERT INTO services (name, category, description, starting_price, price_per_room, estimated_duration, image_url, is_active, features, display_order)
SELECT
  s.name, s.category, s.description, s.starting_price, s.price_per_room, s.estimated_duration, s.image_url, s.is_active, s.features, s.display_order
FROM (VALUES
  ('Home Cleaning (2 BHK)', 'Standard', 'Essential dusting, floor sweeping & mopping, trash disposal, and surface wiping.', 799, 200, '3 Hours', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600', true, ARRAY['Sweeping & Mopping','Dusting','Trash removal','Basic bathroom wipe'], 1),
  ('Deep Cleaning', 'Premium', 'Comprehensive chemical scrubbing, heavy appliance exterior degreasing, furniture vacuuming.', 1299, 350, '4 Hours', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600', true, ARRAY['Tile scrubbing','Kitchen degreasing','Window glass polish','Upholstery vacuuming'], 2),
  ('Bathroom Cleaning', 'Specialized', 'Specialized hard water stain removal, shower partition glass polishing, and floor tile scrubbing.', 499, NULL, '1.5 Hours', 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=600', true, ARRAY['Hard water scale removal','Mirror & glass polish','Grout line disinfection'], 3),
  ('Sofa Cleaning', 'Specialized', 'Deep foam shampooing and extraction vacuuming for fabric and leather sofas.', 699, NULL, '2 Hours', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600', true, ARRAY['Fabric shampooing','Stain removal','Bactericidal treatment'], 4),
  ('Kitchen Cleaning', 'Specialized', 'Full kitchen oil stain degreasing, chimney exterior wipe, counter tile scrub.', 599, NULL, '2 Hours', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600', true, ARRAY['Chimney degrease','Cabinet wipe down','Sink sanitation'], 5)
) AS s(name, category, description, starting_price, price_per_room, estimated_duration, image_url, is_active, features, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE services.name = s.name
);

