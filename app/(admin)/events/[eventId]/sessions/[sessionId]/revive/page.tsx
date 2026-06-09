import AdminShell from '@/components/layout/AdminShell'
import RevivalForm from '@/components/events/RevivalForm'

export default function ReviveSessionPage({
  params,
}: {
  params: { eventId: string; sessionId: string }
}) {
  return (
    <AdminShell>
      <RevivalForm
        type="session"
        id={params.sessionId}
        redirectTo={`/events/${params.eventId}/sessions/${params.sessionId}`}
      />
    </AdminShell>
  )
}