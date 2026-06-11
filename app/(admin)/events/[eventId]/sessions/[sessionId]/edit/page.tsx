// app/(admin)/events/[eventId]/sessions/[sessionId]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import SessionForm from "@/components/events/SessionForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditSessionPage({
  params,
}: {
  params: { eventId: string; sessionId: string };
}) {
  const supabase = await createClient();

  const [{ data: session }, { data: event }] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", params.sessionId).single(),
    supabase.from("events").select("id, name").eq("id", params.eventId).single(),
  ]);

  if (!session) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link href={`/events/${params.eventId}/sessions/${params.sessionId}`} className="btn-ghost p-2">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Edit session</h1>
          <p className="mt-0.5 text-sm text-gray-500 truncate">
            {event?.name} › {session.name}
          </p>
        </div>
      </div>
      <SessionForm eventId={params.eventId} session={session} />
    </div>
  );
}