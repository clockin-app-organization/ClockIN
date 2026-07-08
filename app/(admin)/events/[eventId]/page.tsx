// app/(admin)/events/[eventId]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRDisplay from "@/components/qr/QRDisplay";
import HeatMap from "@/components/attendance/HeatMap";
import AttendeeTable from "@/components/attendance/AttendeeTable";
import { formatDate, formatTime } from "@/lib/utils";
import { ChevronLeft, MapPin, Clock, Calendar, Plus, AlertTriangle, Users, UserCheck } from "lucide-react";
import type { Session, Attendee, RevivalNote } from "@/lib/types";
import DeleteEventButton from "@/components/events/DeleteEventButton";
import DownloadAttendeesButton from "@/components/events/DownloadAttendeesButton";
import EventStatusWatcher from "@/components/events/EventStatusWatcher";
import ManualAttendanceUpload from "@/components/attendance/ManualAttendanceUpload";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  await supabase.rpc('sync_event_statuses');

  const { data: event } = await supabase
    .from("events")
    .select("*, sessions(*)")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const { data: attendees } = await supabase
    .from("attendees")
    .select("*")
    .eq("event_id", event.id)
    .is("session_id", null)
    .order("created_at", { ascending: false });

  const { data: revivalNotes } = await supabase
    .from("revival_notes")
    .select("*")
    .eq("scope_type", "event")
    .eq("scope_id", eventId)
    .order("created_at", { ascending: false });

  const safeAttendees: Attendee[] = attendees ?? [];
  const safeNotes: RevivalNote[]  = revivalNotes ?? [];
  const latestNote                = safeNotes[0] ?? null;

  // Session‑based stats
  let uniqueAttendeesCount = 0;
  let singleSessionCount = 0;

  if (event.has_sessions) {
    const { data: sessionAttendees } = await supabase
      .from("attendees")
      .select("email, session_id")
      .eq("event_id", event.id)
      .not("session_id", "is", null);

    if (sessionAttendees) {
      const emailMap = new Map<string, Set<string>>();
      for (const a of sessionAttendees) {
        if (!emailMap.has(a.email)) emailMap.set(a.email, new Set());
        emailMap.get(a.email)!.add(a.session_id);
      }
      uniqueAttendeesCount = emailMap.size;
      singleSessionCount = [...emailMap.values()].filter(s => s.size === 1).length;
    }
  }

  const showQR = !event.has_sessions
    && event.qr_token
    && (event.status === "upcoming" || event.status === "active");

  return (
    <div className="space-y-6 p-4 lg:p-6">

      <EventStatusWatcher eventId={event.id} />

      {/* Back button */}
      {(event.status === "ended" || event.status === "archived") && (
        <Link href="/archive"
          className="mb-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to archive
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900 truncate">{event.name}</h1>
            <span className={`badge-${event.status}`}>{event.status}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(event.event_date)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!event.has_sessions && safeAttendees.length > 0 && (
            <DownloadAttendeesButton
              eventName={event.name}
              location={event.location}
              eventDate={event.event_date}
              attendees={safeAttendees}
            />
          )}
          {event.status !== "archived" && (
            <Link href={`/events/${event.id}/edit`} className="btn-secondary">Edit</Link>
          )}
          {(event.status === "ended" || event.status === "archived") && (
            <Link href={`/events/${event.id}/revive`} className="btn-primary">Revive</Link>
          )}
          <DeleteEventButton eventId={event.id} eventName={event.name} />
        </div>
      </div>

      {/* Revival note banner */}
      {latestNote && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="font-semibold mb-0.5">
              Revival note
              {safeNotes.length > 1 && (
                <span className="ml-1.5 text-xs font-normal text-amber-600">({safeNotes.length} revivals)</span>
              )}
            </p>
            <p>{latestNote.note}</p>
            <p className="mt-1 text-xs text-amber-500">
              {new Date(latestNote.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>
      )}

      {/* ── Non‑session event ─────────────────────────────── */}
      {!event.has_sessions ? (
        <div className="space-y-6">

          {showQR && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">QR Code</h2>
                {event.status === "active" ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live — accepting check-ins
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Upcoming – QR ready for sharing
                  </span>
                )}
              </div>
              <div className="flex justify-center">
                <QRDisplay token={event.qr_token} label={`Scan to check in: ${event.name}`} />
              </div>
            </div>
          )}

          <AttendeeTable
            attendees={safeAttendees}
            revivalAt={latestNote?.created_at ?? null}
          />

          <ManualAttendanceUpload eventId={event.id} />

          <div className="card p-6">
            <h2 className="section-title mb-4">Attendee Map</h2>
            <HeatMap
              key={safeAttendees.length}
              attendees={safeAttendees}
              centerLat={event.lat ?? undefined}
              centerLng={event.lng ?? undefined}
            />
          </div>

          {safeNotes.length > 1 && (
            <div className="card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Revival history</p>
              {safeNotes.map((n) => (
                <div key={n.id} className="border-l-2 border-amber-300 pl-3">
                  <p className="text-xs text-gray-700">{n.note}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {new Date(n.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Session‑based event ─────────────────────────── */
        <>
          {/* Score cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total unique attendees</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueAttendeesCount}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <UserCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attended 1 session only</p>
                <p className="text-2xl font-bold text-gray-900">{singleSessionCount}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total sessions</p>
                <p className="text-2xl font-bold text-gray-900">{event.sessions?.length ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Sessions list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Sessions</h3>
              {event.status !== "archived" && (
                <Link
                  href={`/events/${event.id}/sessions/new`}
                  className="btn-secondary inline-flex items-center gap-1.5 text-sm"
                >
                  <Plus className="h-4 w-4" /> Add session
                </Link>
              )}
            </div>
            {event.sessions?.length === 0 && (
              <p className="text-sm text-gray-400">No sessions yet.</p>
            )}
            <div className="grid gap-3">
              {event.sessions?.map((s: Session) => (
                <Link
                  key={s.id}
                  href={`/events/${event.id}/sessions/${s.id}`}
                  className="card flex items-center justify-between p-4 hover:shadow-md transition-shadow"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{s.name}</p>
                  </div>
                  <span className={`badge-${s.status} flex-shrink-0`}>{s.status}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}