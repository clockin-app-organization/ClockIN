'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface Props {
  type: 'event' | 'session'
  id: string
  redirectTo: string
}

export default function RevivalForm({ type, id, redirectTo }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRevive(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const table = type === 'event' ? 'events' : 'sessions'
    const { error: updateError } = await supabase
      .from(table)
      .update({ status: 'upcoming', archived_at: null })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
    } else {
      router.push(redirectTo)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleRevive} className="card p-6 max-w-md space-y-4">
      <h2 className="text-lg font-semibold">Revive {type === 'event' ? 'Event' : 'Session'}</h2>
      <p className="text-sm text-gray-500">
        This will move the {type} from the archive back to upcoming status.
      </p>
      <div>
        <label className="label">Reason (optional)</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} className="input-base" rows={3} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Revival'}
      </button>
    </form>
  )
}