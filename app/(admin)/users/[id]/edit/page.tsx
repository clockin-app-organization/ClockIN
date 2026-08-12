// app/(admin)/users/[id]/edit/page.tsx
import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Archive, FolderOpen, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Event, Session } from "@/lib/types";

export const revalidate = 0;

export default async function ArchivePage() {
  const user = await getUser();

  if (!user) return

  const supabase = await createClient();
  const currentUserId = user.id;

  // Check if super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", currentUserId)
    .single();

  const isSuperAdmin = profile?.is_super_admin ?? false;

  // Base queries
  let eventsQuery = supabase
    .from("events")
    .select("*")
    .in("status", ["ended", "archived"])
    .order("archived_at", { ascending: false, nullsFirst: false });

  let sessionsQuery = supabase
    .from("sessions")
    .select("*, event:events(id,name,created_by)")
    .in("status", ["ended", "archived"])
    .order("archived_at", { ascending: false, nullsFirst: false });

  // If not super admin, filter by creator
  if (!isSuperAdmin) {
    eventsQuery = eventsQuery.eq("created_by", currentUserId);

    // Sessions: only those belonging to events created by this user
    // We need to join logic: sessions where event.created_by = currentUserId
    // Since we can't filter directly on joined table easily, we can fetch eligible event IDs first.
    const { data: userEventIds } = await supabase
      .from("events")
      .select("id")
      .eq("created_by", currentUserId);

    const ids = userEventIds?.map((e) => e.id) ?? [];
    if (ids.length > 0) {
      sessionsQuery = sessionsQuery.in("event_id", ids);
    } else {
      // No events created by this user, return empty arrays
      return (
        <ArchivePageUI
          events={[]}
          sessions={[]}
          totalArchived={0}
          isSuperAdmin={isSuperAdmin}
        />
      );
    }
  }

  const [{ data: events }, { data: sessions }] = await Promise.all([
    eventsQuery,
    sessionsQuery,
  ]);

  const totalArchived = (events?.length ?? 0) + (sessions?.length ?? 0);

  return (
    <ArchivePageUI
      events={events ?? []}
      sessions={sessions ?? []}
      totalArchived={totalArchived}
      isSuperAdmin={isSuperAdmin}
    />
  );
}

// Presentational component (to avoid repetition)
function ArchivePageUI({
  events,
  sessions,
  totalArchived,
}: {
  events: Event[];
  sessions: (Session & { event: { id: string; name: string } | null })[];
  totalArchived: number;
  isSuperAdmin: boolean;
}) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
          <Archive className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Archive</h1>
          <p className="text-sm text-gray-500">
            {totalArchived} finished / archived item{totalArchived !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {totalArchived === 0 && (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <FolderOpen className="h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500">Nothing finished yet</p>
          <p className="text-sm text-gray-400">
            Ended and archived events &amp; sessions appear here.
          </p>
        </div>
      )}

      {/* Ended / Archived events */}
      {events.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Events</h2>
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-50">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{e.name}</p>
                      {e.status === "ended" && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          Ended
                        </span>
                      )}
                      {e.status === "archived" && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {e.location} · {formatDate(e.event_date)}
                      {e.archived_at && ` · Archived ${formatDate(e.archived_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/events/${e.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View
                    </Link>
                    {(e.status === "ended" || e.status === "archived") && (
                      <Link
                        href={`/events/${e.id}/revive`}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <RotateCcw className="h-3 w-3" /> Revive
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ended / Archived sessions */}
      {sessions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Sessions</h2>
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-50">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{s.name}</p>
                      {s.status === "ended" && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          Ended
                        </span>
                      )}
                      {s.status === "archived" && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {s.event?.name ?? "Unknown event"}
                      {s.archived_at && ` · Archived ${formatDate(s.archived_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/events/${s.event_id}/sessions/${s.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View
                    </Link>
                    {(s.status === "ended" || s.status === "archived") && (
                      <Link
                        href={`/events/${s.event_id}/sessions/${s.id}/revive`}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <RotateCcw className="h-3 w-3" /> Revive
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}