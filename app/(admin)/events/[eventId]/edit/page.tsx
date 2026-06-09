import AdminShell from '@/components/layout/AdminShell'
import { createClient } from '@/lib/supabase/server'
import EventForm from '@/components/events/EventForm'
import { notFound } from 'next/navigation'

export default async function EditEventPage({ params }: { params: { eventId: string } }) {
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.eventId)
    .single()

  if (!event) notFound()

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <EventForm event={event} isEdit />
    </AdminShell>
  )
}