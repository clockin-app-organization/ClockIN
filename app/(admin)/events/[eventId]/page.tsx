// app/(admin)/events/[eventId]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRDisplay from "@/components/qr/QRDisplay";
import HeatMap from "@/components/attendance/HeatMap";
import { formatDate, formatTime } from "@/lib/utils";
import { MapPin, Clock, Calendar, Users, Plus, Download } from "lucide-react";
import type { Session, Attendee } from "@/lib/types";
import DeleteEventButton from "@/components/events/DeleteEventButton";
import DownloadAttendeesButton from "@/components/events/DownloadAttendeesButton";

export const revalidate = 0;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

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

  const safeAttendees: Attendee[] = attendees ?? [];

  return (
    <div className="space-y-6 p-4 lg:p-6">

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
          {event.status === "archived" && (
            <Link href={`/events/${event.id}/revive`} className="btn-primary">Revive</Link>
          )}
          <DeleteEventButton eventId={event.id} eventName={event.name} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {!event.has_sessions && event.qr_token && event.status === "active" && (
            <div className="card p-6">
              <h2 className="section-title mb-4">QR Code</h2>
              <div className="flex justify-center">
                <QRDisplay token={event.qr_token} label={`Scan to check in: ${event.name}`} />
              </div>
            </div>
          )}

          {!event.has_sessions && (
            <div className="card p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="section-title">Attendee Map</h2>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="h-4 w-4" />{safeAttendees.length} checked in
                </span>
              </div>
              <HeatMap
                key={safeAttendees.length}
                attendees={safeAttendees}
                centerLat={event.lat ?? undefined}
                centerLng={event.lng ?? undefined}
              />
            </div>
          )}

          {!event.has_sessions && safeAttendees.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                <h2 className="section-title">Attendees</h2>
                <DownloadAttendeesButton
                  eventName={event.name}
                  location={event.location}
                  eventDate={event.event_date}
                  attendees={safeAttendees}
                  variant="ghost"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Phone</th>
                      <th className="px-4 py-2 text-left">Institution</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {safeAttendees.map((a, i) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{a.full_name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{a.email ?? "—"}</td>
                        <td className="px-4 py-2.5 text-gray-500">{a.phone}</td>
                        <td className="px-4 py-2.5 text-gray-500">{a.institution ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">{a.location_label ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">
                          {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {event.has_sessions ? "Total sessions" : "Total check-ins"}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {event.has_sessions ? (event.sessions?.length ?? 0) : safeAttendees.length}
            </p>
          </div>

          {event.has_sessions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Sessions</h3>
                {event.status !== "archived" && (
                  <Link href={`/events/${event.id}/sessions/new`}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    <Plus className="h-4 w-4" /> Add
                  </Link>
                )}
              </div>
              {event.sessions?.length === 0 && <p className="text-sm text-gray-400">No sessions yet.</p>}
              {event.sessions?.map((s: Session) => (
                <Link key={s.id} href={`/events/${event.id}/sessions/${s.id}`}
                  className="card flex items-center justify-between p-4 transition-shadow hover:shadow-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{s.name}</p>
                      <span className={`badge-${s.status} flex-shrink-0`}>{s.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}