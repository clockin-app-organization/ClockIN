import AdminShell from '@/components/layout/AdminShell'
import { createClient } from '@/lib/supabase/server'
import SessionForm from '@/components/events/SessionForm'
import { notFound } from 'next/navigation'

export default async function EditSessionPage({
  params,
}: {
  params: { eventId: string; sessionId: string }
}) {
  const supabase = await createClient()
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.sessionId)
    .single()

  if (!session) notFound()

  return (
    <AdminShell>
      <SessionForm eventId={params.eventId} session={session} />
    </AdminShell>
  )
}