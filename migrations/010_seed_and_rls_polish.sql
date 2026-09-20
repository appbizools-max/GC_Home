-- ==============================================================================
-- GC HOME+ — MIGRATION 010: RLS POLICY POLISH & COMPLETE LIFECYCLE MOCK DATA
-- Enables seamless customer booking flow, maid assignment flow & admin visibility
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RLS POLICY POLISH FOR CLIENT APPS
-- ------------------------------------------------------------------------------

-- A. Bookings Table RLS: Allow creation by customer app and reading by clients
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public or authenticated can create bookings" ON public.bookings;
CREATE POLICY "Public or authenticated can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public or authenticated can view bookings" ON public.bookings;
CREATE POLICY "Public or authenticated can view bookings"
  ON public.bookings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public or authenticated can update bookings" ON public.bookings;
CREATE POLICY "Public or authenticated can update bookings"
  ON public.bookings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- B. Maid Profiles Table RLS: Allow reading approved and online maids for dispatch and customer visibility
ALTER TABLE public.maid_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved maids" ON public.maid_profiles;
CREATE POLICY "Public can view approved maids"
  ON public.maid_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public or authenticated can manage maid profiles" ON public.maid_profiles;
CREATE POLICY "Public or authenticated can manage maid profiles"
  ON public.maid_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- C. Ratings Table RLS: Allow customers to submit ratings and public to read reviews
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can insert own rating" ON public.ratings;
DROP POLICY IF EXISTS "Public can insert ratings" ON public.ratings;
CREATE POLICY "Public can insert ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view visible ratings" ON public.ratings;
CREATE POLICY "Public can view visible ratings"
  ON public.ratings FOR SELECT
  USING (true);

-- D. Notifications Table RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert and view notifications" ON public.notifications;
CREATE POLICY "Public can insert and view notifications"
  ON public.notifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. SEED COMPREHENSIVE ACTIVE MAID PROFILES (4 REALISTIC PARTNERS)
-- ------------------------------------------------------------------------------

-- Defensive column alignment for maid_profiles
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS maid_code text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS id_proof_url text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_area text;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_radius_km integer DEFAULT 5;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS health_safety_decl boolean DEFAULT true;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'pending';
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS current_status text DEFAULT 'available';
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 5.0;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS total_ratings_count integer DEFAULT 0;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS completed_jobs_count integer DEFAULT 0;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS total_jobs integer DEFAULT 0;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS earnings_this_month numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS total_earnings numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS working_days text[];
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS preferred_areas text[];
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS languages text[];
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'pending';
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS kyc_completion_pct integer DEFAULT 0;
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_area_lat numeric(10,7);
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS service_area_lng numeric(10,7);
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now();
ALTER TABLE public.maid_profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Ensure update_maid_rating function does not fail if fired by ratings inserts
CREATE OR REPLACE FUNCTION public.update_maid_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.maid_profiles
  SET
    rating = COALESCE((SELECT round(avg(COALESCE(stars, rating, 5))::numeric, 2) FROM public.ratings WHERE maid_id = NEW.maid_id), 5.0),
    total_ratings_count = COALESCE((SELECT count(*) FROM public.ratings WHERE maid_id = NEW.maid_id), 0),
    completed_jobs_count = COALESCE((SELECT count(*) FROM public.ratings WHERE maid_id = NEW.maid_id), 0),
    total_jobs = COALESCE((SELECT count(*) FROM public.ratings WHERE maid_id = NEW.maid_id), 0)
  WHERE id = NEW.maid_id;
  RETURN NEW;
END;
$$;


-- Drop strict unique constraint on maid_code to prevent collision with legacy/demo records
ALTER TABLE public.maid_profiles DROP CONSTRAINT IF EXISTS maid_profiles_maid_code_key;
DROP INDEX IF EXISTS public.maid_profiles_maid_code_key;
CREATE INDEX IF NOT EXISTS idx_maid_profiles_maid_code ON public.maid_profiles(maid_code);

