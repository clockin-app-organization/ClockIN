-- 001_tables.sql – all tables, indexes, triggers, and views

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- profiles (pre‑existing, triggers and RLS later)
-- ============================================================
create table public.profiles (
  id uuid not null,
  email text not null,
  full_name text null,
  phone text null,
  institution text null,
  designation text null,
  district text null,
  avatar_url text null,
  is_super_admin boolean not null default false,
  is_active boolean not null default true,
  is_first_login boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
);

create trigger trg_profiles_updated BEFORE update on profiles
  for EACH row execute FUNCTION set_updated_at();

-- ============================================================
-- events
-- ============================================================
create table public.events (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_by uuid null,
  name text not null,
  location text not null,
  description text null,
  event_date date not null,
  start_time time without time zone not null,
  end_time time without time zone null,
  has_sessions boolean not null default false,
  status text not null default 'upcoming'::text,
  qr_token text null,
  lat double precision null,
  lng double precision null,
  archived_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  revive_note text null,
  revived_at timestamp with time zone null,
  revived_by uuid null,
  constraint events_pkey primary key (id),
  constraint events_qr_token_key unique (qr_token),
  constraint events_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint events_revived_by_fkey foreign KEY (revived_by) references profiles (id) on delete set null,
  constraint events_status_check check (
    status = any (array['upcoming'::text, 'active'::text, 'ended'::text, 'archived'::text])
  )
);

create trigger trg_events_updated BEFORE update on events
  for EACH row execute FUNCTION set_updated_at();

-- ============================================================
-- sessions
-- ============================================================
create table public.sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  event_id uuid not null,
  name text not null,
  status text not null default 'pending'::text,
  qr_token text null,
  started_at timestamp with time zone null,
  ended_at timestamp with time zone null,
  archived_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  revive_note text null,
  revived_at timestamp with time zone null,
  revived_by uuid null,
  constraint sessions_pkey primary key (id),
  constraint sessions_qr_token_key unique (qr_token),
  constraint sessions_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint sessions_revived_by_fkey foreign KEY (revived_by) references profiles (id) on delete set null,
  constraint sessions_status_check check (
    status = any (array['pending'::text, 'active'::text, 'ended'::text, 'archived'::text])
  )
);

create trigger trg_sessions_updated BEFORE update on sessions
  for EACH row execute FUNCTION set_updated_at();

-- ============================================================
-- attendees
-- ============================================================
create table public.attendees (
  id uuid not null default extensions.uuid_generate_v4 (),
  event_id uuid not null,
  session_id uuid null,
  full_name text not null,
  phone text not null,
  email text null,
  institution text null,
  designation text null,
  device_fingerprint text not null,
  qr_token_used text null,
  method text null default 'qr_scan'::text,
  lat double precision null,
  lng double precision null,
  location_label text null,
  created_at timestamp with time zone not null default now(),
  checked_in_after_revival boolean not null default false,
  constraint attendees_pkey primary key (id),
  constraint attendees_device_fingerprint_event_id_key unique (device_fingerprint, event_id),
  constraint attendees_device_fingerprint_session_id_key unique (device_fingerprint, session_id),
  constraint attendees_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint attendees_session_id_fkey foreign KEY (session_id) references sessions (id) on delete CASCADE
);

-- Unique indexes for dedup
create unique index IF not exists attendees_device_event_uniq
  on public.attendees (device_fingerprint, event_id) where (session_id is null);
create unique index IF not exists attendees_device_session_uniq
  on public.attendees (device_fingerprint, session_id) where (session_id is not null);
create unique index IF not exists attendees_email_event_uniq
  on public.attendees (email, event_id) where (session_id is null and email is not null);
create unique index IF not exists attendees_email_session_uniq
  on public.attendees (email, session_id) where (session_id is not null and email is not null);
create unique index IF not exists attendees_phone_event_uniq
  on public.attendees (phone, event_id) where (session_id is null);
create unique index IF not exists attendees_phone_session_uniq
  on public.attendees (phone, session_id) where (session_id is not null);

-- ============================================================
-- qr_tokens
-- ============================================================
create table public.qr_tokens (
  token text not null,
  token_type text not null,
  event_id uuid null,
  session_id uuid null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint qr_tokens_pkey primary key (token),
  constraint qr_tokens_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint qr_tokens_session_id_fkey foreign KEY (session_id) references sessions (id) on delete CASCADE,
  constraint qr_tokens_token_type_check check (
    token_type = any (array['event'::text, 'session'::text])
  )
);

-- ============================================================
-- revival_notes
-- ============================================================
create table public.revival_notes (
  id uuid not null default extensions.uuid_generate_v4 (),
  scope_type text not null,
  scope_id uuid not null,
  note text not null,
  revived_by uuid null,
  created_at timestamp with time zone not null default now(),
  constraint revival_notes_pkey primary key (id),
  constraint revival_notes_revived_by_fkey foreign KEY (revived_by) references profiles (id) on delete set null,
  constraint revival_notes_scope_type_check check (
    scope_type = any (array['event'::text, 'session'::text])
  )
);

-- ============================================================
-- manual_attendance
-- ============================================================
create table public.manual_attendance (
  id uuid not null default extensions.uuid_generate_v4 (),
  event_id uuid not null,
  session_id uuid null,
  image_path text not null,
  caption text null,
  uploaded_by uuid null,
  created_at timestamp with time zone null default now(),
  constraint manual_attendance_pkey primary key (id),
  constraint manual_attendance_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint manual_attendance_session_id_fkey foreign KEY (session_id) references sessions (id) on delete CASCADE,
  constraint manual_attendance_uploaded_by_fkey foreign KEY (uploaded_by) references profiles (id) on delete set null,
  constraint manual_attendance_event_or_session check (
    (session_id is null) or (event_id is not null and session_id is not null)
  )
);

create index idx_manual_attendance_event on manual_attendance (event_id);
create index idx_manual_attendance_session on manual_attendance (session_id);

-- ============================================================
-- event_attachments
-- ============================================================
create table public.event_attachments (
  id uuid not null default extensions.uuid_generate_v4 (),
  event_id uuid not null,
  file_name text not null,
  file_url text not null,
  file_type text null,
  created_at timestamp with time zone not null default now(),
  constraint event_attachments_pkey primary key (id),
  constraint event_attachments_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE
);

-- ============================================================
-- View: dashboard_stats
-- ============================================================
create view public.dashboard_stats as
select
  (select count(*) from events where status <> 'archived')::integer as total_events,
  (select count(*) from sessions where status = 'active')::integer as active_sessions,
  (select count(*) from attendees)::integer as total_checkins,
  (
    select count(*) from (
      select device_fingerprint,
             coalesce(session_id::text, event_id::text) as scope
      from attendees
      group by device_fingerprint, coalesce(session_id::text, event_id::text)
      having count(*) > 1
    ) d
  )::integer as duplicates;