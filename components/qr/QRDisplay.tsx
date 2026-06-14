// components/qr/QRDisplay.tsx
// Works both in admin (window.location.origin) and generates correct
// /attend/[token] URLs. On Vercel this will be your production domain.
'use client'
import { QRCodeCanvas } from 'qrcode.react'
import { useState } from 'react'
import { Download, QrCode, X } from 'lucide-react'

interface Props {
  token:  string
  label?: string
  showDownload?: boolean
}

export default function QRDisplay({ token, label = 'Scan to attend', showDownload = true }: Props) {
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url    = `${origin}/attend/${token}`

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function downloadQR() {
    const canvas = document.getElementById(`qr-${token}`) as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-${token.slice(0, 8)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <QRCodeCanvas
          id={`qr-${token}`}
          value={url}
          size={200}
          level="H"
          includeMargin
        />
      </div>
      <p className="text-sm text-gray-500 text-center">{label}</p>
      <p className="text-xs text-gray-400 break-all text-center max-w-xs">{url}</p>

      {showDownload && (
        <div className="flex gap-2">
          <button
            onClick={() => setFullscreen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <QrCode className="h-3.5 w-3.5" /> Display QR
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            {copied ? '✓ Copied' : 'Copy link'}
          </button>
          <button
            onClick={downloadQR}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" /> Download QR
          </button>
        </div>
      )}

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="relative flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="bg-white p-6 rounded-2xl shadow-2xl">
              <QRCodeCanvas
                id={`qr-${token}`}
                value={url}
                size={320}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-lg font-medium text-white text-center">{label}</p>
            <p className="text-sm text-white/60 text-center max-w-sm break-all">{url}</p>
          </div>
        </div>
      )}
    </div>
  )
}