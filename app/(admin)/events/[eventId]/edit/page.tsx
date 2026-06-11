// app/(admin)/events/[eventId]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import EventForm from "@/components/events/EventForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
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
          <h1 className="text-xl font-semibold text-gray-900">Edit event</h1>
          <p className="mt-0.5 text-sm text-gray-500 truncate">{event.name}</p>
        </div>
      </div>
      <EventForm event={event} isEdit />
    </div>
  );
}