import { NextResponse } from 'next/server'

type ReverseGeocodeResponse = {
  address?: {
    road?: string
    suburb?: string
    neighbourhood?: string
    city?: string
    town?: string
    village?: string
    country?: string
  }
}

const locationCache = new Map<string, string>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawLat = searchParams.get('lat')
  const rawLng = searchParams.get('lng')
  const lat = Number(rawLat)
  const lng = Number(rawLng)

  if (
    rawLat === null || rawLat.trim() === '' ||
    rawLng === null || rawLng.trim() === '' ||
    !Number.isFinite(lat) || !Number.isFinite(lng)
  ) {
    return NextResponse.json({ error: 'Valid lat and lng parameters are required' }, { status: 400 })
  }

  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`
  const cachedLabel = locationCache.get(cacheKey)

  if (cachedLabel !== undefined) {
    return NextResponse.json({ label: cachedLabel })
  }

  const coordinateLabel = `${lat.toFixed(5)}, ${lng.toFixed(5)}`

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'AttendanceApp/1.0 (admin@yourdomain.com)',
          'Accept-Language': 'en',
        },
        next: { revalidate: 86400 },
      },
    )

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status ${response.status}`)
    }

    const data = await response.json() as ReverseGeocodeResponse
    const address = data.address ?? {}
    const parts = [
      address.road ?? address.suburb ?? address.neighbourhood,
      address.city ?? address.town ?? address.village,
      address.country,
    ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    const label = parts.join(', ') || coordinateLabel

    locationCache.set(cacheKey, label)
    return NextResponse.json({ label })
  } catch {
    return NextResponse.json({ label: coordinateLabel })
  }
}