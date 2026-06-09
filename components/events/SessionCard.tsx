// components/events/SessionCard.tsx
import Link from "next/link";
import { Clock, CheckCircle, Archive, ArrowRight } from "lucide-react";
import type { Session } from "@/lib/types";

interface SessionCardProps {
  session: Session;
  eventId: string;
}

export default function SessionCard({ session, eventId }: SessionCardProps) {
  const statusIcon = {
    pending: <Clock className="h-5 w-5 text-gray-400" />,
    active: <CheckCircle className="h-5 w-5 text-green-500" />,
    ended: <Clock className="h-5 w-5 text-gray-400" />,
    archived: <Archive className="h-5 w-5 text-gray-400" />,
  }[session.status];

  const statusBadge = {
    pending: "badge-pending",
    active: "badge-active",
    ended: "badge-ended",
    archived: "badge-archived",
  }[session.status];

  return (
    <Link
      href={`/events/${eventId}/sessions/${session.id}`}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        {statusIcon}
        <div>
          <p className="font-medium truncate">{session.name}</p>
          <p className="text-xs text-gray-500 capitalize">{session.status}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`badge ${statusBadge}`}>
          {session.status}
        </span>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>
    </Link>
  );
}