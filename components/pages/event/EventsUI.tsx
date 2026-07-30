"use client";

import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import type { Event } from "@/lib/types";
import EventCard from "./EventCard";

type EventWithSessions = Event & {
  sessions: {
    count: number;
  }[];
};

interface EventsUIProps {
  events: EventWithSessions[];
  isSuperAdmin: boolean;
}

export default function EventsUI({ events, isSuperAdmin }: EventsUIProps) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Events</h1>

          <p className="mt-0.5 text-sm text-gray-500">
            {isSuperAdmin ? "Showing all events" : "Manage your events"}
          </p>
        </div>

        <Link
          href="/events/new"
          className="
            btn-primary
            flex items-center gap-1.5
          "
        >
          <Plus className="h-4 w-4" />
          New event
        </Link>
      </div>

      {/* Empty State */}
      {!events.length ? (
        <div
          className="
            flex flex-col items-center
            rounded-2xl border
            bg-white py-20
            text-center
          "
        >
          <div
            className="
              flex h-14 w-14
              items-center justify-center
              rounded-2xl bg-gray-100
            "
          >
            <Calendar
              className="
                h-7 w-7 text-gray-400
              "
            />
          </div>

          <h3
            className="
              mt-4
              font-semibold
              text-gray-700
            "
          >
            No events yet
          </h3>

          <p
            className="
              mt-1
              text-sm text-gray-400
            "
          >
            Create your first event to get started.
          </p>

          <Link
            href="/events/new"
            className="
              btn-primary mt-5
            "
          >
            Create event
          </Link>
        </div>
      ) : (
        /* Event Grid */
        <div
          className="
            grid gap-4
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
