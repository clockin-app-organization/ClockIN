-- 002_rls_cron_functions.sql – RLS policies, functions, cron jobs

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revival_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- -------------------- profiles --------------------
-- Allow users to read their own profile
CREATE POLICY "Allow individual read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow individual update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admin insert
CREATE POLICY "profiles_insert_super_admin" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Super admin delete
CREATE POLICY "profiles_delete_super_admin" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Super admin update
CREATE POLICY "profiles_update_super_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Allow authenticated users to read all profiles
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Service role full access is implicit (bypasses RLS)

-- -------------------- events --------------------
-- Authenticated users can read events
CREATE POLICY "Authenticated users can manage events" ON public.events
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can insert events (e.g., create new)
CREATE POLICY "Authenticated users can insert events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can update events
CREATE POLICY "Authenticated users can update events" ON public.events
  FOR UPDATE TO authenticated
  USING (true);

-- Public can read active events by token (for QR scanning)
CREATE POLICY "Public can read active events by token" ON public.events
  FOR SELECT TO anon
  USING (status = 'active' AND qr_token IS NOT NULL);

-- -------------------- sessions --------------------
CREATE POLICY "Authenticated can read sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can manage sessions" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update sessions" ON public.sessions
  FOR UPDATE TO authenticated
  USING (true);

-- -------------------- attendees --------------------
-- Anyone can insert attendance (no auth required for check‑in)
CREATE POLICY "Anyone can insert attendance" ON public.attendees
  FOR INSERT TO anon
  WITH CHECK (true);

-- Authenticated users can read attendees
CREATE POLICY "Authenticated can read attendees" ON public.attendees
  FOR SELECT TO authenticated
  USING (true);

-- -------------------- qr_tokens --------------------
CREATE POLICY "Authenticated can manage tokens" ON public.qr_tokens
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Public can read active tokens" ON public.qr_tokens
  FOR SELECT TO anon
  USING (is_active = true);

-- -------------------- revival_notes --------------------
CREATE POLICY "Authenticated can insert revival notes" ON public.revival_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read revival notes" ON public.revival_notes
  FOR SELECT TO authenticated
  USING (true);

-- -------------------- manual_attendance --------------------
CREATE POLICY "Authenticated can manage manual attendance" ON public.manual_attendance
  FOR ALL TO authenticated
  USING (true);

-- -------------------- event_attachments --------------------
CREATE POLICY "Authenticated can manage attachments" ON public.event_attachments
  FOR ALL TO authenticated
  USING (true);

