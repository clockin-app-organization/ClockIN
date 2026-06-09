"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ChevronLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

// Used for BOTH event revive and session revive
// Determine scope from URL params
export default function RevivePage() {
  const router   = useRouter();
  const params   = useParams();
  const supabase = createClient();

  const eventId   = params.eventId as string;
  const sessionId = params.sessionId as string | undefined;
  const scopeType = sessionId ? "session" : "event";
  const scopeId   = sessionId ?? eventId;

  const [name,    setName]    = useState("");
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Load the name for display
  useEffect(() => {
    (async () => {
      if (scopeType === "event") {
        const { data } = await supabase.from("events").select("name").eq("id", scopeId).single();
        setName(data?.name ?? "");
      } else {
        const { data } = await supabase.from("sessions").select("name").eq("id", scopeId).single();
        setName(data?.name ?? "");
      }
    })();
  }, [scopeId, scopeType, supabase]);

  async function handleRevive(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) { setError("A reason note is required."); return; }
    setError(""); setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: rpcError } = await supabase.rpc("revive_scope", {
      p_scope_type: scopeType,
      p_scope_id:   scopeId,
      p_note:       note.trim(),
      p_revived_by: user?.id,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.push(sessionId
      ? `/events/${eventId}/sessions/${sessionId}`
      : `/events/${eventId}`
    );
  }

  const backHref = sessionId
    ? `/events/${eventId}/sessions/${sessionId}`
    : `/events/${eventId}`;

  return (
    <div className="mx-auto max-w-md space-y-5 p-4">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="btn-ghost p-2">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold">
          Revive {scopeType === "session" ? "session" : "event"}
        </h1>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          <strong>{name}</strong> will be moved back to <em>upcoming</em> and its QR token
          re-activated. A reason note is mandatory and cannot be edited later.
        </span>
      </div>

      <form onSubmit={handleRevive} className="card space-y-4 p-6">
        <div>
          <label className="label">Reason for revival *</label>
          <textarea
            required
            rows={4}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Event was rescheduled due to venue issue…"
            className="input-base"
          />
          <p className="mt-1 text-xs text-gray-400">
            This note is permanent and cannot be modified once saved.
          </p>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm revival"}
        </button>
      </form>
    </div>
  );
}