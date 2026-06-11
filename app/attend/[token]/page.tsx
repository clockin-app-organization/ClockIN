// app/attend/[token]/page.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  getOrCreateDeviceId,
  getCachedAttendee,
  setCachedAttendee,
  hasSubmittedForScope,
  markSubmitted,
} from '@/lib/utils'
import { validateAttendanceForm } from '@/lib/validation'
import type { TokenPayload } from '@/lib/types'
import { Camera, X, CheckCircle2, Loader2, Clock, MapPin } from 'lucide-react'

export default function AttendPage() {
  const params   = useParams()
  const token    = params.token as string
  const supabase = createClient()

  const [eventData,  setEventData]  = useState<TokenPayload | null>(null)
  const [pageState,  setPageState]  = useState<'loading' | 'form' | 'success' | 'error'>('loading')
  const [fatalError, setFatalError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expiry,     setExpiry]     = useState<number | null>(null)
  const [location,   setLocation]   = useState<{ lat: number; lng: number } | null>(null)
  const [locLabel,   setLocLabel]   = useState<string>('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [form, setForm] = useState({
    full_name:   '',
    email:       '',
    phone:       '',
    institution: '',
    designation: '',
  })

  // ── 1. Validate token ─────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.rpc('validate_attendance_token', { p_token: token })

      if (error || !data) {
        setFatalError('This QR code is invalid or has expired.')
        setPageState('error')
        return
      }

      const payload = data as TokenPayload
      setEventData(payload)

      // Pre-fill from local cache
      const cached = getCachedAttendee()
      if (cached) {
        setForm({
          full_name:   cached.full_name   ?? '',
          email:       cached.email       ?? '',
          phone:       cached.phone       ?? '',
          institution: cached.institution ?? '',
          designation: cached.designation ?? '',
        })
      }

      // Check if already submitted for this scope
      // For sessions the scope is the session id; for events it's the event id
      const scopeId = payload._token_type === 'session'
        ? (payload.session_id ?? payload.id)
        : payload.id

      if (hasSubmittedForScope(scopeId)) {
        setFatalError('You have already checked in for this event.')
        setPageState('error')
        return
      }

      // 5-minute countdown
      setExpiry(300)
      timerRef.current = setInterval(() => {
        setExpiry(prev => {
          if (!prev || prev <= 1) {
            clearInterval(timerRef.current!)
            setFatalError('This QR session has expired. Please scan the code again.')
            setPageState('error')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setPageState('form')
    })()

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [token]) // supabase is stable, token never changes

  // ── 2. Capture geolocation ────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setLocation({ lat, lng })
        // Reverse-geocode label using Nominatim (free, no API key)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then(r => r.json())
          .then(d => {
            const parts = [d.address?.suburb, d.address?.city, d.address?.country].filter(Boolean)
            setLocLabel(parts.join(', '))
          })
          .catch(() => {})
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  // ── 3. Submit ─────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError('')

    const validationErrors = validateAttendanceForm({
      full_name: form.full_name,
      email:     form.email,
      phone:     form.phone,
    })
    if (Object.keys(validationErrors).length > 0) {
      setFieldError(Object.values(validationErrors)[0])
      return
    }

    if (!eventData) return

    const scopeId = eventData._token_type === 'session'
      ? (eventData.session_id ?? eventData.id)
      : eventData.id

    setSubmitting(true)

    const { error: submitError } = await supabase.from('attendees').insert({
      event_id:           eventData._token_type === 'session' ? eventData.event_id! : eventData.id,
      session_id:         eventData._token_type === 'session' ? (eventData.session_id ?? eventData.id) : null,
      full_name:          form.full_name.trim(),
      email:              form.email.trim(),
      phone:              form.phone.trim(),
      institution:        form.institution.trim() || null,
      designation:        form.designation.trim() || null,
      device_fingerprint: getOrCreateDeviceId(),
      qr_token_used:      token,
      lat:                location?.lat ?? null,
      lng:                location?.lng ?? null,
      location_label:     locLabel || null,
    })

    if (submitError) {
      setFieldError(
        submitError.message.includes('duplicate')
          ? 'You have already checked in for this event.'
          : submitError.message
      )
      setSubmitting(false)
      return
    }

    // Cache form values for next scan
    setCachedAttendee(form)
    markSubmitted(scopeId)

    // Stop the expiry timer
    if (timerRef.current) clearInterval(timerRef.current)

    setPageState('success')
    setSubmitting(false)
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const timeLeft = expiry !== null
    ? `${Math.floor(expiry / 60)}:${String(expiry % 60).padStart(2, '0')}`
    : null

  const eventTitle = eventData?.event_name ?? eventData?.name ?? ''
  const sessionName = eventData?._token_type === 'session' ? eventData?.name : null

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    )
  }

  // ── Fatal error ───────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <X className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Check-in unavailable</h1>
        <p className="text-sm text-gray-500 max-w-xs">{fatalError}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary flex items-center gap-2 mt-2"
        >
          <Camera className="h-4 w-4" /> Scan again
        </button>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-green-50 to-white p-6 text-center">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900">Checked in!</h1>
        <p className="text-gray-500">
          Your attendance at <strong>{eventTitle}</strong>
          {sessionName ? ` (${sessionName})` : ''} has been recorded.
        </p>
        {location && (
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="h-3 w-3" /> {locLabel || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
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

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{eventTitle}</h1>
              {sessionName && (
                <p className="mt-0.5 text-sm text-indigo-600 font-medium">Session: {sessionName}</p>
              )}
              {location && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" />
                  {locLabel || 'Location captured'}
                </p>
              )}
            </div>
            {timeLeft && (
              <div className={`flex items-center gap-1 text-sm font-medium flex-shrink-0 ${
                expiry && expiry < 60 ? 'text-red-600' : 'text-orange-600'
              }`}>
                <Clock className="h-4 w-4" /> {timeLeft}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Full name *"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="input-base"
                maxLength={32}
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email address *"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-base"
                required
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Phone number *"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-base"
                maxLength={15}
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Institution (optional)"
                value={form.institution}
                onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Designation (optional)"
                value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                className="input-base"
              />
            </div>

            {fieldError && (
              <p className="text-xs text-red-600 rounded-lg bg-red-50 px-3 py-2">{fieldError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : 'Check In'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}