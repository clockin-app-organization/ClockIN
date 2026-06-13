// components/events/EventStatusWatcher.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function EventStatusWatcher({ eventId }: { eventId: string }) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Poll every 30 seconds
    intervalRef.current = setInterval(async () => {
      try {
        // 1. Get current status
        const { data: before } = await supabase
          .from('events')
          .select('status')
          .eq('id', eventId)
          .single();

        // 2. Run sync
        await supabase.rpc('sync_event_statuses');

        // 3. Get status again
        const { data: after } = await supabase
          .from('events')
          .select('status')
          .eq('id', eventId)
          .single();

        // 4. If it changed, refresh the page
        if (before?.status && after?.status && before.status !== after.status) {
          router.refresh();
        }
      } catch (e) {
        console.error('EventStatusWatcher error:', e);
      }
    }, 30_000); // 30 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [eventId, router]);

  return null;
}