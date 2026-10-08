import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAttendanceToken } from '@/lib/token-validation'

const DEFAULT_MAX_DISTANCE = 150

type AttendeeInsertData = {
  event_id: string
  session_id: string | null
  full_name: string
  email: string | null
  phone: string
  institution: string
  designation: string
  device_fingerprint: string
  qr_token_used: string
  lat: number
  lng: number
  location_label: string | null
  mda?: string
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.token !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid token.' }, { status: 400 })
  }

  const {
    token,
    full_name,
    email,
    phone,
    institution,
    mda,
    designation,
    device_fingerprint,
    lat,
    lng,
    location_label,
  } = body

  if (!full_name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 })
  }
  if (!institution?.trim()) {
    return NextResponse.json({ error: 'Institution is required.' }, { status: 400 })
  }
  if (!designation?.trim()) {
    return NextResponse.json({ error: 'Designation is required.' }, { status: 400 })
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'Location coordinates are required.' }, { status: 400 })
  }
  if (!device_fingerprint) {
    return NextResponse.json({ error: 'Device fingerprint is required.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: payload, error: tokenError } = await validateAttendanceToken(token)

  if (tokenError || !payload) {
    return NextResponse.json(
      { error: 'This QR code is invalid or has expired.' },
      { status: 403 },
    )
  }

  const eventId = payload._token_type === 'session' ? payload.event_id : payload.id
  if (!eventId) {
    return NextResponse.json(
      { error: 'This QR code is invalid or has expired.' },
      { status: 403 },
    )
  }

  const eventLat = payload._token_type === 'session' ? payload.event_lat : payload.lat
  const eventLng = payload._token_type === 'session' ? payload.event_lng : payload.lng

  if (eventLat != null && eventLng != null) {
    const parsed = Number(process.env.GEOFENCE_MAX_DISTANCE)
    const maxDistance = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_DISTANCE

    const distance = haversineDistance(lat, lng, eventLat, eventLng)
    if (distance > maxDistance) {
      return NextResponse.json(
        { error: `You are too far from the event location (${distance.toFixed(0)}m away). Please move closer.` },
        { status: 403 },
      )
    }
  }

  const sessionId = payload._token_type === 'session' ? (payload.session_id ?? payload.id) : null

  const { data: existing } = await admin
    .from('attendees')
    .select('id')
    .eq('event_id', eventId)
    .eq('device_fingerprint', device_fingerprint)
    .maybeSingle()

  if (sessionId && !existing) {
    const { data: sessionDup } = await admin
      .from('attendees')
      .select('id')
      .eq('session_id', sessionId)
      .eq('device_fingerprint', device_fingerprint)
      .maybeSingle()

    if (sessionDup) {
      return NextResponse.json(
        { error: 'You have already checked in from this device.' },
        { status: 409 },
      )
    }
  }

  if (existing) {
    return NextResponse.json(
      { error: 'You have already checked in from this device.' },
      { status: 409 },
    )
  }

  const insertData: AttendeeInsertData = {
    event_id:           eventId,
    session_id:         sessionId,
    full_name:          full_name.trim(),
    email:              email?.trim() || null,
    phone:              phone.trim(),
    institution:        institution.trim(),
    designation:        designation.trim(),
    device_fingerprint,
    qr_token_used:      token,
    lat,
    lng,
    location_label:     location_label || null,
  }

  const trimmedMda = mda?.trim()
  if (trimmedMda) {
    insertData.mda = trimmedMda
  }

  let { error: insertError } = await admin.from('attendees').insert(insertData)

  if (insertError && insertData.mda && (insertError.message.includes('mda') || insertError.message.includes('schema cache'))) {
    delete insertData.mda
    const retry = await admin.from('attendees').insert(insertData)
    insertError = retry.error
  }

  if (insertError) {
    const msg = insertError.message
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: msg }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
