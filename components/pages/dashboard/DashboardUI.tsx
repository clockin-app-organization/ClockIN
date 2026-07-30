"use client";

import Link from "next/link";
import { Calendar, Radio, CheckCircle2, Archive, Plus } from "lucide-react";

import MonthlyAttendeesChart from "@/components/analytics/MonthlyAttendeesChart";
import type { DashboardStats, Event } from "@/lib/types";

type RecentEvent = Pick<
  Event,
  "id" | "name" | "status" | "event_date" | "has_sessions"
>;

type Props = {
  stats: DashboardStats;
  pastEvents: number;
  recentEvents: RecentEvent[] | null;
  isSuperAdmin: boolean;
};

export default function DashboardUI({
  stats,
  pastEvents,
  recentEvents,
  isSuperAdmin,
}: Props) {
  const statCards = [
    {
      label: "Total Daily Events",
      value: stats.total_events,
      icon: Calendar,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Active Sessions",
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

          <p className="mt-0.5 text-sm text-gray-500">
            {isSuperAdmin ? "Welcome!" : "Overview of your events for today"}
          </p>
        </div>

        <Link
          href="/events/new"
          className="
          btn-primary flex items-center gap-1.5
          "
        >
          <Plus className="h-4 w-4" />
          New event
        </Link>
      </div>

      {/* Stats */}
      <div
        className="
        grid grid-cols-2 gap-3
        lg:grid-cols-4
      "
      >
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div
              className="
                flex items-start justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs font-medium
                    uppercase tracking-wide
                    text-gray-500
                  "
                >
                  {label}
                </p>

                <p
                  className="
                    mt-1.5 text-3xl
                    font-semibold text-gray-900
                  "
                >
                  {value}
                </p>
              </div>

              <div
                className={`
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  ${color}
                  `}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <MonthlyAttendeesChart />

      {/* Recent Events */}
      {recentEvents && recentEvents.length > 0 && (
        <div
          className="
          card overflow-hidden
        "
        >
          <div
            className="
            flex items-center justify-between
            border-b border-gray-100
            px-5 py-3
          "
          >
            <h2
              className="
              font-semibold text-gray-900
            "
            >
              Recent events
            </h2>

            <Link
              href="/events"
              className="
              text-xs font-medium
              text-indigo-600
              hover:text-indigo-700
              "
            >
              View all →
            </Link>
          </div>

          <div
            className="
            divide-y divide-gray-50
          "
          >
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="
                  flex items-center justify-between
                  px-5 py-3
                  hover:bg-gray-50
                  "
              >
                <div>
                  <p
                    className="
                      text-sm font-medium
                      text-gray-900
                    "
                  >
                    {event.name}
                  </p>

                  <p
                    className="
                      text-xs text-gray-400
                    "
                  >
                    {event.event_date}
                  </p>
                </div>

                <span
                  className={`
                    badge-${event.status}
                    `}
                >
                  {event.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {recentEvents?.length === 0 && (
        <div
          className="
          card flex flex-col
          items-center gap-3
          py-16 text-center
        "
        >
          <Calendar
            className="
            h-10 w-10
            text-gray-300
            "
          />

          <p
            className="
            font-medium text-gray-500
          "
          >
            There are no events for today. Start by creating one.
          </p>

          <Link href="/events/new" className="btn-primary">
            Create your first event
          </Link>
        </div>
      )}
    </div>
  );
}
