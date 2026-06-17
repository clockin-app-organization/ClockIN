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
import { X, CheckCircle2, Loader2, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react'

type LocState = 'requesting' | 'granted' | 'denied' | 'unsupported'

// Supabase client is stable across renders — create once outside the component
// so it never appears in dependency arrays.
const supabase = createClient()

export default function AttendPage() {
  const params = useParams()
  const token  = params.token as string

  const [eventData,   setEventData]   = useState<TokenPayload | null>(null)
  const [pageState,   setPageState]   = useState<'loading' | 'form' | 'success' | 'error'>('loading')
  const [fatalError,  setFatalError]  = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting,  setSubmitting]  = useState(false)
  const [expiry,      setExpiry]      = useState<number | null>(null)
  const [location,    setLocation]    = useState<{ lat: number; lng: number } | null>(null)
  const [locLabel,    setLocLabel]    = useState('')
  const [locState,    setLocState]    = useState<LocState>('requesting')
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const locStarted = useRef(false)   // prevent double-firing in StrictMode

  const [form, setForm] = useState({
    full_name:   '',
    email:       '',
    phone:       '',
    institution: '',
    designation: '',
  })

  // ── Geolocation ───────────────────────────────────────────────────────────
  // Not a useCallback — called imperatively so it never sits in a dep array.
  function startLocationRequest() {
    if (!navigator.geolocation) {
      setLocState('unsupported')
      return
    }
    setLocState('requesting')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setLocation({ lat, lng })
        setLocState('granted')
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        )
          .then(r => r.json())
          .then(d => {
            const addr  = d.address ?? {}
            const parts = [
              addr.road ?? addr.suburb ?? addr.neighbourhood,
              addr.city ?? addr.town   ?? addr.village,
              addr.country,
            ].filter(Boolean)
            setLocLabel(parts.length ? parts.join(', ') : `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          })
          .catch(() => setLocLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`))
      },
      err => {
        console.warn('[location] error', err.code, err.message)
        setLocState('denied')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  // ── Token validation (runs once on mount) ────────────────────────────────
 useEffect(() => {
  // Start location fetch in parallel — no setState called synchronously
  if (!locStarted.current) {
    locStarted.current = true;
    setTimeout(startLocationRequest, 0);
  }

  let active = true;

  // ⬇️ Run sync first, then validate
  (async () => {
    try {
      await supabase.rpc('sync_event_statuses');
    } catch (e) {
      console.error('Failed to sync event statuses', e);
    }
    return supabase.rpc('validate_attendance_token', { p_token: token });
  })().then(({ data, error }) => {
    if (!active) return;

    if (error || !data) {
      setFatalError('This QR code is invalid or has expired.');
      setPageState('error');
      return;
    }

    const payload = data as TokenPayload;
    setEventData(payload);

    // Pre-fill from local cache
    const cached = getCachedAttendee();
    if (cached) {
      setForm({
        full_name:   cached.full_name   ?? '',
        email:       cached.email       ?? '',
        phone:       cached.phone       ?? '',
        institution: cached.institution ?? '',
        designation: cached.designation ?? '',
      });
    }

    const scopeId = payload._token_type === 'session'
      ? (payload.session_id ?? payload.id)
      : payload.id;

    if (hasSubmittedForScope(scopeId)) {
      setFatalError('You have already checked in for this event.');
      setPageState('error');
      return;
    }

    // 5-minute countdown
    setExpiry(300);
    timerRef.current = setInterval(() => {
      setExpiry(prev => {
        if (!prev || prev <= 1) {
          clearInterval(timerRef.current!);
          setFatalError('QR session expired. Please scan again.');
          setPageState('error');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setPageState('form');
  });

  return () => {
    active = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]); // token never changes; supabase is stable

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!location) {
      errs.location = locState === 'denied'
        ? 'Location access was denied. Enable it in your browser settings and tap Retry.'
        : 'Still fetching your location — please wait a moment.'
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

    if (!eventData) return
    setSubmitting(true)

    const scopeId = eventData._token_type === 'session'
      ? (eventData.session_id ?? eventData.id)
      : eventData.id

    const { error: submitError } = await supabase.from('attendees').insert({
      event_id:           eventData._token_type === 'session' ? eventData.event_id! : eventData.id,
      session_id:         eventData._token_type === 'session' ? (eventData.session_id ?? eventData.id) : null,
      full_name:          form.full_name.trim(),
      email:              form.email.trim(),
      phone:              form.phone.trim(),
      institution:        form.institution.trim(),
      designation:        form.designation.trim(),
      device_fingerprint: getOrCreateDeviceId(),
      qr_token_used:      token,
      lat:                location!.lat,
      lng:                location!.lng,
      location_label:     locLabel || null,
    })

    if (submitError) {
      let msg = submitError.message;
      if (msg.includes('duplicate') || msg.includes('unique')) {
        if (msg.includes('phone')) {
          msg = 'This phone number has already been used for this event/session.';
        } else if (msg.includes('email')) {
          msg = 'This email has already been used for this event/session.';
        } else {
          msg = 'You have already checked in from this device.';
        }
      }
      setFieldErrors({ _form: msg });
    }

    setCachedAttendee(form)
    markSubmitted(scopeId)
    if (timerRef.current) clearInterval(timerRef.current)
    setPageState('success')
    setSubmitting(false)
  }

  const timeLeft    = expiry !== null ? `${Math.floor(expiry / 60)}:${String(expiry % 60).padStart(2, '0')}` : null
  const eventTitle  = eventData?.event_name ?? eventData?.name ?? ''
  const sessionName = eventData?._token_type === 'session' ? eventData?.name : null

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <X className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Check-in unavailable</h1>
        <p className="text-sm text-gray-500 max-w-xs">{fatalError}</p>
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
          {sessionName ? ` — ${sessionName}` : ''} has been recorded.
        </p>
        {location && (
          <p className="flex items-center gap-1 text-xs text-gray-400">
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

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{eventTitle}</h1>
              {sessionName && (
                <p className="mt-0.5 text-sm text-indigo-600 font-medium">Session: {sessionName}</p>
              )}
            </div>
            {timeLeft && (
              <div className={`flex items-center gap-1 text-sm font-medium flex-shrink-0 ${
                expiry && expiry < 60 ? 'text-red-600' : 'text-orange-500'
              }`}>
                <Clock className="h-4 w-4" /> {timeLeft}
              </div>
            )}
          </div>

          {/* Location banner */}
          {locState === 'requesting' && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-800">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              Requesting your location — please allow when prompted.
            </div>
          )}
          {locState === 'granted' && location && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-800">
              <MapPin className="h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="min-w-0 truncate">
                {locLabel || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
              </span>
            </div>
          )}
          {(locState === 'denied' || locState === 'unsupported') && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-800 space-y-2">
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
                  className="flex items-center gap-1.5 rounded-md bg-red-100 px-2.5 py-1.5 font-medium hover:bg-red-200"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry location
                </button>
              )}
            </div>
          )}

          {/* Fields */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {(
              [
                { key: 'full_name',   type: 'text',  ph: 'Full name *',          max: 32 },
                { key: 'email',       type: 'email', ph: 'Email address *'               },
                { key: 'phone',       type: 'tel',   ph: 'Phone number *',        max: 15 },
                { key: 'institution', type: 'text',  ph: 'Institution *'                 },
                { key: 'designation', type: 'text',  ph: 'Designation / Role *'          },
              ] as Array<{ key: keyof typeof form; type: string; ph: string; max?: number }>
            ).map(({ key, type, ph, max }) => (
              <div key={key}>
                <input
                  type={type}
                  placeholder={ph}
                  value={form[key]}
                  onChange={e => {
                    const v = e.target.value
                    setForm(f => ({ ...f, [key]: v }))
                    if (fieldErrors[key]) setFieldErrors(p => { const c = { ...p }; delete c[key]; return c })
                  }}
                  className={`input-base ${fieldErrors[key] ? 'border-red-300 focus:border-red-400' : ''}`}
                  maxLength={max}
                  required
                />
                {fieldErrors[key] && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors[key]}</p>
                )}
              </div>
            ))}

            {fieldErrors.location && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{fieldErrors.location}</p>
            )}
            {fieldErrors._form && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{fieldErrors._form}</p>
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