import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRDisplay from "@/components/qr/QRDisplay";
import HeatMap from "@/components/attendance/HeatMap";
import { Users, ChevronLeft, AlertTriangle } from "lucide-react";
import type { Attendee, RevivalNote } from "@/lib/types";
import StartSessionButton from "@/components/events/StartSessionButton";
import EndSessionButton from "@/components/events/EndSessionButton";
import DownloadAttendeesButton from "@/components/events/DownloadAttendeesButton";

export const revalidate = 0;

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; sessionId: string }>;
}) {
  const { eventId, sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, event:events(id,name,location,event_date,lat,lng,status)")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const { data: attendees } = await supabase
    .from("attendees")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  // Fetch revival notes for this session
  const { data: revivalNotes } = await supabase
    .from("revival_notes")
    .select("*")
    .eq("scope_type", "session")
    .eq("scope_id", sessionId)
    .order("created_at", { ascending: false });

  const safeAttendees: Attendee[]       = attendees ?? [];
  const safeNotes: RevivalNote[]        = revivalNotes ?? [];
  const latestNote: RevivalNote | undefined = safeNotes[0];

  return (
    <div className="space-y-6 p-4 lg:p-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/events/${eventId}`}
            className="mb-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-3.5 w-3.5" /> {session.event?.name}
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900">{session.name}</h1>
            <span className={`badge-${session.status}`}>{session.status}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{session.event?.location}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {safeAttendees.length > 0 && session.event && (
            <DownloadAttendeesButton
              eventName={session.event.name}
              location={session.event.location}
              eventDate={session.event.event_date}
              sessionName={session.name}
              attendees={safeAttendees}
            />
          )}
          {session.status !== "archived" && (
            <Link href={`/events/${eventId}/sessions/${sessionId}/edit`} className="btn-secondary">Edit</Link>
          )}
          {session.status === "pending"  && <StartSessionButton sessionId={sessionId} />}
          {session.status === "active"   && <EndSessionButton   sessionId={sessionId} />}
          {session.status === "archived" && (
            <Link href={`/events/${eventId}/sessions/${sessionId}/revive`} className="btn-primary">Revive</Link>
          )}
        </div>
      </div>

      {/* Revival note banner — always visible when present */}
      {latestNote && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="font-semibold mb-0.5">
              Revival note
              {safeNotes.length > 1 && (
                <span className="ml-1.5 text-xs font-normal text-amber-600">
                  ({safeNotes.length} revivals total)
                </span>
              )}
            </p>
            <p>{latestNote.note}</p>
            <p className="mt-1 text-xs text-amber-500">
              {new Date(latestNote.created_at).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {session.status === "active" && session.qr_token && (
            <div className="card p-6">
              <h2 className="section-title mb-4">QR Code</h2>
              <div className="flex justify-center">
                <QRDisplay token={session.qr_token} label={`Session: ${session.name}`} />
              </div>
            </div>
          )}

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
              centerLat={session.event?.lat ?? undefined}
              centerLng={session.event?.lng ?? undefined}
            />
          </div>

          {safeAttendees.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                <h2 className="section-title">Attendees</h2>
                {session.event && (
                  <DownloadAttendeesButton
                    eventName={session.event.name}
                    location={session.event.location}
                    eventDate={session.event.event_date}
                    sessionName={session.name}
                    attendees={safeAttendees}
                    variant="ghost"
                  />
                )}
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
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          <span>{a.full_name}</span>
                          {a.checked_in_after_revival && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                              post-revival
                            </span>
                          )}
                        </td>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Check-ins</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{safeAttendees.length}</p>
          </div>

          {session.started_at && (
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Started</p>
              <p className="mt-1 text-sm text-gray-700">
                {new Date(session.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}

          {/* All revival notes in sidebar */}
          {safeNotes.length > 0 && (
            <div className="card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Revival history
              </p>
              {safeNotes.map((n) => (
                <div key={n.id} className="border-l-2 border-amber-300 pl-3">
                  <p className="text-xs text-gray-700">{n.note}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {new Date(n.created_at).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}