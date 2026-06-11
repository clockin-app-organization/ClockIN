// app/(admin)/events/[eventId]/sessions/new/page.tsx
import SessionForm from "@/components/events/SessionForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link href={`/events/${eventId}`} className="btn-ghost p-2">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Add session</h1>
          <p className="mt-0.5 text-sm text-gray-500 truncate">{event.name}</p>
        </div>
      </div>
      <SessionForm eventId={eventId} />
    </div>
  );
}