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
    setLoading(true);
    const now = new Date().toISOString();
    await supabase
      .from("sessions")
      .update({ status: "ended", ended_at: now, updated_at: now })
      .eq("id", sessionId);
    // Deactivate QR token
    await supabase
      .from("qr_tokens")
      .update({ is_active: false })
      .eq("session_id", sessionId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={end} disabled={loading} className="btn-danger">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
      End session
    </button>
  );
}