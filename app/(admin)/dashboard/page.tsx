// app/(admin)/dashboard/page.tsx
import { createClient, getUser } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, Radio, CheckCircle2, Archive, Plus } from "lucide-react";
import type { DashboardStats, Event } from "@/lib/types";
import MonthlyAttendeesChart from "@/components/analytics/MonthlyAttendeesChart";

export const revalidate = 30;

const empty = { count: 0 } as const;

type RecentEvent = Pick<
  Event,
  "id" | "name" | "status" | "event_date" | "has_sessions"
>;

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const userId = user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .single();

  const isSuperAdmin = profile?.is_super_admin ?? false;

  const today = new Date().toISOString().split("T")[0];

  let stats: DashboardStats;
  let pastEvents = 0;
  let recentEvents: RecentEvent[] | null = null;

  if (isSuperAdmin) {
    const [{ data: statsRow }, { data: events }, { count: past }] =
      await Promise.all([
        supabase.from("dashboard_stats").select("*").single(),
        supabase
          .from("events")
          .select("id,name,status,event_date,has_sessions")
          .neq("status", "archived")
          .order("event_date", { ascending: false })
          .limit(5),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .or(`status.eq.archived,event_date.lt.${today}`),
      ]);
    stats = {
      ...(statsRow ?? {
        total_events: 0,
        active_sessions: 0,
        total_checkins: 0,
        past_events: 0,
      }),
      past_events: past ?? 0,
    };
    pastEvents = past ?? 0;
    recentEvents = events as RecentEvent[] | null;
  } else {
    const { data: myEvents } = await supabase
      .from("events")
      .select("id")
      .eq("created_by", userId);

    const eventIds = (myEvents ?? []).map((e: { id: string }) => e.id);

    const [
      { count: totalEvents },
      { count: activeSessions },
      { count: totalCheckins },
      { count: past },
      { data: events },
    ] = await Promise.all([
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId)
        .neq("status", "archived"),
      eventIds.length
        ? supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .in("event_id", eventIds)
            .eq("status", "active")
        : Promise.resolve(empty),
      eventIds.length
        ? supabase
            .from("attendance_records")
            .select("*", { count: "exact", head: true })
            .in("event_id", eventIds)
        : Promise.resolve(empty),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId)
        .or(`status.eq.archived,event_date.lt.${today}`),
      supabase
        .from("events")
        .select("id,name,status,event_date,has_sessions")
        .eq("created_by", userId)
        .neq("status", "archived")
        .order("event_date", { ascending: false })
        .limit(5),
    ]);

    stats = {
      total_events: totalEvents ?? 0,
      active_sessions: activeSessions ?? 0,
      total_checkins: totalCheckins ?? 0,
      past_events: past ?? 0,
    };
    pastEvents = past ?? 0;
    recentEvents = events as RecentEvent[] | null;
  }

  const statCards = [
    {
      label: "Total Daily Events",
      value: stats.total_events,
      icon: Calendar,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Active sessions",
      value: stats.active_sessions,
      icon: Radio,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Total Daily Attendees",
      value: stats.total_checkins,
      icon: CheckCircle2,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Total Past Events",
      value: pastEvents,
      icon: Archive,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isSuperAdmin ? "Welcome!" : "Overview of your events for today "}
          </p>
        </div>
        <Link
          href="/events/new"
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> New event
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {label}
                </p>
                <p className="mt-1.5 text-3xl font-semibold text-gray-900">
                  {value}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <MonthlyAttendeesChart />

      {recentEvents && recentEvents.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent events</h2>
            <Link
              href="/events"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEvents.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.name}</p>
                  <p className="text-xs text-gray-400">{e.event_date}</p>
                </div>
                <span className={`badge-${e.status}`}>{e.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentEvents?.length === 0 && (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <Calendar className="h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500">
            There are no events for today start by creating one
          </p>
          <Link href="/events/new" className="btn-primary">
            Create your first event
          </Link>
        </div>
      )}
    </div>
  );
}
