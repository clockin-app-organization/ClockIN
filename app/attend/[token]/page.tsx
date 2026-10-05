import { validateAttendanceToken } from '@/lib/token-validation'
import AttendClient from './AttendClient'
import { X } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AttendPageProps {
  params: Promise<{ token: string }>
}

export default async function AttendPage({ params }: AttendPageProps) {
  const { token } = await params
  const { data: eventData, error } = await validateAttendanceToken(token)

  if (error || !eventData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center dark:bg-slate-900">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
          <X className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Check-in unavailable</h1>
        <p className="text-sm text-gray-500 max-w-xs dark:text-slate-400">
          {error?.message || 'This QR code is invalid or has expired.'}
        </p>
      </div>
    )
  }

  const parsedMaxDistance = Number(process.env.GEOFENCE_MAX_DISTANCE)
  const maxDistance =
    Number.isFinite(parsedMaxDistance) && parsedMaxDistance > 0
      ? parsedMaxDistance
      : 150

  return (
    <AttendClient
      token={token}
      eventData={eventData}
      maxDistance={maxDistance}
    />
  )
}
