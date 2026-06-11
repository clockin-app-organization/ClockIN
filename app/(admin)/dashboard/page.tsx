// app/(admin)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, Radio, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

export const revalidate = 30;

export default async function DashboardPage() {
  await getSession();
  const supabase = await createClient();

  const [{ data: statsRow }, { data: recentEvents }] = await Promise.all([
    supabase.from("dashboard_stats").select("*").single(),
    supabase
      .from("events")
      .select("id,name,status,event_date,has_sessions")
      .neq("status", "archived")
      .order("event_date", { ascending: false })
      .limit(5),
  ]);

  const stats: DashboardStats = statsRow ?? {
    total_events: 0, active_sessions: 0, total_checkins: 0, duplicates: 0,
  };

  const statCards = [
    { label: "Total events",      value: stats.total_events,    icon: Calendar,      color: "text-blue-600 bg-blue-50"    },
    { label: "Active sessions",   value: stats.active_sessions, icon: Radio,         color: "text-green-600 bg-green-50"  },
    { label: "Total check-ins",   value: stats.total_checkins,  icon: CheckCircle2,  color: "text-indigo-600 bg-indigo-50" },
    { label: "Flagged duplicates",value: stats.duplicates,      icon: AlertTriangle, color: "text-amber-600 bg-amber-50"  },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Overview of your attendance system</p>
        </div>
        <Link href="/events/new" className="btn-primary flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> New event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                <p className="mt-1.5 text-3xl font-semibold text-gray-900">{value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent events */}
      {recentEvents && recentEvents.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent events</h2>
            <Link href="/events" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEvents.map(e => (
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
    </div>
  );
}