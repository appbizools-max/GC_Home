-- ==============================================================================
-- SMOKE TEST FOR MIGRATION 007: OPERATIONAL FUNCTIONS & PII SECURITY
-- ==============================================================================

DO $$
DECLARE
  v_masked_aadhaar text;
  v_masked_bank text;
BEGIN
  -- 1. Test PII Masking
  v_masked_aadhaar := public.mask_aadhaar('1234 5678 9012');
  ASSERT v_masked_aadhaar = 'XXXX-XXXX-9012', 'Aadhaar masking failed: expected XXXX-XXXX-9012, got ' || v_masked_aadhaar;

  v_masked_bank := public.mask_bank_account('987654321012');
  ASSERT right(v_masked_bank, 4) = '1012', 'Bank account masking failed: expected suffix 1012, got ' || v_masked_bank;

  RAISE NOTICE 'SUCCESS: PII masking functions validated.';

  -- 2. Test Reports Cache Refresh Function
  PERFORM public.refresh_reports_cache();
  RAISE NOTICE 'SUCCESS: refresh_reports_cache executed successfully.';

  -- 3. Test Expire Job Assignments (empty or active execution)
  PERFORM public.expire_job_assignments();
  RAISE NOTICE 'SUCCESS: expire_job_assignments executed successfully.';

  -- 4. Test Reset Monthly Earnings
  PERFORM public.reset_monthly_earnings();
  RAISE NOTICE 'SUCCESS: reset_monthly_earnings executed successfully.';

  RAISE NOTICE 'ALL MIGRATION 007 OPERATIONAL FUNCTIONS VALIDATED!';
END;
$$;
