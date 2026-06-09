// hooks/useEvent.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/types";

export function useEvent(eventId: string) {
  const [event, setEvent]   = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*, sessions(*)")
      .eq("id", eventId)
      .single();
    setEvent(data as Event);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    const loadEvent = async () => {
      await fetch();
    };

    void loadEvent();
  }, [fetch]);

  return { event, loading, refetch: fetch };
}