import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import type { Event } from "@/lib/types";

export const revalidate = 0;

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*, sessions(count)")
    .neq("status", "archived")
    .order("event_date", { ascending: false });

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Events</h1>
        <Link href="/events/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New event
        </Link>
      </div>

      {!events?.length ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <Calendar className="h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500">No events yet</p>
          <Link href="/events/new" className="btn-primary">Create your first event</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((e: Event & { sessions: { count: number }[] }) => (
            <Link key={e.id} href={`/events/${e.id}`} className="card block p-5 transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900 leading-tight">{e.name}</h2>
                <span className={`badge-${e.status} flex-shrink-0`}>{e.status}</span>
              </div>
              <p className="mb-1 text-xs text-gray-500">{e.location}</p>
              <p className="text-xs text-gray-400">
                {e.event_date} · {e.start_time?.slice(0, 5)}
              </p>
              {e.has_sessions && (
                <p className="mt-2 text-xs font-medium text-indigo-500">
                  {e.sessions?.[0]?.count ?? 0} session(s)
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}