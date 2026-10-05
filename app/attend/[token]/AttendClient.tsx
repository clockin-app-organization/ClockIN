'use client'

import { useEffect, useState, useRef } from 'react'
import {
  getOrCreateDeviceId,
  getCachedAttendee,
  setCachedAttendee,
  hasSubmittedForScope,
  markSubmitted,
  haversineDistance,
} from '@/lib/utils'
import { validateAttendanceForm } from '@/lib/validation'
import type { TokenPayload } from '@/lib/types'
import { X, CheckCircle2, Loader2, MapPin, AlertCircle, RefreshCw, Search } from 'lucide-react'

type LocState = 'requesting' | 'granted' | 'denied' | 'unsupported'
type MdaLoadState = 'idle' | 'loading' | 'ready' | 'error'

interface AttendClientProps {
  token: string
  eventData: TokenPayload
  maxDistance: number
}

export default function AttendClient({
  token,
  eventData,
  maxDistance,
}: AttendClientProps) {
  const [pageState,   setPageState]   = useState<'form' | 'success' | 'error'>('form')
  const [fatalError,  setFatalError]  = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting,  setSubmitting]  = useState(false)
  const [location,    setLocation]    = useState<{ lat: number; lng: number } | null>(null)
  const [locLabel,    setLocLabel]    = useState('')
  const [locState,    setLocState]    = useState<LocState>('requesting')
  const locStarted = useRef(false)

  const [form, setForm] = useState({
    full_name:   '',
    email:       '',
    phone:       '',
    institution: '',
    mda:         '',
    designation: '',
  })

  const [isMda,        setIsMda]        = useState(false)
  const [mdas,         setMdas]         = useState<{ id: string; name: string }[]>([])
  const [mdaQuery,     setMdaQuery]     = useState('')
  const [mdaOpen,      setMdaOpen]      = useState(false)
  const [mdaLoadState, setMdaLoadState] = useState<MdaLoadState>('idle')
  const mdaLoadTimerRef = useRef<number | null>(null)
  const mdaRequestStartedRef = useRef(false)

  function startLocationRequest() {
    if (!navigator.geolocation) {
      setLocState('unsupported')
      return
    }
    setLocState('requesting')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        const coordinateLabel = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        setLocation({ lat, lng })
        setLocLabel(coordinateLabel)
        setLocState('granted')
        const controller = new AbortController()
        const timeout = window.setTimeout(() => controller.abort(), 2500)
        fetch(
          `/api/location/reverse?lat=${lat}&lng=${lng}`,
          { signal: controller.signal },
        )
          .then(r => {
            if (!r.ok) throw new Error('Reverse geocoding request failed')
            return r.json() as Promise<{ label: string }>
          })
          .then(data => setLocLabel(data.label))
          .catch(() => setLocLabel(coordinateLabel))
          .finally(() => window.clearTimeout(timeout))
      },
      err => {
        console.warn('[location] error', err.code, err.message)
        setLocState('denied')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  }

  async function loadMdas() {
    if (mdaRequestStartedRef.current) return

    mdaRequestStartedRef.current = true

    try {
      const response = await fetch('/api/mdas/options')
      if (!response.ok) throw new Error('Failed to load MDA options')

      const { mdas: mdaList } = await response.json()
      if (!Array.isArray(mdaList)) throw new Error('Invalid MDA options response')

      setMdas(mdaList)
      setMdaLoadState('ready')
    } catch (error) {
      console.error('Failed to load MDA options', error)
      mdaRequestStartedRef.current = false
      setMdaLoadState('error')
    }
  }

  function scheduleMdaLoad() {
    if (mdaLoadState === 'ready' || mdaRequestStartedRef.current || mdaLoadTimerRef.current) return

    setMdaLoadState('loading')
    mdaLoadTimerRef.current = window.setTimeout(() => {
      mdaLoadTimerRef.current = null
      void loadMdas()
    }, 250)
  }

  function cancelMdaLoad() {
    if (!mdaLoadTimerRef.current) return

    window.clearTimeout(mdaLoadTimerRef.current)
    mdaLoadTimerRef.current = null
    setMdaLoadState('idle')
  }

  useEffect(() => {
    if (!locStarted.current) {
      locStarted.current = true
      startLocationRequest()
    }

    const scopeId = eventData._token_type === 'session'
      ? (eventData.session_id ?? eventData.id)
      : eventData.id

    if (hasSubmittedForScope(scopeId)) {
      setTimeout(() => {
        setFatalError('You have already checked in for this event.')
        setPageState('error')
      }, 0)
      return
    }

    const cached = getCachedAttendee()
    if (cached) {
      setTimeout(() => {
        setForm({
          full_name:   cached.full_name   ?? '',
          email:       cached.email       ?? '',
          phone:       cached.phone       ?? '',
          institution: cached.institution ?? '',
          mda:         '',
          designation: cached.designation ?? '',
        })
      }, 0)
    }

    return () => {
      if (mdaLoadTimerRef.current) window.clearTimeout(mdaLoadTimerRef.current)
    }
  }, [eventData])

  const eventLat = eventData._token_type === 'session' ? eventData.event_lat : eventData.lat
  const eventLng = eventData._token_type === 'session' ? eventData.event_lng : eventData.lng
  const eventCoords = eventLat != null && eventLng != null ? { lat: eventLat, lng: eventLng } : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!location) {
      errs.location = locState === 'denied'
        ? 'Location access was denied. Enable it in your browser settings and tap Retry.'
        : 'Still fetching your location — please wait a moment.'
    }

    if (location && eventCoords) {
      const distance = haversineDistance(
        location.lat,
        location.lng,
        eventCoords.lat,
        eventCoords.lng
      )
      const MAX_DISTANCE = maxDistance
      if (distance > MAX_DISTANCE) {
        errs.location = `You are too far from the event location (${distance.toFixed(0)}m away). Please move closer.`
        setFieldErrors(errs)
        return
      }
    }

    const ve = validateAttendanceForm({
      full_name:   form.full_name,
      email:       form.email,
      phone:       form.phone,
      institution: form.institution,
      designation: form.designation,
    })
    Object.assign(errs, ve)

    if (!form.institution.trim()) errs.institution = 'Institution is required.'
    if (!form.designation.trim()) errs.designation = 'Designation is required.'

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setSubmitting(true)

    const scopeId = eventData._token_type === 'session'
      ? (eventData.session_id ?? eventData.id)
      : eventData.id

    const response = await fetch('/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        full_name:          form.full_name.trim(),
        email:              form.email.trim(),
        phone:              form.phone.trim(),
        institution:        form.institution.trim(),
        mda:                isMda ? form.mda.trim() || null : null,
        designation:        form.designation.trim(),
        device_fingerprint: getOrCreateDeviceId(),
        lat:                location!.lat,
        lng:                location!.lng,
        location_label:     locLabel || null,
      }),
    }).catch(() => null)

    const result = response ? await response.json().catch(() => null) : null

    if (!response?.ok) {
      let msg = result?.error || 'Unable to record your attendance. Please try again.'
      if (msg.includes('duplicate') || msg.includes('unique')) {
        if (msg.includes('phone')) {
          msg = 'This phone number has already been used for this event/session.'
        } else if (msg.includes('email')) {
          msg = 'This email has already been used for this event/session.'
        } else {
          msg = 'You have already checked in from this device.'
        }
      }
      setFieldErrors({ _form: msg })
      setSubmitting(false)
      return
    }

    setCachedAttendee({ ...form, mda: isMda ? form.mda : '' })
    markSubmitted(scopeId)
    setPageState('success')
    setSubmitting(false)
  }

  const eventTitle  = eventData.event_name ?? eventData.name ?? ''
  const sessionName = eventData._token_type === 'session' ? eventData.name : null

  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center dark:bg-slate-900">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
          <X className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Check-in unavailable</h1>
        <p className="text-sm text-gray-500 max-w-xs dark:text-slate-400">{fatalError}</p>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-green-50 to-white p-6 text-center dark:from-slate-950 dark:to-slate-900">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checked in!</h1>
        <p className="text-gray-500 dark:text-slate-300">
          Your attendance at <strong>{eventTitle}</strong>
          {sessionName ? ` — ${sessionName}` : ''} has been recorded.
        </p>
        {location && (
          <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-400">
            <MapPin className="h-3 w-3" />
            {locLabel || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
          </p>
        )}
        <button
          onClick={() => { window.close(); window.location.href = 'about:blank' }}
          className="btn-primary mt-4 flex items-center gap-2"
        >
          <X className="h-4 w-4" /> Close
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="card p-6 space-y-5">

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight dark:text-white">{eventTitle}</h1>
              {sessionName && (
                <p className="mt-0.5 text-sm text-indigo-600 font-medium dark:text-indigo-300">Session: {sessionName}</p>
              )}
            </div>
          </div>

          {locState === 'requesting' && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              Requesting your location — please allow when prompted.
            </div>
          )}
          {locState === 'granted' && location && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
              <MapPin className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
              <span className="min-w-0 truncate">
                {locLabel || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
              </span>
            </div>
          )}
          {(locState === 'denied' || locState === 'unsupported') && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-800 space-y-2 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-semibold">Location required</p>
                  <p className="mt-0.5">
                    {locState === 'unsupported'
                      ? 'Your browser does not support location. Try Chrome or Safari.'
                      : 'Enable location in your browser settings, then tap Retry.'}
                  </p>
                </div>
              </div>
              {locState === 'denied' && (
                <button
                  type="button"
                  onClick={startLocationRequest}
                  className="flex items-center gap-1.5 rounded-md bg-red-100 px-2.5 py-1.5 font-medium hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry location
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text" name="full_name" autoComplete="name"
                placeholder="Full name *"
                value={form.full_name}
                onChange={e => {
                  const v = e.target.value
                  setForm(f => ({ ...f, full_name: v }))
                  if (fieldErrors.full_name) setFieldErrors(p => { const c = { ...p }; delete c.full_name; return c })
                }}
                className={`input-base ${fieldErrors.full_name ? 'border-red-300 focus:border-red-400' : ''}`}
                maxLength={32} required
              />
              {fieldErrors.full_name && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.full_name}</p>}
            </div>

            <div>
              <input
                type="email" name="email" autoComplete="email"
                placeholder="Email address *"
                value={form.email}
                onChange={e => {
                  const v = e.target.value
                  setForm(f => ({ ...f, email: v }))
                  if (fieldErrors.email) setFieldErrors(p => { const c = { ...p }; delete c.email; return c })
                }}
                className={`input-base ${fieldErrors.email ? 'border-red-300 focus:border-red-400' : ''}`}
                required
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.email}</p>}
            </div>

            <div>
              <input
                type="tel" name="phone" autoComplete="tel-national"
                placeholder="Phone number *"
                value={form.phone}
                onChange={e => {
                  const v = e.target.value
                  setForm(f => ({ ...f, phone: v }))
                  if (fieldErrors.phone) setFieldErrors(p => { const c = { ...p }; delete c.phone; return c })
                }}
                className={`input-base ${fieldErrors.phone ? 'border-red-300 focus:border-red-400' : ''}`}
                maxLength={15} required
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.phone}</p>}
            </div>

            <div>
              <input
                type="text" name="institution" autoComplete="organization"
                placeholder="Institution *"
                value={form.institution}
                onChange={e => {
                  const v = e.target.value
                  setForm(f => ({ ...f, institution: v }))
                  if (fieldErrors.institution) setFieldErrors(p => { const c = { ...p }; delete c.institution; return c })
                }}
                className={`input-base ${fieldErrors.institution ? 'border-red-300 focus:border-red-400' : ''}`}
                required
              />
              {fieldErrors.institution && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.institution}</p>}
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">I represent an MDA</span>
                  <span className="block text-xs text-gray-500 dark:text-slate-400">Enable this only if you are checking in on behalf of an MDA.</span>
                </span>
                <input
                  type="checkbox"
                  checked={isMda}
                  onChange={e => {
                    const checked = e.target.checked
                    setIsMda(checked)
                    if (!checked) {
                      setForm(f => ({ ...f, mda: '' }))
                      setMdaQuery('')
                      setMdaOpen(false)
                      cancelMdaLoad()
                    }
                  }}
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 flex-shrink-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-indigo-600 peer-checked:[&>span]:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 dark:bg-slate-600">
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
                </span>
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
                <input
                  type="text"
                  role="combobox"
                  aria-expanded={isMda && mdaOpen}
                  aria-controls="attendee-mda-listbox"
                  aria-autocomplete="list"
                  autoComplete="off"
                  disabled={!isMda}
                  placeholder={mdas.length ? 'Start typing and select your MDA' : 'MDA'}
                  value={mdaQuery}
                  onChange={e => {
                    const v = e.target.value
                    setMdaQuery(v)
                    const exact = mdas.find(m => m.name.toLowerCase() === v.trim().toLowerCase())
                    setForm(f => ({ ...f, mda: exact ? exact.name : v.trim() }))
                    if (fieldErrors.mda) setFieldErrors(p => { const c = { ...p }; delete c.mda; return c })
                    setMdaOpen(true)
                    scheduleMdaLoad()
                  }}
                  onFocus={() => {
                    setMdaOpen(true)
                    scheduleMdaLoad()
                  }}
                  onBlur={() => {
                    setTimeout(() => setMdaOpen(false), 120)
                    cancelMdaLoad()
                  }}
                  className="input-base pl-9 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {form.mda && (
                  <button
                    type="button"
                    aria-label="Clear MDA"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setForm(f => ({ ...f, mda: '' }))
                      setMdaQuery('')
                      setMdaOpen(false)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {mdaOpen && (
                <ul
                  id="attendee-mda-listbox"
                  role="listbox"
                  className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                >
                  {(() => {
                    const q = mdaQuery.trim().toLowerCase()
                    const matches = q ? mdas.filter(m => m.name.toLowerCase().includes(q)) : mdas
                    if (matches.length === 0) {
                      return (
                        <li className="px-4 py-2 text-sm text-gray-500 dark:text-slate-400">No MDA found matching “{mdaQuery.trim()}”.</li>
                      )
                    }
                    return matches.map(m => (
                      <li key={m.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={m.name === form.mda}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setForm(f => ({ ...f, mda: m.name }))
                            setMdaQuery(m.name)
                            setMdaOpen(false)
                          }}
                          className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-indigo-50 dark:hover:bg-slate-700 ${
                            m.name === form.mda
                              ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-slate-700 dark:text-white'
                              : 'text-gray-700 dark:text-slate-200'
                          }`}
                        >
                          {m.name}
                        </button>
                      </li>
                    ))
                  })()}
                </ul>
              )}
              {fieldErrors.mda && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.mda}</p>}
            </div>

            <div>
              <input
                type="text" name="designation" autoComplete="organization-title"
                placeholder="Designation / Role *"
                value={form.designation}
                onChange={e => {
                  const v = e.target.value
                  setForm(f => ({ ...f, designation: v }))
                  if (fieldErrors.designation) setFieldErrors(p => { const c = { ...p }; delete c.designation; return c })
                }}
                className={`input-base ${fieldErrors.designation ? 'border-red-300 focus:border-red-400' : ''}`}
                required
              />
              {fieldErrors.designation && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.designation}</p>}
            </div>

            {fieldErrors.location && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">{fieldErrors.location}</p>
            )}
            {fieldErrors._form && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">{fieldErrors._form}</p>
            )}

            <button
              type="submit"
              disabled={submitting || locState === 'requesting'}
              className="btn-primary w-full disabled:opacity-60"
            >
              {submitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : locState === 'requesting'
                ? 'Waiting for location…'
                : 'Check In'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
