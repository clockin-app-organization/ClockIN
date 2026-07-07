// components/events/EventForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateEventForm, type EventFormErrors } from '@/lib/validation'
import { generateToken } from '@/lib/utils'

import type { Event } from '@/lib/types'

interface Props {
  event?: Event
  isEdit?: boolean
}

function todayLocal(): string {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function addMinutes(hhmm: string, minutes: number): string {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function EventForm({ event, isEdit }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const today = todayLocal()

  const [form, setForm] = useState({
    name:        event?.name        ?? '',
    description: event?.description ?? '',
    location:    event?.location    ?? '',
    event_date:  event?.event_date  ?? today,
    start_time:  event?.start_time  ?? '',
    end_time:    event?.end_time    ?? '',
  })

  // ✅ Typed as EventFormErrors so setErrors(validationErrors) works
  const [errors,   setErrors]   = useState<EventFormErrors>({})
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  function set(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k as keyof EventFormErrors]) {
      setErrors(prev => { const c = { ...prev }; delete c[k as keyof EventFormErrors]; return c })
    }
  }

  const minEndTime   = form.start_time ? addMinutes(form.start_time, 5) : undefined
  const minStartTime = form.event_date === today
    ? (() => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` })()
    : '00:00'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    const validationErrors = validateEventForm({
      name:       form.name,
      location:   form.location,
      event_date: form.event_date,
      start_time: form.start_time,
      end_time:   form.end_time,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)  // ✅ now type-safe
      return
    }

    setLoading(true)
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      location:    form.location.trim(),
      event_date:  form.event_date,
      start_time:  form.start_time,
      end_time:    form.end_time,
    }

    try {
      if (isEdit && event) {
        const { error: updateError } = await supabase.from('events').update(payload).eq('id', event.id)
        if (updateError) throw updateError
        router.push(`/events/${event.id}`)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const token = generateToken()
        const { data: newEvent, error: insertError } = await supabase
          .from('events')
          .insert({ ...payload, has_sessions: false, qr_token: token, created_by: user.id })
          .select('id')
          .single()
        if (insertError) throw insertError
        await supabase.from('qr_tokens').insert({ token, token_type: 'event', event_id: newEvent.id, is_active: true })
        router.push(`/events/${newEvent.id}`)
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div>
        <label className="label">Event name *</label>
        <input required value={form.name} onChange={e => set('name', e.target.value)}
          className={`input-base ${errors.name ? 'border-red-300' : ''}`} placeholder="Annual General Meeting" />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          className="input-base resize-none" rows={3} placeholder="Optional notes about this event" />
      </div>
      <div>
        <label className="label">Location *</label>
        <input required value={form.location} onChange={e => set('location', e.target.value)}
          className={`input-base ${errors.location ? 'border-red-300' : ''}`} placeholder="Main Conference Hall" />
        {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
      </div>
      <div>
        <label className="label">Date *</label>
        <input required type="date" min={today} value={form.event_date}
          onChange={e => {
            const v = e.target.value
            if (v > today) setForm(f => ({ ...f, event_date: v, start_time: '08:00', end_time: '09:00' }))
            else set('event_date', v)
          }}
          className={`input-base ${errors.event_date ? 'border-red-300' : ''}`} />
        {errors.event_date && <p className="mt-1 text-xs text-red-500">{errors.event_date}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Start time *</label>
          <input required type="time" min={minStartTime} value={form.start_time}
            onChange={e => {
              const newStart = e.target.value
              setForm(f => ({
                ...f,
                start_time: newStart,
                end_time: f.end_time && f.end_time <= addMinutes(newStart, 5) ? addMinutes(newStart, 60) : f.end_time,
              }))
              if (errors.start_time) setErrors(p => { const c = { ...p }; delete c.start_time; return c })
            }}
            className={`input-base ${errors.start_time ? 'border-red-300' : ''}`} />
          {errors.start_time && <p className="mt-1 text-xs text-red-500">{errors.start_time}</p>}
        </div>
        <div>
          <label className="label">End time *</label>
          <input required type="time" min={minEndTime} value={form.end_time}
            onChange={e => set('end_time', e.target.value)}
            className={`input-base ${errors.end_time ? 'border-red-300' : ''}`} />
          {errors.end_time
            ? <p className="mt-1 text-xs text-red-500">{errors.end_time}</p>
            : <p className="mt-1 text-[11px] text-gray-400">Min. 5 min after start</p>}
        </div>
      </div>
      {apiError && <p className="text-xs text-red-600">{apiError}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save changes' : 'Create event'}
      </button>
    </form>
  )
}