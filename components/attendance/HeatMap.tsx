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
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    if (typeof window === 'undefined') return

    // Dynamically import Leaflet (SSR-safe)
    import('leaflet').then((L) => {
      // Fix default marker icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const validAttendees = attendees.filter(a => a.lat != null && a.lng != null)

      // Determine map center
      const lat = centerLat ?? (validAttendees[0]?.lat ?? 8.484)   // Freetown default
      const lng = centerLng ?? (validAttendees[0]?.lng ?? -13.234)

      const map = L.map(mapRef.current!).setView([lat, lng], 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      if (validAttendees.length === 0) return

      // Cluster: green = plurality location, red = outliers
      const { green, red } = clusterAttendees(
        validAttendees.map(a => ({ id: a.id, lat: a.lat!, lng: a.lng! }))
      )

      validAttendees.forEach(a => {
        const isGreen = green.has(a.id)
        const color = isGreen ? '#16A34A' : '#DC2626'

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:16px;height:16px;border-radius:50%;
            background:${color};border:2px solid #fff;
            box-shadow:0 1px 4px rgba(0,0,0,.3)
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })

        const marker = L.marker([a.lat!, a.lng!], { icon })
        marker.bindPopup(`
          <div style="font-size:12px;line-height:1.5;min-width:140px">
            <strong>${a.full_name}</strong><br/>
            ${a.institution ?? ''}<br/>
            <span style="color:${color};font-weight:600">${isGreen ? '✓ Matched location' : '⚠ Different location'}</span>
            ${a.location_label ? `<br/><span style="color:#6B7280">${a.location_label}</span>` : ''}
          </div>
        `)
        marker.addTo(map)
      })

      // Fit map to all markers
      if (validAttendees.length > 1) {
        const bounds = L.latLngBounds(validAttendees.map(a => [a.lat!, a.lng!] as [number,number]))
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapInstanceRef.current as any).remove()
        mapInstanceRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-render markers when attendees change (live refresh)
  useEffect(() => {
    if (!mapInstanceRef.current) return
    // Full re-mount on data change is simplest for live refresh
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mapInstanceRef.current as any).remove()
    mapInstanceRef.current = null
    // Trigger re-mount by briefly unmounting — parent should use key={attendees.length}
  }, [attendees.length])

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200" style={{ height: 360 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {/* Legend */}
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