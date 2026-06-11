// components/attendance/HeatMap.tsx
'use client'
import { useEffect, useRef } from 'react'
import type { Attendee } from '@/lib/types'
import { clusterAttendees } from '@/lib/utils'

interface Props {
  attendees: Attendee[]
  centerLat?: number
  centerLng?: number
}

export default function HeatMap({ attendees, centerLat, centerLng }: Props) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return

    let cancelled = false

    // Tear down any existing instance before rebuilding
    if (mapInstanceRef.current) {
      ;(mapInstanceRef.current as any).remove()
      mapInstanceRef.current = null
    }

    import('leaflet').then((L) => {
      // Guard: cleanup already ran while we were importing
      if (cancelled || !mapRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const valid = attendees.filter(a => a.lat != null && a.lng != null)
      const lat   = centerLat ?? valid[0]?.lat ?? 8.484
      const lng   = centerLng ?? valid[0]?.lng ?? -13.234

      const map = L.map(mapRef.current!).setView([lat, lng], 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      if (!valid.length) return

      const { green } = clusterAttendees(valid.map(a => ({ id: a.id, lat: a.lat!, lng: a.lng! })))

      valid.forEach(a => {
        const isGreen = green.has(a.id)
        const color   = isGreen ? '#16A34A' : '#DC2626'

        const icon = L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
          iconSize:   [16, 16],
          iconAnchor: [8, 8],
        })

        L.marker([a.lat!, a.lng!], { icon })
          .bindPopup(`
            <div style="font-size:12px;line-height:1.5;min-width:140px">
              <strong>${a.full_name}</strong><br/>
              ${a.institution ?? ''}<br/>
              <span style="color:${color};font-weight:600">${isGreen ? '✓ Matched location' : '⚠ Different location'}</span>
              ${a.location_label ? `<br/><span style="color:#6B7280">${a.location_label}</span>` : ''}
            </div>
          `)
          .addTo(map)
      })

      if (valid.length > 1) {
        map.fitBounds(
          L.latLngBounds(valid.map(a => [a.lat!, a.lng!] as [number, number])),
          { padding: [40, 40] }
        )
      }
    })

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        ;(mapInstanceRef.current as any).remove()
        mapInstanceRef.current = null
      }
    }
  }, [attendees, centerLat, centerLng])  // re-runs when data changes — no separate effect needed

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200" style={{ height: 360 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div className="absolute bottom-3 left-3 z-[400] flex flex-col gap-1 rounded-xl border border-gray-200 bg-white/95 p-2.5 text-xs shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-1.5 font-semibold text-gray-700">Location heatmap</div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-600 ring-1 ring-white" />
          <span className="text-gray-600">Matched location (majority)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-600 ring-1 ring-white" />
          <span className="text-gray-600">Different location</span>
        </div>
      </div>
    </div>
  )
}