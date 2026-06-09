'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import type { Event } from '@/lib/types'   // ✅ correct import

interface Props {
  event?: Event
  isEdit?: boolean
}

export default function EventForm({ event, isEdit }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState(event?.name || '')
  const [description, setDescription] = useState(event?.description || '')
  const [location, setLocation] = useState(event?.location || '')
  const [eventDate, setEventDate] = useState(event?.event_date || '')
  const [startTime, setStartTime] = useState(event?.start_time || '')
  const [endTime, setEndTime] = useState(event?.end_time || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      name: name.trim(),
      description,
      location,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime || null,
    }

    if (isEdit && event) {
      const { error: updateError } = await supabase
        .from('events')
        .update(payload)
        .eq('id', event.id)
      if (updateError) setError(updateError.message)
      else router.push(`/events/${event.id}`)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { error: insertError } = await supabase
        .from('events')
        .insert({ ...payload, created_by: user.id })
      if (insertError) setError(insertError.message)
      else router.push('/events')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl card p-6 space-y-4">
      <div>
        <label className="label">Event Name *</label>
        <input required value={name} onChange={e => setName(e.target.value)} className="input-base" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-base" rows={3} />
      </div>
      <div>
        <label className="label">Location *</label>
        <input required value={location} onChange={e => setLocation(e.target.value)} className="input-base" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Date *</label>
          <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="label">Start Time *</label>
          <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="label">End Time</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-base" />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Update Event' : 'Create Event'}
      </button>
    </form>
  )
}