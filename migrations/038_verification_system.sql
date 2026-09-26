-- Migration: 038_verification_system.sql
-- Purpose: Support granular 5-step, profile photo, and document-level verification states,
-- audit history logging, and itemized re-upload requests for maid applications.

ALTER TABLE public.maid_profiles
  ADD COLUMN IF NOT EXISTS verification_status JSONB DEFAULT '{
    "step1_personal": {"status": "pending", "verified_at": null, "verified_by": null},
    "step2_address": {"status": "pending", "verified_at": null, "verified_by": null},
    "step3_services": {"status": "pending", "verified_at": null, "verified_by": null},
    "step4_documents": {"status": "pending", "verified_at": null, "verified_by": null},
    "step5_bank": {"status": "pending", "verified_at": null, "verified_by": null},
    "profile_photo": {"status": "pending", "rejection_reason": null},
    "documents": {
      "aadhaar_front": {"status": "pending", "rejection_reason": null, "url": null},
      "aadhaar_back": {"status": "pending", "rejection_reason": null, "url": null},
      "pan_card": {"status": "pending", "rejection_reason": null, "url": null}
    }
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_audit_log JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.maid_profiles.verification_status IS
  'Granular 5-step, profile photo, and document-level verification states.';

COMMENT ON COLUMN public.maid_profiles.verification_audit_log IS
  'Audit log of all admin verification actions, rejections, reasons, and approvals.';
