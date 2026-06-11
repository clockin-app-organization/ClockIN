// components/attendance/AttendeeTable.tsx
// Reusable client component: attendee list with live refresh button.
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import type { Attendee } from '@/lib/types'

interface Props {
  attendees:   Attendee[]
  revivalAt?:  string | null   // ISO string of latest revival — to mark post-revival rows
}

export default function AttendeeTable({ attendees, revivalAt }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function refresh() {
    startTransition(() => router.refresh())
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between gap-3">
        <h2 className="section-title">
          Attendees
          <span className="ml-2 text-sm font-normal text-gray-400">({attendees.length})</span>
        </h2>
        <button
          onClick={refresh}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {attendees.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          No check-ins yet. Share the QR code to start collecting attendance.
        </div>
      ) : (
        /* Horizontally scrollable, full-width table */
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left w-10">#</th>
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-left">Email</th>
                <th className="px-4 py-2.5 text-left">Phone</th>
                <th className="px-4 py-2.5 text-left">Institution</th>
                <th className="px-4 py-2.5 text-left">Designation</th>
                <th className="px-4 py-2.5 text-left">Location</th>
                <th className="px-4 py-2.5 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attendees.map((a, i) => {
                const isPostRevival = revivalAt
                  ? new Date(a.created_at) > new Date(revivalAt)
                  : false

                return (
                  <tr
                    key={a.id}
                    className={`hover:bg-gray-50 ${isPostRevival ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-gray-400 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                      {a.full_name}
                      {isPostRevival && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                          post-revival
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{a.email ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{a.phone}</td>
                    <td className="px-4 py-2.5 text-gray-500">{a.institution ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{a.designation ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{a.location_label ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}