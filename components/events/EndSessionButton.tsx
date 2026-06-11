// components/events/EndSessionButton.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Square, Loader2 } from "lucide-react";

export default function EndSessionButton({ sessionId }: { sessionId: string }) {
  const router   = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function end() {
    if (!confirm("End this session? Attendees will no longer be able to check in.")) return;
    setLoading(true);

    const now = new Date().toISOString();

    // Archive the session (no intermediate "ended" status in schema)
    await supabase
      .from("sessions")
      .update({ status: "archived", archived_at: now, updated_at: now })
      .eq("id", sessionId);

    // Deactivate its QR token
    await supabase
      .from("qr_tokens")
      .update({ is_active: false })
      .eq("session_id", sessionId);

    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={end} disabled={loading} className="btn-danger flex items-center gap-2">
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Square className="h-4 w-4" />
      }
      End session
    </button>
  );
}