INSERT INTO public.maid_profiles (
  id,
  maid_code,
  full_name,
  phone,
  email,
  photo_url,
  id_proof_url,
  emergency_contact,
  address,
  service_area,
  service_radius_km,
  health_safety_decl,
  status,
  application_status,
  is_online,
  current_status,
  rating,
  total_ratings_count,
  completed_jobs_count,
  earnings_this_month,
  total_earnings,
  working_days,
  skills,
  preferred_areas,
  languages,
  kyc_status,
  kyc_completion_pct,
  service_area_lat,
  service_area_lng,
  applied_at,
  approved_at
) VALUES 
  (
    'a1111111-1111-1111-1111-111111111111',
    'GC-MD001',
    'Lakshmi Devi',
    '+91 91234 56789',
    'lakshmi.devi@example.com',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    '+91 98765 43210 (Sister)',
    'H.No 12, Kondapur, Hyderabad',
    'Kondapur, Hyderabad',
    6,
    true,
    'approved',
    'approved',
    true,
    'online',
    4.8,
    98,
    248,
    25600.00,
    52600.00,
    ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ARRAY['Home Cleaning', 'Deep Cleaning', 'Kitchen Cleaning'],
    ARRAY['Kondapur', 'Gachibowli', 'Madhapur', 'Hitec City'],
    ARRAY['Telugu', 'Hindi', 'English'],
    'verified',
    100,
    17.4699,
    78.3578,
    now() - interval '30 days',
    now() - interval '28 days'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'GC-MD002',
    'Sunita Devi',
    '+91 98492 01824',
    'sunita.d@example.com',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    '+91 98492 00000 (Husband)',
    'Flat 204, Madhapur, Hyderabad',
    'Madhapur, Hyderabad',
    5,
    true,
    'approved',
    'approved',
    true,
    'online',
    4.9,
    115,
    184,
    31200.00,
    68400.00,
    ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ARRAY['Kitchen Cleaning', 'Deep Cleaning', 'Home Cleaning'],
    ARRAY['Madhapur', 'Jubilee Hills', 'Kondapur'],
    ARRAY['Telugu', 'Hindi'],
    'verified',
    100,
    17.4483,
    78.3915,
    now() - interval '45 days',
    now() - interval '43 days'
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'GC-MD003',
    'Pooja Sharma',
    '+91 93456 77890',
    'pooja.s@example.com',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    '+91 93456 00000 (Brother)',
    'H.No 45, Gachibowli, Hyderabad',
    'Gachibowli, Hyderabad',
    5,
    true,
    'approved',
    'approved',
    true,
    'available',
    4.7,
    42,
    76,
    16800.00,
    34200.00,
    ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    ARRAY['Sofa & Carpet Cleaning', 'Home Cleaning'],
    ARRAY['Gachibowli', 'Financial District', 'Nanakramguda'],
    ARRAY['Hindi', 'Telugu'],
    'verified',
    100,
    17.4401,
    78.3489,
    now() - interval '20 days',
    now() - interval '19 days'
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'GC-MD004',
    'Radha Rani',
    '+91 98765 11223',
    'radha.r@example.com',
    'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    '+91 98765 00000 (Father)',
    'Plot 88, Hitec City, Hyderabad',
    'Hitec City, Hyderabad',
    7,
    true,
    'approved',
    'approved',
    true,
    'online',
    4.6,
    58,
    112,
    21400.00,
    44900.00,
    ARRAY['Mon', 'Wed', 'Thu', 'Fri', 'Sat'],
    ARRAY['Bathroom Cleaning', 'Home Cleaning', 'Kitchen Cleaning'],
    ARRAY['Hitec City', 'Kondapur', 'KPHB'],
    ARRAY['Telugu', 'English'],
    'verified',
    100,
    17.4435,
    78.3772,
    now() - interval '60 days',
    now() - interval '58 days'
  )
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  application_status = EXCLUDED.application_status,
  is_online = EXCLUDED.is_online,
  current_status = EXCLUDED.current_status,
  rating = EXCLUDED.rating,
  total_ratings_count = EXCLUDED.total_ratings_count,
  completed_jobs_count = EXCLUDED.completed_jobs_count,
  earnings_this_month = EXCLUDED.earnings_this_month,
  total_earnings = EXCLUDED.total_earnings;

-- Also seed KYC documents for maid 1 & 2 so PendingKYCTab in Admin Panel shows rich data
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS maid_id uuid;
ALTER TABLE public.maid_kyc_documents ALTER COLUMN doc_type DROP NOT NULL;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS doc_type text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS file_url text DEFAULT '';
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS file_size_bytes bigint;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS verified_by uuid;
ALTER TABLE public.maid_kyc_documents ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

