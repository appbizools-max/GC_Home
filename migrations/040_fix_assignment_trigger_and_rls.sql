-- ==============================================================================
-- GC HOME+ — MIGRATION 040: FIX BOOKING TRIGGER ENUM, RLS POLICIES & NOTIFICATIONS
-- ==============================================================================

-- 1. Ensure enum booking_status accepts 'none' and 'unknown' to prevent 22P02 casting failures from legacy triggers
DO $$
BEGIN
  ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'none';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'unknown';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Drop and replace any malfunctioning booking status triggers
DROP TRIGGER IF EXISTS trg_on_booking_status_change ON public.bookings;

CREATE OR REPLACE FUNCTION public.on_booking_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only execute if the main status enum actually changed
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Attempt booking_status_history record
    BEGIN
      INSERT INTO public.booking_status_history (
        booking_id,
        from_status,
        to_status,
        changed_by_type
      ) VALUES (
        NEW.id,
        OLD.status,
        NEW.status,
        'system'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Safe fallback: never abort booking update
    END;

    -- Attempt booking_timeline_logs record
    BEGIN
      INSERT INTO public.booking_timeline_logs (
        booking_id,
        status_to,
        title,
        details,
        actor_type
      ) VALUES (
        NEW.id,
        NEW.status,
        REPLACE(INITCAP(NEW.status::text), '_', ' '),
        'Status changed from ' || COALESCE(REPLACE(INITCAP(OLD.status::text), '_', ' '), 'Initial') || ' to ' || REPLACE(INITCAP(NEW.status::text), '_', ' '),
        'system'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Safe fallback: never abort booking update
    END;

    -- Attempt booking_audit_logs record
    BEGIN
      INSERT INTO public.booking_audit_logs (
        booking_id,
        booking_code,
        previous_status,
        new_status,
        changed_by,
        changed_by_role,
        notes,
        created_at
      ) VALUES (
        NEW.id,
        NEW.booking_code,
        COALESCE(OLD.status::text, 'pending_assignment'),
        COALESCE(NEW.status::text, 'pending_assignment'),
        COALESCE(NEW.assigned_maid_name, 'System/Admin'),
        CASE 
          WHEN NEW.assigned_maid_id IS NOT NULL THEN 'maid'
          ELSE 'admin'
        END,
        'Status changed from ' || COALESCE(OLD.status::text, 'pending_assignment') || ' -> ' || COALESCE(NEW.status::text, 'pending_assignment'),
        now()
      );
    EXCEPTION WHEN OTHERS THEN
      -- Safe fallback: never abort booking update
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger ONLY on update of status column (never on assignment_status or approval status alone)
CREATE TRIGGER trg_on_booking_status_change
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.on_booking_status_change();

-- 3. Row-Level Security for partner_assignments
ALTER TABLE public.partner_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and authenticated can manage partner_assignments" ON public.partner_assignments;
CREATE POLICY "Public and authenticated can manage partner_assignments"
  ON public.partner_assignments FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON TABLE public.partner_assignments TO anon, authenticated, service_role;

-- 4. Row-Level Security and Column alignment for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and authenticated can manage notifications" ON public.notifications;
CREATE POLICY "Public and authenticated can manage notifications"
  ON public.notifications FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;

-- Ensure notifications table columns allow flexible dispatch
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_role text DEFAULT 'maid';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'dispatch';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_booking_id uuid;
ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN type DROP NOT NULL;
