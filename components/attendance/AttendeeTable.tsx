'use client'
import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Eye, X, MapPin, Phone, Mail, Building2, BadgeInfo, Clock, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { Attendee } from '@/lib/types'

interface Props {
  attendees:   Attendee[]
  revivalAt?:  string | null
}

export default function AttendeeTable({ attendees, revivalAt }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Attendee | null>(null)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(5)
  const [search, setSearch] = useState('')

  const filtered = attendees.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.full_name.toLowerCase().includes(q) ||
      (a.institution ?? '').toLowerCase().includes(q) ||
      (a.designation ?? '').toLowerCase().includes(q) ||
      (a.phone ?? '').toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage)

  const perPageOptions = [5, 10, 15, 25, 50]

  useEffect(() => { setPage(0) }, [search, perPage])

  function refresh() {
    startTransition(() => router.refresh())
  }

  return (
    <div className="card overflow-hidden">
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

      {/* Search bar */}
      <div className="px-5 py-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, institution, designation…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          {attendees.length === 0
            ? 'No check-ins yet. Share the QR code to start collecting attendance.'
            : 'No attendees match your search.'}
        </div>
      ) : (
        <>
          {/* Desktop table — hidden on small screens */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left w-10">#</th>
                  <th className="px-4 py-2.5 text-left">Name</th>
                  <th className="px-4 py-2.5 text-left">Institution</th>
                  <th className="px-4 py-2.5 text-left">Designation</th>
                  <th className="px-4 py-2.5 text-left">Time</th>
                  <th className="px-4 py-2.5 text-center w-16">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((a, i) => {
                  const isPostRevival = revivalAt
                    ? new Date(a.created_at) > new Date(revivalAt)
                    : false

                  return (
                    <tr
                      key={a.id}
                      className={`hover:bg-gray-50 ${isPostRevival ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="px-4 py-2.5 text-gray-400 tabular-nums">{page * perPage + i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                        {a.full_name}
                        {isPostRevival && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                            post-revival
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{a.institution ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{a.designation ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(a.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => setSelected(a)}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — shown only on small screens */}
          <div className="md:hidden divide-y divide-gray-100">
            {paginated.map((a, i) => {
              const isPostRevival = revivalAt
                ? new Date(a.created_at) > new Date(revivalAt)
                : false

              return (
                <div
                  key={a.id}
                  className={`px-4 py-3 space-y-1.5 ${isPostRevival ? 'bg-amber-50/40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">{page * perPage + i + 1}.</span>
                      <span className="font-medium text-gray-900 text-sm truncate">{a.full_name}</span>
                      {isPostRevival && (
                        <span className="flex-shrink-0 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                          post-revival
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelected(a)}
                      className="flex-shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {a.institution && (
                      <span className="truncate">{a.institution}</span>
                    )}
                   
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                   
                    {a.designation && (
                      <>
                        <span className="text-gray-300 hidden empty:hidden">·</span>
                        <span className="truncate">{a.designation}</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(a.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Rows:</label>
            <select
              value={perPage}
              onChange={e => setPerPage(Number(e.target.value))}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {perPageOptions.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              {totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">{selected.full_name}</h3>
              <button
                onClick={() => setSelected(null)}
                className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-gray-900">{selected.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-900">{selected.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Institution</p>
                  <p className="text-sm text-gray-900">{selected.institution || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BadgeInfo className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Designation</p>
                  <p className="text-sm text-gray-900">{selected.designation || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-sm text-gray-900">{selected.location_label || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Check-in Time</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selected.created_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
