// app/(admin)/archive/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Archive, Eye, FolderOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getSession } from "@/lib/supabase/server";

export const revalidate = 0;

// Inline types for query results
type EventRow = {
  id: string;
  name: string;
  location: string;
  event_date: string;
  archived_at: string | null;
  status: string;
  creator?: { full_name: string | null; email: string | null } | null;
};

type SessionRow = {
  id: string;
  name: string;
  event_id: string;
  archived_at: string | null;
  status: string;
  event: { id: string; name: string } | null;
};

export default async function ArchivePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const currentUserId = session.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", currentUserId)
    .single();

  const isSuperAdmin = profile?.is_super_admin ?? false;

  // 1. Events query
  let eventQuery = supabase
    .from("events")
    .select("*, creator:profiles!events_created_by_fkey (full_name, email)")
    .in("status", ["ended", "archived"]);

  if (!isSuperAdmin) {
    eventQuery = eventQuery.eq("created_by", currentUserId);
  }

  eventQuery = eventQuery.order("archived_at", { ascending: false, nullsFirst: false });

  // 2. Sessions query
  let sessionQuery = supabase
    .from("sessions")
    .select("*, event:events(id, name, created_by)")
    .in("status", ["ended", "archived"]);

  if (!isSuperAdmin) {
    const { data: userEventIds } = await supabase
      .from("events")
      .select("id")
      .eq("created_by", currentUserId);

    const eventIds = userEventIds?.map((e) => e.id) ?? [];
    if (eventIds.length === 0) {
      return (
        <ArchiveUI
          events={[]}
          sessions={[]}
          totalArchived={0}
          isSuperAdmin={isSuperAdmin}
        />
      );
    }
    sessionQuery = sessionQuery.in("event_id", eventIds);
  }

  sessionQuery = sessionQuery.order("archived_at", { ascending: false, nullsFirst: false });

  // 3. Execute queries
  const [{ data: events }, { data: sessions }] = await Promise.all([
    eventQuery,
    sessionQuery,
  ]);

  const totalArchived = (events?.length ?? 0) + (sessions?.length ?? 0);

  return (
    <ArchiveUI
      events={events ?? []}
      sessions={sessions ?? []}
      totalArchived={totalArchived}
      isSuperAdmin={isSuperAdmin}
    />
  );
}

// Presentational component
function ArchiveUI({
  events,
  sessions,
  totalArchived,
  isSuperAdmin,
}: {
  events: EventRow[];
  sessions: SessionRow[];
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
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {e.name}
                      </p>
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
                      {isSuperAdmin && e.creator && (
                        <span className="ml-1 text-purple-600">
                          · {e.creator.full_name || e.creator.email}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/events/${e.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
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
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {s.name}
                      </p>
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
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
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