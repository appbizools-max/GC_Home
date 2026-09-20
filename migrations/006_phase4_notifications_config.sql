-- ============================================================
-- FILE: migrations/006_phase4_notifications_config.sql
-- Purpose: Phase 4 Notifications, Configuration & Operational Support
-- Tables: notifications, fcm_device_tokens, platform_settings,
--         service_areas, customer_notes, maid_availability_schedule,
--         booking_photos, reports_cache
-- Seed data: platform_settings, service_areas
-- Idempotent: safe to run multiple times
-- ============================================================

-- -------------------------
-- STEP 1: Tables
-- -------------------------

-- 1.1 notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id        uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  recipient_role      text NOT NULL DEFAULT 'all',
  title               text NOT NULL DEFAULT '',
  message             text NOT NULL DEFAULT '',
  category            notification_category NOT NULL DEFAULT 'system',
  link_tab            text,
  related_booking_id  uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  is_read             boolean NOT NULL DEFAULT false,
  is_pushed           boolean NOT NULL DEFAULT false,
  push_sent_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_role text DEFAULT 'all';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category notification_category DEFAULT 'system';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link_tab text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_booking_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_pushed boolean DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 1.2 fcm_device_tokens
CREATE TABLE IF NOT EXISTS public.fcm_device_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  token         text UNIQUE NOT NULL,
  platform      text NOT NULL DEFAULT 'web',
  is_active     boolean NOT NULL DEFAULT true,
  last_used_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fcm_device_tokens ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.fcm_device_tokens ADD COLUMN IF NOT EXISTS token text;
ALTER TABLE public.fcm_device_tokens ADD COLUMN IF NOT EXISTS platform text DEFAULT 'web';
ALTER TABLE public.fcm_device_tokens ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.fcm_device_tokens ADD COLUMN IF NOT EXISTS last_used_at timestamptz DEFAULT now();
ALTER TABLE public.fcm_device_tokens ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_device_tokens(user_id);

-- 1.3 platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  description text,
  updated_by  uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS value text;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 1.4 service_areas
CREATE TABLE IF NOT EXISTS public.service_areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city        text NOT NULL,
  zone_name   text NOT NULL,
  timezone    text NOT NULL DEFAULT 'Asia/Kolkata',
  is_active   boolean NOT NULL DEFAULT true,
  lat         numeric(10,7),
  lng         numeric(10,7),
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS zone_name text;
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kolkata';
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS lat numeric(10,7);
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS lng numeric(10,7);
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_service_areas_city ON public.service_areas(city);

-- 1.5 customer_notes
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  note              text NOT NULL,
  created_by        uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_by_name   text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_notes ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.customer_notes ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.customer_notes ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.customer_notes ADD COLUMN IF NOT EXISTS created_by_name text;
ALTER TABLE public.customer_notes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON public.customer_notes(customer_id);

