"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Play, Loader2 } from "lucide-react";

export default function StartSessionButton({ sessionId }: { sessionId: string }) {
  const router   = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const now = new Date().toISOString();
    await supabase
      .from("sessions")
      .update({ status: "active", started_at: now, updated_at: now })
      .eq("id", sessionId);
    // Activate QR token
    await supabase
      .from("qr_tokens")
      .update({ is_active: true })
      .eq("session_id", sessionId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={start} disabled={loading} className="btn-primary">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      Start session
    </button>
  );
}