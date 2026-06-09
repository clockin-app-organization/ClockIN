// hooks/useAttendees.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Attendee } from "@/lib/types";

export function useAttendees(eventId?: string, sessionId?: string) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading]     = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("attendees").select("*").order("created_at", { ascending: false });
    if (sessionId) q = q.eq("session_id", sessionId);
    else if (eventId) q = q.eq("event_id", eventId).is("session_id", null);
    const { data } = await q;
    setAttendees((data ?? []) as Attendee[]);
    setLoading(false);
  }, [eventId, sessionId]);

  useEffect(() => {
    Promise.resolve().then(fetch);

    // Realtime subscription
    const channel = supabase.channel("attendees-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "attendees",
        filter: sessionId
          ? `session_id=eq.${sessionId}`
          : `event_id=eq.${eventId}`,
      }, () => { fetch(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { attendees, loading, refetch: fetch };
}