-- 1.6 maid_availability_schedule
CREATE TABLE IF NOT EXISTS public.maid_availability_schedule (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maid_id     uuid NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maid_availability_schedule ADD COLUMN IF NOT EXISTS maid_id uuid;
ALTER TABLE public.maid_availability_schedule ADD COLUMN IF NOT EXISTS day_of_week smallint;
ALTER TABLE public.maid_availability_schedule ADD COLUMN IF NOT EXISTS start_time time;
ALTER TABLE public.maid_availability_schedule ADD COLUMN IF NOT EXISTS end_time time;
ALTER TABLE public.maid_availability_schedule ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.maid_availability_schedule ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_maid_sched_maid_id ON public.maid_availability_schedule(maid_id);

-- 1.7 booking_photos
CREATE TABLE IF NOT EXISTS public.booking_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  photo_type  text NOT NULL CHECK (photo_type IN ('before', 'after')),
  file_url    text NOT NULL,
  label       text,
  uploaded_by uuid REFERENCES public.maid_profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_photos ADD COLUMN IF NOT EXISTS booking_id uuid;
ALTER TABLE public.booking_photos ADD COLUMN IF NOT EXISTS photo_type text;
ALTER TABLE public.booking_photos ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.booking_photos ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.booking_photos ADD COLUMN IF NOT EXISTS uploaded_by uuid;
ALTER TABLE public.booking_photos ADD COLUMN IF NOT EXISTS uploaded_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_booking_photos_booking ON public.booking_photos(booking_id);

-- 1.8 reports_cache
CREATE TABLE IF NOT EXISTS public.reports_cache (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type   text NOT NULL,
  period        date NOT NULL,
  payload       jsonb NOT NULL,
  generated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports_cache ADD COLUMN IF NOT EXISTS report_type text;
ALTER TABLE public.reports_cache ADD COLUMN IF NOT EXISTS period date;
ALTER TABLE public.reports_cache ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE public.reports_cache ADD COLUMN IF NOT EXISTS generated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_reports_cache_type_period ON public.reports_cache(report_type, period);

-- -------------------------
-- STEP 2: Default Seeds
-- -------------------------

INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('default_radius_km', '7', 'Default service radius in kilometers for auto-dispatch matching'),
  ('platform_commission_pct', '20', 'Default platform commission cut percentage on bookings'),
  ('assignment_timeout_mins', '10', 'Response timeout in minutes before reassigning a booking to the next maid')
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description;

INSERT INTO public.service_areas (city, zone_name, lat, lng, sort_order)
VALUES
  ('Hyderabad', 'Kondapur', 17.4699, 78.3578, 1),
  ('Hyderabad', 'Gachibowli', 17.4401, 78.3489, 2),
  ('Hyderabad', 'Madhapur', 17.4483, 78.3915, 3),
  ('Hyderabad', 'Banjara Hills', 17.4156, 78.4354, 4),
  ('Hyderabad', 'Jubilee Hills', 17.4319, 78.4073, 5),
  ('Hyderabad', 'Hitec City', 17.4435, 78.3772, 6)
ON CONFLICT DO NOTHING;

-- -------------------------
-- STEP 3: Row-Level Security
-- -------------------------

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maid_availability_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_cache ENABLE ROW LEVEL SECURITY;

-- 3.1 notifications policies
DROP POLICY IF EXISTS "Users can view own notifications or broadcasts" ON public.notifications;
CREATE POLICY "Users can view own notifications or broadcasts"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid() OR recipient_id IS NULL);

DROP POLICY IF EXISTS "Users can update own notification read state" ON public.notifications;
CREATE POLICY "Users can update own notification read state"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 3.2 fcm_device_tokens policies
DROP POLICY IF EXISTS "Users can manage own tokens" ON public.fcm_device_tokens;
CREATE POLICY "Users can manage own tokens"
  ON public.fcm_device_tokens FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view tokens" ON public.fcm_device_tokens;
CREATE POLICY "Admins can view tokens"
  ON public.fcm_device_tokens FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 3.3 platform_settings policies
DROP POLICY IF EXISTS "Public can view platform settings" ON public.platform_settings;
CREATE POLICY "Public can view platform settings"
  ON public.platform_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins can manage platform settings"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 3.4 service_areas policies
DROP POLICY IF EXISTS "Public can view service areas" ON public.service_areas;
CREATE POLICY "Public can view service areas"
  ON public.service_areas FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage service areas" ON public.service_areas;
CREATE POLICY "Admins can manage service areas"
  ON public.service_areas FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 3.5 customer_notes policies
DROP POLICY IF EXISTS "Admins can manage customer notes" ON public.customer_notes;
CREATE POLICY "Admins can manage customer notes"
  ON public.customer_notes FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 3.6 maid_availability_schedule policies
DROP POLICY IF EXISTS "Maids can manage own schedule" ON public.maid_availability_schedule;
CREATE POLICY "Maids can manage own schedule"
  ON public.maid_availability_schedule FOR ALL
  TO authenticated
  USING (maid_id = auth.uid())
  WITH CHECK (maid_id = auth.uid());

DROP POLICY IF EXISTS "Public can view active schedules" ON public.maid_availability_schedule;
CREATE POLICY "Public can view active schedules"
  ON public.maid_availability_schedule FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all schedules" ON public.maid_availability_schedule;
CREATE POLICY "Admins can manage all schedules"
  ON public.maid_availability_schedule FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 3.7 booking_photos policies
DROP POLICY IF EXISTS "Users can view photos for own booking" ON public.booking_photos;
CREATE POLICY "Users can view photos for own booking"
  ON public.booking_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_photos.booking_id
        AND (bookings.customer_id = auth.uid() OR bookings.assigned_maid_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Maids can insert photos for assigned booking" ON public.booking_photos;
CREATE POLICY "Maids can insert photos for assigned booking"
  ON public.booking_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_photos.booking_id
        AND bookings.assigned_maid_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all booking photos" ON public.booking_photos;
CREATE POLICY "Admins can manage all booking photos"
  ON public.booking_photos FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- 3.8 reports_cache policies
DROP POLICY IF EXISTS "Admins can view reports cache" ON public.reports_cache;
CREATE POLICY "Admins can view reports cache"
  ON public.reports_cache FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
