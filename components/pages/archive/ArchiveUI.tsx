"use client";

import { Archive, FolderOpen } from "lucide-react";
import ArchiveList from "./ArchiveList";

type EventRow = {
  id: string;
  name: string;
  location: string;
  event_date: string;
  archived_at: string | null;
  status: string;
  creator?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type SessionRow = {
  id: string;
  name: string;
  event_id: string;
  archived_at: string | null;
  status: string;
  event: {
    id: string;
    name: string;
  } | null;
};

interface ArchiveUIProps {
  events: EventRow[];
  sessions: SessionRow[];
  totalArchived: number;
  isSuperAdmin: boolean;
}

export default function ArchiveUI({
  events,
  sessions,
  totalArchived,
  isSuperAdmin,
}: ArchiveUIProps) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="
          flex h-12 w-12 items-center
          justify-center rounded-2xl
          bg-purple-50
          "
        >
          <Archive className="h-6 w-6 text-purple-600" />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-gray-900">Archive</h1>

          <p className="text-sm text-gray-500">Completed events and sessions</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Total"
          value={totalArchived}
          valueClass="text-gray-900"
        />

        <SummaryCard
          label="Events"
          value={events.length}
          valueClass="text-indigo-600"
        />

        <SummaryCard
          label="Sessions"
          value={sessions.length}
          valueClass="text-green-600"
        />
      </div>

      {/* Content */}
      {totalArchived > 0 ? (
        <ArchiveList
          events={events}
          sessions={sessions}
          isSuperAdmin={isSuperAdmin}
        />
      ) : (
        <div
          className="
          rounded-2xl border
          bg-white py-20 text-center
          "
        >
          <div
            className="
            mx-auto flex h-14 w-14
            items-center justify-center
            rounded-2xl bg-gray-100
            "
          >
            <FolderOpen className="h-7 w-7 text-gray-400" />
          </div>

          <h3 className="mt-4 font-semibold text-gray-700">
            Nothing archived yet
          </h3>

          <p className="mt-1 text-sm text-gray-400">
            Finished events and sessions will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div
      className="
      rounded-2xl border
      bg-white p-4 shadow-sm
      "
    >
      <p
        className="
        text-xs uppercase
        tracking-wide text-gray-400
        "
      >
        {label}
      </p>

      <p
        className={`
        mt-1 text-2xl font-semibold
        ${valueClass}
        `}
      >
        {value}
      </p>
    </div>
  );
}
