// app/(admin)/archive/page.tsx
import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Archive, Eye, FolderOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";
import ArchiveUI from "@/components/pages/archive/ArchiveUI";

export const revalidate = 0;

// Inline types for query results
type EventRow = {
  id: string;
  name: string;
  location: string;
  event_date: string;
  archived_at: string | null;
  status: string;
  creator?: { full_name: string | null; email: string | null } | null;
};

type SessionRow = {
  id: string;
  name: string;
  event_id: string;
  archived_at: string | null;
  status: string;
  event: { id: string; name: string } | null;
};

export default async function ArchivePage() {
  const user = await getUser();

  if (!user) return

  const supabase = await createClient();
  const currentUserId = user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", currentUserId)
    .single();

  const isSuperAdmin = profile?.is_super_admin ?? false;

  // 1. Events query
  let eventQuery = supabase
    .from("events")
    .select("*, creator:profiles!events_created_by_fkey (full_name, email)")
    .in("status", ["ended", "archived"]);

  if (!isSuperAdmin) {
    eventQuery = eventQuery.eq("created_by", currentUserId);
  }

  eventQuery = eventQuery.order("archived_at", { ascending: false, nullsFirst: false });

  // 2. Sessions query
  let sessionQuery = supabase
    .from("sessions")
    .select("*, event:events(id, name, created_by)")
    .in("status", ["ended", "archived"]);

  if (!isSuperAdmin) {
    const { data: userEventIds } = await supabase
      .from("events")
      .select("id")
      .eq("created_by", currentUserId);

    const eventIds = userEventIds?.map((e) => e.id) ?? [];
    if (eventIds.length === 0) {
      return (
        <ArchiveUI
          events={[]}
          sessions={[]}
          totalArchived={0}
          isSuperAdmin={isSuperAdmin}
        />
      );
    }
    sessionQuery = sessionQuery.in("event_id", eventIds);
  }

  sessionQuery = sessionQuery.order("archived_at", { ascending: false, nullsFirst: false });

  // 3. Execute queries
  const [{ data: events }, { data: sessions }] = await Promise.all([
    eventQuery,
    sessionQuery,
  ]);

  const totalArchived = (events?.length ?? 0) + (sessions?.length ?? 0);

  return (
    <ArchiveUI
      events={events ?? []}
      sessions={sessions ?? []}
      totalArchived={totalArchived}
      isSuperAdmin={isSuperAdmin}
    />
  );
}

// Presentational component
