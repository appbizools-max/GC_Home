-- ============================================================
-- Migration 020: Restrict catalog write RLS to admin role
-- ============================================================
-- Catalog tables (service_categories, services, service_addons,
-- homepage_banners, offers) currently allow unauthenticated
-- write access (FOR ALL USING (true) WITH CHECK (true)).
-- This migration tightens writes to admin JWT / service role.
--
-- Strategy:
--   READ:  still open to anon (public catalog browsing)
--   WRITE: restricted to users with role = 'admin' in JWT claims
--          OR using the service_role key (backend/admin panel)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. service_categories
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "service_categories_all" ON service_categories;
DROP POLICY IF EXISTS "Allow all on service_categories" ON service_categories;
DROP POLICY IF EXISTS "Anyone can view service categories" ON service_categories;
DROP POLICY IF EXISTS "Anyone can manage service categories" ON service_categories;

-- Public read
CREATE POLICY "service_categories_public_read"
  ON service_categories FOR SELECT
  USING (true);

-- Admin write (insert/update/delete)
CREATE POLICY "service_categories_admin_write"
  ON service_categories FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  );

-- ──────────────────────────────────────────────────────────────
-- 2. services
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "services_all" ON services;
DROP POLICY IF EXISTS "Allow all on services" ON services;
DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Anyone can manage services" ON services;

CREATE POLICY "services_public_read"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "services_admin_write"
  ON services FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  );

-- ──────────────────────────────────────────────────────────────
-- 3. service_addons
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "service_addons_all" ON service_addons;
DROP POLICY IF EXISTS "Allow all on service_addons" ON service_addons;
DROP POLICY IF EXISTS "Anyone can view service addons" ON service_addons;
DROP POLICY IF EXISTS "Anyone can manage service addons" ON service_addons;

CREATE POLICY "service_addons_public_read"
  ON service_addons FOR SELECT
  USING (true);

CREATE POLICY "service_addons_admin_write"
  ON service_addons FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  );

-- ──────────────────────────────────────────────────────────────
-- 4. homepage_banners
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "homepage_banners_all" ON homepage_banners;
DROP POLICY IF EXISTS "Allow all on homepage_banners" ON homepage_banners;
DROP POLICY IF EXISTS "Anyone can view homepage banners" ON homepage_banners;
DROP POLICY IF EXISTS "Anyone can manage homepage banners" ON homepage_banners;

CREATE POLICY "homepage_banners_public_read"
  ON homepage_banners FOR SELECT
  USING (true);

CREATE POLICY "homepage_banners_admin_write"
  ON homepage_banners FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  );

-- ──────────────────────────────────────────────────────────────
-- 5. offers
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "offers_all" ON offers;
DROP POLICY IF EXISTS "Allow all on offers" ON offers;
DROP POLICY IF EXISTS "Anyone can view offers" ON offers;
DROP POLICY IF EXISTS "Anyone can manage offers" ON offers;

CREATE POLICY "offers_public_read"
  ON offers FOR SELECT
  USING (true);

CREATE POLICY "offers_admin_write"
  ON offers FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  );

-- ──────────────────────────────────────────────────────────────
-- NOTE: Admin Panel uses the service_role key via Supabase
-- server client, so all Admin CRUD operations continue to work.
-- The VITE_SUPABASE_ANON_KEY (user-facing) loses write access.
-- ──────────────────────────────────────────────────────────────