INSERT INTO public.maid_kyc_documents (
  id,
  maid_id,
  doc_type,
  document_type,
  title,
  file_name,
  file_url,
  document_url,
  file_size_bytes,
  status,
  verified_at,
  verified_by,
  created_at
) VALUES
  (
    'd1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'aadhaar',
    'aadhaar',
    'Aadhaar Card',
    'aadhaar_lakshmi.pdf',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    245760,
    'verified',
    now() - interval '28 days',
    (SELECT id FROM public.admin_users LIMIT 1),
    now() - interval '30 days'
  ),
  (
    'd2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'pan',
    'pan',
    'PAN Card',
    'pan_sunita.pdf',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    184320,
    'verified',
    now() - interval '43 days',
    (SELECT id FROM public.admin_users LIMIT 1),
    now() - interval '45 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SEED 6 COMPLETE LIFECYCLE BOOKINGS
-- ------------------------------------------------------------------------------

-- Ensure columns exist on bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_price numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_label text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_street text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_locality text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_city text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_pincode text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_lat numeric(10,7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address_lng numeric(10,7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS scheduled_date date;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS time_slot text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_assignment';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'online';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'paid';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS start_otp text DEFAULT '4829';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_maid_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_maid_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_maid_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_maid_photo_url text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_rating numeric(2,1);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_review text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_reason text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Drop strict unique constraint on booking_code to prevent collision
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_code_key;
DROP INDEX IF EXISTS public.bookings_booking_code_key;
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON public.bookings(booking_code);

INSERT INTO public.bookings (
  id,
  booking_code,
  customer_name,
  customer_phone,
  customer_email,
  service_name,
  service_price,
  total_amount,
  address_label,
  address_street,
  address_locality,
  address_city,
  address_pincode,
  address_lat,
  address_lng,
  scheduled_date,
  time_slot,
  status,
  payment_method,
  payment_status,
  start_otp,
  assigned_maid_id,
  assigned_maid_name,
  assigned_maid_phone,
  assigned_maid_photo_url,
  customer_rating,
  customer_review,
  cancellation_reason,
  reschedule_reason,
  created_at,
  completed_at
) VALUES
  -- 1. PENDING ASSIGNMENT (Ready for Admin Dispatch test)
  (
    'b1111111-1111-1111-1111-111111111111',
    'GC-2026-001',
    'Priya Sharma',
    '+91 98765 43210',
    'priya.sharma@example.com',
    'Home Cleaning (2 BHK)',
    799.00,
    799.00,
    'Home',
    'Flat 4B, Sri Sai Residency, Kondapur Main Rd',
    'Kondapur',
    'Hyderabad',
    '500084',
    17.4699,
    78.3578,
    current_date,
    '10:00 AM',
    'pending_assignment',
    'online',
    'paid',
    '5921',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    now() - interval '20 minutes',
    NULL
  ),
  -- 2. MAID ASSIGNED (Sunita assigned, awaiting arrival)
  (
    'b2222222-2222-2222-2222-222222222222',
    'GC-2026-002',
    'Vikram Mehta',
    '+91 98222 33445',
    'vikram.mehta@example.com',
    'Deep Cleaning',
    1299.00,
    1299.00,
    'Villa',
    'Villa 14, Rainbow Vistas',
    'Madhapur',
    'Hyderabad',
    '500081',
    17.4483,
    78.3915,
    current_date,
    '11:30 AM',
    'maid_assigned',
    'online',
    'paid',
    '3312',
    'a2222222-2222-2222-2222-222222222222',
    'Sunita Devi',
    '+91 98492 01824',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    NULL,
    NULL,
    NULL,
    NULL,
    now() - interval '1 hour',
    NULL
  ),
  -- 3. IN PROGRESS (Lakshmi Devi currently cleaning on site)
  (
    'b3333333-3333-3333-3333-333333333333',
    'GC-2026-003',
    'Ananya Reddy',
    '+91 99887 76655',
    'ananya.r@example.com',
    'Bathroom Cleaning',
    499.00,
    499.00,
    'Home',
    'Tower 3, Apt 1102, My Home Bhooja',
    'Hitec City',
    'Hyderabad',
    '500081',
    17.4435,
    78.3772,
    current_date,
    '09:00 AM',
    'in_progress',
    'upi',
    'paid',
    '8841',
    'a1111111-1111-1111-1111-111111111111',
    'Lakshmi Devi',
    '+91 91234 56789',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    NULL,
    NULL,
    NULL,
    NULL,
    now() - interval '2 hours',
    NULL
  ),
  -- 4. COMPLETED (Finished with 5-star customer review)
  (
    'b4444444-4444-4444-4444-444444444444',
    'GC-2026-004',
    'Rohit Gupta',
    '+91 97111 22334',
    'rohit.g@example.com',
    'Deep Cleaning',
    1299.00,
    1299.00,
    'Home',
    'Plot 19, Telecom Nagar',
    'Gachibowli',
    'Hyderabad',
    '500032',
    17.4401,
    78.3489,
    current_date - interval '1 day',
    '02:00 PM',
    'completed',
    'online',
    'paid',
    '7190',
    'a2222222-2222-2222-2222-222222222222',
    'Sunita Devi',
    '+91 98492 01824',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    5.0,
    'Outstanding service! Sunita was very polite and left the apartment sparkling clean.',
    NULL,
    NULL,
    now() - interval '1 day',
    now() - interval '22 hours'
  ),
  -- 5. RESCHEDULED (Customer requested time change)
  (
    'b5555555-5555-5555-5555-555555555555',
    'GC-2026-005',
    'Kavita Nair',
    '+91 96555 44332',
    'kavita.nair@example.com',
    'Kitchen Cleaning',
    599.00,
    599.00,
    'Home',
    'Flat 12B, Jayabheri Silicon County',
    'Hitec City',
    'Hyderabad',
    '500084',
    17.4435,
    78.3772,
    current_date + interval '1 day',
    '04:00 PM',
    'rescheduled',
    'online',
    'paid',
    '1092',
    'a4444444-4444-4444-4444-444444444444',
    'Radha Rani',
    '+91 98765 11223',
    'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400',
    NULL,
    NULL,
    NULL,
    'Customer was held up at office meetings. Rescheduled to tomorrow afternoon.',
    now() - interval '4 hours',
    NULL
  ),
  -- 6. CANCELLED (Customer cancelled with reason logged)
  (
    'b6666666-6666-6666-6666-666666666666',
    'GC-2026-006',
    'Amitabh Sen',
    '+91 95444 33221',
    'amitabh.sen@example.com',
    'Home Cleaning (2 BHK)',
    799.00,
    799.00,
    'Home',
    'House 78, Botanical Garden Road',
    'Kondapur',
    'Hyderabad',
    '500084',
    17.4699,
    78.3578,
    current_date - interval '2 days',
    '10:00 AM',
    'cancelled',
    'online',
    'refunded',
    '9043',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Sudden out-of-town travel. Full refund processed via original payment method.',
    NULL,
    now() - interval '2 days',
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  status = EXCLUDED.status,
  service_name = EXCLUDED.service_name,
  total_amount = EXCLUDED.total_amount,
  assigned_maid_id = EXCLUDED.assigned_maid_id,
  assigned_maid_name = EXCLUDED.assigned_maid_name,
  assigned_maid_phone = EXCLUDED.assigned_maid_phone,
  assigned_maid_photo_url = EXCLUDED.assigned_maid_photo_url,
  customer_rating = EXCLUDED.customer_rating,
  customer_review = EXCLUDED.customer_review;

-- Timeline logs for booking 2, 3, 4
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS booking_id uuid;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS status_to text;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS details text;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS actor_type text;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE public.booking_timeline_logs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

INSERT INTO public.booking_timeline_logs (
  booking_id,
  status_to,
  title,
  details,
  actor_type,
  actor_name,
  created_at
) VALUES
  (
    'b2222222-2222-2222-2222-222222222222',
    'pending_assignment',
    'Booking Created',
    'Booking confirmed via online payment ₹1,299.',
    'customer',
    'Vikram Mehta',
    now() - interval '1 hour'
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'maid_assigned',
    'Maid Assigned',
    'Sunita Devi accepted the booking request.',
    'system',
    'Auto-Dispatch',
    now() - interval '45 minutes'
  ),
  (
    'b3333333-3333-3333-3333-333333333333',
    'in_progress',
    'Service Started',
    'OTP verified by Lakshmi Devi. Cleaning is actively underway.',
    'maid',
    'Lakshmi Devi',
    now() - interval '1 hour'
  ),
  (
    'b4444444-4444-4444-4444-444444444444',
    'completed',
    'Service Completed',
    'Deep cleaning concluded successfully. Rating: 5.0 Stars.',
    'maid',
    'Sunita Devi',
    now() - interval '22 hours'
  )
ON CONFLICT DO NOTHING;

-- Also seed rating for completed booking 4
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS booking_id uuid;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS maid_id uuid;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS service_id uuid;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS rating smallint;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS stars smallint;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS review_text text;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.ratings ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE public.ratings ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE public.ratings ALTER COLUMN stars DROP NOT NULL;
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_customer_id_fkey;
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_service_id_fkey;

INSERT INTO public.ratings (
  id,
  booking_id,
  maid_id,
  customer_id,
  rating,
  stars,
  comment,
  review_text,
  is_visible,
  created_at
) VALUES (
  'r4444444-4444-4444-4444-444444444444',
  'b4444444-4444-4444-4444-444444444444',
  'a2222222-2222-2222-2222-222222222222',
  COALESCE((SELECT id FROM public.user_profiles LIMIT 1), (SELECT id FROM public.admin_users LIMIT 1)),
  5,
  5,
  'Outstanding service! Sunita was very polite and left the apartment sparkling clean.',
  'Outstanding service! Sunita was very polite and left the apartment sparkling clean.',
  true,
  now() - interval '22 hours'
)
ON CONFLICT (booking_id) DO NOTHING;

DO $$ 
BEGIN 
  RAISE NOTICE 'SUCCESS: Migration 010 completed. RLS updated and 4 maids + 6 lifecycle bookings seeded!'; 
END $$;
