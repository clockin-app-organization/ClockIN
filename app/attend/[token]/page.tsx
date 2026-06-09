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
import { Camera, X, CheckCircle2, Loader2, Clock } from 'lucide-react'

export default function AttendPage() {
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [eventData, setEventData] = useState<TokenPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    institution: '',
    designation: '',
  })
  const [error, setError] = useState('')
  const [expiry, setExpiry] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Validate token and set up expiry timer
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('validate_attendance_token', { p_token: token })
      if (error || !data) {
        setError('Invalid or expired QR code.')
        setLoading(false)
        return
      }
      setEventData(data as TokenPayload)
      setLoading(false)

      // Pre‑fill from cache
      const cached = getCachedAttendee()
      if (cached) {
        setForm({
          full_name: cached.full_name || '',
          email: cached.email || '',
          phone: cached.phone || '',
          institution: cached.institution || '',
          designation: cached.designation || '',
        })
      }

      // 5‑minute expiry
      setExpiry(300)
      timerRef.current = setInterval(() => {
        setExpiry(prev => {
          if (prev && prev <= 1) {
            clearInterval(timerRef.current!)
            setError('QR code expired. Please scan again.')
            return 0
          }
          return (prev ?? 300) - 1
        })
      }, 1000)
    })()

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [token, supabase])   // ← added supabase to dependencies

  // Capture geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Validate input
    const validationErrors = validateAttendanceForm({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
    })
    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors).join(' '))
      setSubmitting(false)
      return
    }

    if (!eventData) {
      setError('Event data not loaded.')
      setSubmitting(false)
      return
    }

    const scopeId = eventData._token_type === 'session' ? eventData.id : eventData.id
    if (hasSubmittedForScope(scopeId)) {
      setError('You have already checked in for this.')
      setSubmitting(false)
      return
    }

    const deviceId = getOrCreateDeviceId()

    const { error: submitError } = await supabase.from('attendees').insert({
      event_id: eventData._token_type === 'session' ? eventData.event_id! : eventData.id,
      session_id: eventData._token_type === 'session' ? eventData.id : null,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      institution: form.institution.trim(),
      designation: form.designation.trim(),
      device_fingerprint: deviceId,
      qr_token_used: token,
      lat: location?.lat,
      lng: location?.lng,
    })

    if (submitError) {
      if (submitError.message.includes('duplicate')) {
        setError('Duplicate submission detected.')
      } else {
        setError(submitError.message)
      }
      setSubmitting(false)
      return
    }

    // Cache attendee data for next time
    setCachedAttendee({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      institution: form.institution.trim(),
      designation: form.designation.trim(),
    })
    markSubmitted(scopeId)
    setSubmitted(true)
  }

  function handleClose() {
    window.close()
    // Fallback: redirect to blank page
    window.location.href = 'about:blank'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    )
  }

  if (error && !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const timeLeft = expiry !== null
    ? `${Math.floor(expiry / 60)}:${String(expiry % 60).padStart(2, '0')}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!submitted ? (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold">
                  {eventData?.name || eventData?.event_name}
                </h1>
                <p className="text-sm text-gray-500">
                  {eventData?._token_type === 'session'
                    ? 'Session: ' + eventData?.name
                    : 'Event'}
                </p>
              </div>
              {timeLeft && (
                <div className="flex items-center text-sm text-orange-600">
                  <Clock className="h-4 w-4 mr-1" /> {timeLeft}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="input-base"
                maxLength={32}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-base"
                required
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="input-base"
                maxLength={15}
              />
              <input
                type="text"
                placeholder="Institution"
                value={form.institution}
                onChange={e => setForm({ ...form, institution: e.target.value })}
                className="input-base"
              />
              <input
                type="text"
                placeholder="Designation"
                value={form.designation}
                onChange={e => setForm({ ...form, designation: e.target.value })}
                className="input-base"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Check In
              </button>
              {expiry !== null && expiry <= 0 && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Camera className="h-4 w-4" /> Scan Again
                </button>
              )}
            </form>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Checked In!</h2>
            <p className="text-gray-500 mt-2">Your attendance has been recorded.</p>
            <button onClick={handleClose} className="btn-primary mt-6 w-full flex items-center justify-center gap-2">
              <X className="h-4 w-4" /> Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}