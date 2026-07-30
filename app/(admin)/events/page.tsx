// app/(admin)/events/page.tsx
// Regular admins only see their own events; super admins see all.
import { createClient, getUser } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import type { Event } from "@/lib/types";
import EventsUI from "@/components/pages/event/EventsUI";

export const revalidate = 0;

export default async function EventsPage() {
  const user = await getUser();

  if (!user) return;
  const supabase = await createClient();

  await supabase.rpc("sync_event_statuses");

  // Check if current user is super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.is_super_admin ?? false;

  // Super admins see all events; regular admins only see their own
  let query = supabase
    .from("events")
    .select("*, sessions(count)")
    .neq("status", "archived")
    .order("event_date", { ascending: false });

  if (!isSuperAdmin) {
    query = query.eq("created_by", user.id);
  }

  const { data: events } = await query;

  return (
    <EventsUI
      events={
        (events ?? []) as (Event & {
          sessions: { count: number }[];
        })[]
      }
      isSuperAdmin={isSuperAdmin}
    />
  );
}
