-- Migration: 031_upgrade_partner_registration_schema.sql
-- Purpose: Add comprehensive columns for multi-service partner registration, structured address, emergency contact, languages, availability, document URLs, and admin review workflow.

ALTER TABLE public.maid_profiles
  ADD COLUMN IF NOT EXISTS dob TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS full_address TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS locality TEXT,
  ADD COLUMN IF NOT EXISTS preferred_service_area TEXT,
  ADD COLUMN IF NOT EXISTS services_provided JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS languages_spoken JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS working_hours TEXT,
  ADD COLUMN IF NOT EXISTS emergency_jobs_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS aadhaar_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS pan_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS address_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS other_docs_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS upi_id TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS accuracy_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS correction_requested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create sequence or generator helper for Partner ID if not exists
CREATE OR REPLACE FUNCTION generate_partner_code()
RETURNS TEXT AS $$
DECLARE
  next_val INT;
  result_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(maid_code FROM '[0-9]+') AS INT)), 1000) + 1 INTO next_val FROM public.maid_profiles WHERE maid_code ~ '^GC-PARTNER-[0-9]+$';
  result_code := 'GC-PARTNER-' || next_val::TEXT;
  RETURN result_code;
END;
$$ LANGUAGE plpgsql;
