import Link from 'next/link'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import type { Event } from '@/lib/types'   // ✅ correct import

export default function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900 truncate pr-2">{event.name}</h3>
        <span className={`badge ${
          event.status === 'active' ? 'badge-active' :
          event.status === 'ended' ? 'badge-ended' :
          event.status === 'archived' ? 'badge-archived' :
          'badge-upcoming'
        }`}>
          {event.status}
        </span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {formatDate(event.event_date)}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {formatTime(event.start_time)}{event.end_time && ` – ${formatTime(event.end_time)}`}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {event.location}
        </div>
      </div>
    </Link>
  )
}