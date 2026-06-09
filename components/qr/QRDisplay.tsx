// smart_attendance/components/qr/QRDisplay.tsx
'use client'
import { QRCodeCanvas } from 'qrcode.react'

export default function QRDisplay({ token, label = 'Scan to attend' }: { token: string; label?: string }) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/attend/${token}` : ''
  return (
    <div className="text-center">
      <div className="bg-white p-4 inline-block rounded-xl shadow">
        <QRCodeCanvas value={url} size={200} level="H" />
      </div>
      <p className="mt-2 text-sm text-gray-500">{label}</p>
    </div>
  )
}