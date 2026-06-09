import AdminShell from '@/components/layout/AdminShell'
import SessionForm from '@/components/events/SessionForm'

export default function NewSessionPage({ params }: { params: { eventId: string } }) {
  return (
    <AdminShell>
      <SessionForm eventId={params.eventId} />
    </AdminShell>
  )
}