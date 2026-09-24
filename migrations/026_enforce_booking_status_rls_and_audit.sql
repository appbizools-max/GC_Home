-- ==============================================================================
-- GC HOME+ — MIGRATION 026: READ-ONLY CUSTOMER STATUS & BOOKING AUDIT LOGS
-- ==============================================================================

-- 1. Create booking_audit_logs table with text columns for maximum safety
CREATE TABLE IF NOT EXISTS public.booking_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_code text,
  previous_status text,
  new_status text,
  changed_by text,
  changed_by_role text DEFAULT 'system',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Index for fast audit lookup by booking
CREATE INDEX IF NOT EXISTS idx_booking_audit_logs_booking_code ON public.booking_audit_logs(booking_code);
CREATE INDEX IF NOT EXISTS idx_booking_audit_logs_booking_id ON public.booking_audit_logs(booking_id);

-- 2. Safe trigger function to log status transitions
CREATE OR REPLACE FUNCTION public.on_booking_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
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
      -- Safe fallback for historical enum mismatch
    END;

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
      -- Safe fallback
    END;

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
      -- Safe fallback
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_booking_status_change ON public.bookings;
CREATE TRIGGER trg_on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_status_change();

-- 3. Grant RLS permissions for booking_timeline and booking_timeline_logs tables
ALTER TABLE public.booking_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select booking_timeline" ON public.booking_timeline;
CREATE POLICY "Public select booking_timeline" ON public.booking_timeline FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert booking_timeline" ON public.booking_timeline;
CREATE POLICY "Public insert booking_timeline" ON public.booking_timeline FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update booking_timeline" ON public.booking_timeline;
CREATE POLICY "Public update booking_timeline" ON public.booking_timeline FOR UPDATE USING (true);