-- ============================================================
-- Functions
-- ============================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Handle new auth user (trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Check if email is pre‑approved (exists in profiles)
CREATE OR REPLACE FUNCTION public.is_email_pre_approved(p_email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email);
END;
$$;

-- Validate attendance token and return event/session info
CREATE OR REPLACE FUNCTION public.validate_attendance_token(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  qr_record record;
  evt record;
  ses record;
BEGIN
  SELECT * INTO qr_record FROM public.qr_tokens WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Token not found');
  END IF;

  IF qr_record.token_type = 'event' THEN
    SELECT * INTO evt FROM public.events WHERE id = qr_record.event_id;
    RETURN jsonb_build_object(
      '_token_type', 'event',
      'id', evt.id,
      'name', evt.name,
      'location', evt.location,
      'event_date', evt.event_date,
      'qr_token', evt.qr_token,
      'has_sessions', evt.has_sessions
    );
  ELSIF qr_record.token_type = 'session' THEN
    SELECT * INTO ses FROM public.sessions WHERE id = qr_record.session_id;
    SELECT * INTO evt FROM public.events WHERE id = ses.event_id;
    RETURN jsonb_build_object(
      '_token_type', 'session',
      'id', ses.id,
      'name', ses.name,
      'event_id', ses.event_id,
      'event_name', evt.name,
      'location', evt.location,
      'event_date', evt.event_date
    );
  ELSE
    RETURN jsonb_build_object('error', 'Invalid token type');
  END IF;
END;
$$;

-- Sync event statuses (upcoming → active → ended → archived)
CREATE OR REPLACE FUNCTION public.sync_event_statuses()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  today date := current_date;
BEGIN
  -- upcoming → active
  UPDATE events
  SET status = 'active', updated_at = now()
  WHERE status = 'upcoming'
    AND (event_date::text || ' ' || start_time::text)::timestamptz AT TIME ZONE 'UTC' <= now();

  -- Activate QR tokens
  UPDATE qr_tokens
  SET is_active = true
  WHERE token_type = 'event'
    AND event_id IN (SELECT id FROM events WHERE status = 'active');

  -- End active sessions first
  UPDATE sessions
  SET status = 'ended', updated_at = now()
  WHERE status IN ('active', 'pending')
    AND event_id IN (
      SELECT id FROM events
      WHERE status = 'active'
        AND end_time IS NOT NULL
        AND (event_date::text || ' ' || end_time::text)::timestamptz AT TIME ZONE 'UTC' <= now()
    );

  -- active → ended
  UPDATE events
  SET status = 'ended', updated_at = now()
  WHERE status = 'active'
    AND end_time IS NOT NULL
    AND (event_date::text || ' ' || end_time::text)::timestamptz AT TIME ZONE 'UTC' <= now();

  -- Deactivate QR tokens
  UPDATE qr_tokens
  SET is_active = false
  WHERE event_id IN (SELECT id FROM events WHERE status = 'ended');

  -- Auto‑archive ended events after event date is over
  UPDATE events
  SET status = 'archived', archived_at = now(), updated_at = now()
  WHERE status = 'ended' AND event_date < today;

  -- Auto‑archive ended sessions whose parent event date is over
  UPDATE sessions
  SET status = 'archived', archived_at = now(), updated_at = now()
  WHERE status = 'ended' AND event_id IN (SELECT id FROM events WHERE event_date < today);
END;
$$;

-- Revive an ended/archived event or session
CREATE OR REPLACE FUNCTION public.revive_scope(
  p_scope_type   text,
  p_scope_id     uuid,
  p_note         text,
  p_revived_by   uuid,
  p_event_date   date   DEFAULT NULL,
  p_start_time   time   DEFAULT NULL,
  p_end_time     time   DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_scope_type = 'event' THEN
    IF NOT EXISTS (SELECT 1 FROM events WHERE id = p_scope_id AND status IN ('ended', 'archived')) THEN
      RAISE EXCEPTION 'Event can only be revived if ended or archived.';
    END IF;

    UPDATE events
    SET status      = 'upcoming',
        archived_at = NULL,
        updated_at  = now(),
        revive_note = p_note,
        revived_at  = now(),
        revived_by  = p_revived_by,
        event_date  = COALESCE(p_event_date, event_date),
        start_time  = COALESCE(p_start_time, start_time),
        end_time    = COALESCE(p_end_time, end_time)
    WHERE id = p_scope_id;

    UPDATE qr_tokens
    SET is_active = true
    WHERE event_id = p_scope_id AND token_type = 'event';

  ELSIF p_scope_type = 'session' THEN
    IF NOT EXISTS (SELECT 1 FROM sessions WHERE id = p_scope_id AND status IN ('ended', 'archived')) THEN
      RAISE EXCEPTION 'Session can only be revived if ended or archived.';
    END IF;

    UPDATE sessions
    SET status      = 'pending',
        archived_at = NULL,
        updated_at  = now(),
        revive_note = p_note,
        revived_at  = now(),
        revived_by  = p_revived_by
    WHERE id = p_scope_id;

    UPDATE qr_tokens
    SET is_active = true
    WHERE session_id = p_scope_id AND token_type = 'session';
  ELSE
    RAISE EXCEPTION 'Invalid scope type.';
  END IF;

  INSERT INTO revival_notes (scope_type, scope_id, note, revived_by)
  VALUES (p_scope_type, p_scope_id, p_note, p_revived_by);
END;
$$;

-- Get session attendance stats for an event
CREATE OR REPLACE FUNCTION public.get_event_session_stats(p_event_id uuid)
RETURNS TABLE(total_unique bigint, single_session_attendees bigint)
LANGUAGE plpgsql AS $$
DECLARE
  session_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO session_ids FROM sessions WHERE event_id = p_event_id;

  IF session_ids IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint;
    RETURN;
  END IF;

  -- Total distinct attendees
  SELECT count(DISTINCT a.email) INTO total_unique
  FROM attendees a
  WHERE a.session_id = ANY(session_ids);

  -- Attendees in exactly one session
  SELECT count(*) INTO single_session_attendees
  FROM (
    SELECT a.email, count(DISTINCT a.session_id) AS cnt
    FROM attendees a
    WHERE a.session_id = ANY(session_ids)
    GROUP BY a.email
    HAVING count(DISTINCT a.session_id) = 1
  ) sub;

  RETURN QUERY SELECT total_unique, single_session_attendees;
END;
$$;

-- Old cron‑triggered function (kept for reference, not used anymore)
CREATE OR REPLACE FUNCTION public.activate_events()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Logic moved to sync_event_statuses
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_manage_events()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- No longer used
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_manage_events_debug_time()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- No longer used
END;
$$;

-- Grant execute to authenticated users for RPC
GRANT EXECUTE ON FUNCTION public.sync_event_statuses() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.revive_scope(text, uuid, text, uuid, date, time, time) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_attendance_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_email_pre_approved(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_event_session_stats(uuid) TO authenticated;

-- ============================================================
-- Cron job (idle, kept for potential future use)
-- ============================================================
-- If you ever want a daily midnight sync, enable this:
-- SELECT cron.schedule('midnight-archive', '1 0 * * *', 'select public.sync_event_statuses()');
-- Currently unscheduled, so nothing runs automatically.