-- Migration: 039_partner_eta_and_assignment_fixes.sql
-- Purpose: Add partner_eta column to partner_assignments and bookings tables
-- to persist exact partner-provided estimated arrival time.

ALTER TABLE public.partner_assignments
  ADD COLUMN IF NOT EXISTS partner_eta TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS partner_eta TEXT;

COMMENT ON COLUMN public.partner_assignments.partner_eta IS
  'Exact estimated arrival time provided by partner upon job acceptance (e.g. 25 min).';

COMMENT ON COLUMN public.bookings.partner_eta IS
  'Partner-submitted estimated arrival time for active booking.';
