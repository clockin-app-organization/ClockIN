// components/events/SessionForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateToken } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { Session } from '@/lib/types'   // ✅ import your Session type

interface Props {
  eventId: string
  session?: Session
}

export default function SessionForm({ eventId, session }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState(session?.name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (session) {
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ name: name.trim() })
        .eq('id', session.id)
      if (updateError) {
        setError(updateError.message)
      } else {
        router.push(`/events/${eventId}/sessions/${session.id}`)
      }
    } else {
      const token = generateToken()
      const { data: newSession, error: insertError } = await supabase
        .from('sessions')
        .insert({ event_id: eventId, name: name.trim(), status: 'pending', qr_token: token })
        .select('id')
        .single()

      if (insertError) {
        setError(insertError.message)
      } else if (newSession) {
        await supabase.from('qr_tokens').insert({
          token,
          token_type: 'session',
          event_id: eventId,
          session_id: newSession.id,
        })
        router.push(`/events/${eventId}`)
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-md space-y-4">
      <h2 className="text-lg font-semibold">{session ? 'Edit Session' : 'New Session'}</h2>
      <div>
        <label className="label">Session Name *</label>
        <input required value={name} onChange={e => setName(e.target.value)} className="input-base" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : session ? 'Update' : 'Create'}
      </button>
    </form>
  )
}